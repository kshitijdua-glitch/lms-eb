import type { CreditReport, Lead, LendingPartner, ProductType, STBStatus, STBSubmission } from "@/types/lms";
import { evaluatePartner } from "@/lib/partnerEligibility";

/**
 * Lending partner API — SANDBOX simulator.
 *
 * Mimics an NBFC/bank application API: submit an application, receive a
 * reference number and an initial decision, then receive webhook-style status
 * updates as the partner processes the file.
 */

export class PartnerApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartnerApiError";
  }
}

const SUBMIT_LATENCY_MS = 1200;

export interface SubmitInput {
  lead: Lead;
  partner: LendingPartner;
  productType: ProductType;
  report?: CreditReport | null;
}

export interface SubmitResult {
  applicationRef: string;
  status: STBStatus;
  sanctionAmount: number | null;
  roi: number | null;
  tenureMonths: number | null;
  decisionReasons: string[];
}

function refFor(partner: LendingPartner, leadId: string) {
  const prefix = partner.name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-7)}-${leadId.replace(/\D/g, "")}`;
}

export async function submitApplication({ lead, partner, productType, report }: SubmitInput): Promise<SubmitResult> {
  await new Promise(r => setTimeout(r, SUBMIT_LATENCY_MS));

  if (partner.status !== "active") {
    throw new PartnerApiError(`${partner.name} integration is currently inactive.`);
  }

  const score = report?.score ?? lead.creditScore;
  const evaluation = evaluatePartner(partner, { ...lead, creditScore: score ?? null }, productType);
  const reasons = [...evaluation.reasons];

  if (!evaluation.eligible) {
    return {
      applicationRef: refFor(partner, lead.id),
      status: "declined",
      sanctionAmount: null,
      roi: null,
      tenureMonths: null,
      decisionReasons: reasons,
    };
  }

  // Eligible — offer sizing driven by income, FOIR headroom and bureau score.
  const headroomFoir = Math.max(0, partner.maxFoir - (lead.foir ?? 0));
  const affordableEmi = Math.round((lead.monthlyIncome * headroomFoir) / 100);
  const roi = Number((10.5 + (820 - Math.min(820, score ?? 700)) * 0.02).toFixed(2));
  const tenureMonths = productType === "home_loan" ? 240 : productType === "loan_against_property" ? 120 : 48;
  const monthlyRate = roi / 12 / 100;
  const maxByEmi = affordableEmi > 0
    ? Math.round((affordableEmi * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)))
    : 0;
  const sanctionAmount = Math.max(50000, Math.round(Math.min(lead.loanAmount, maxByEmi || lead.loanAmount) / 10000) * 10000);

  reasons.push(`Indicative offer: ₹${sanctionAmount.toLocaleString("en-IN")} @ ${roi}% for ${tenureMonths} months`);
  if (report) reasons.push(`Bureau ref ${report.referenceId} · score ${report.score} · ${report.maxDpd} max DPD`);

  return {
    applicationRef: refFor(partner, lead.id),
    status: "submitted",
    sanctionAmount,
    roi,
    tenureMonths,
    decisionReasons: reasons,
  };
}

/** ---------- Webhook-style status progression ---------- */

const STAGE_DWELL_MS: Partial<Record<STBStatus, number>> = {
  submitted: 20000,
  under_review: 30000,
  approved: 45000,
};

export interface PartnerWebhookEvent {
  submissionId: string;
  status: STBStatus;
  note: string;
  eventId: string;
  patch: Partial<STBSubmission>;
}

/**
 * Returns the next webhook event for a submission if enough time has elapsed,
 * otherwise null. Pure and idempotent so it can be polled on a timer.
 */
export function nextWebhookEvent(submission: STBSubmission, now = Date.now()): PartnerWebhookEvent | null {
  const history = submission.statusHistory ?? [];
  const lastAt = new Date(history[history.length - 1]?.at ?? submission.submittedAt).getTime();
  const dwell = STAGE_DWELL_MS[submission.status];
  if (!dwell || now - lastAt < dwell) return null;

  const eventId = `evt-${submission.id}-${submission.status}`;
  const at = new Date(now).toISOString();

  if (submission.status === "submitted") {
    return {
      submissionId: submission.id,
      status: "under_review",
      note: `${submission.partnerName} credit team picked up application ${submission.applicationRef ?? ""}`.trim(),
      eventId,
      patch: { status: "under_review", remarks: "Under credit review at partner" },
    };
  }

  if (submission.status === "under_review") {
    const approve = (submission.sanctionAmount ?? 0) > 0;
    if (approve) {
      return {
        submissionId: submission.id,
        status: "approved",
        note: `${submission.partnerName} approved ₹${(submission.sanctionAmount ?? 0).toLocaleString("en-IN")}`,
        eventId,
        patch: {
          status: "approved",
          approvedAmount: submission.sanctionAmount,
          remarks: "Sanction letter issued",
        },
      };
    }
    return {
      submissionId: submission.id,
      status: "declined",
      note: `${submission.partnerName} declined the application`,
      eventId,
      patch: { status: "declined", remarks: "Declined after credit review" },
    };
  }

  if (submission.status === "approved") {
    return {
      submissionId: submission.id,
      status: "disbursed",
      note: `${submission.partnerName} disbursed ₹${(submission.approvedAmount ?? submission.sanctionAmount ?? 0).toLocaleString("en-IN")}`,
      eventId,
      patch: {
        status: "disbursed",
        disbursedAmount: submission.approvedAmount ?? submission.sanctionAmount,
        disbursementDate: at,
        remarks: "Amount credited to customer account",
      },
    };
  }

  return null;
}

export const STB_STATUS_LABEL: Record<STBStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  declined: "Declined",
  disbursed: "Disbursed",
};
