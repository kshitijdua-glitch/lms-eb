import type { CreditBand, CreditReport, CreditScoreFactor, CreditTradeLine, Lead, UserRole } from "@/types/lms";

/**
 * Experian Griffith — SANDBOX simulator.
 *
 * No network calls and no credentials: this reproduces the shape and latency of
 * a bureau pull so the full credit workflow can be demonstrated end to end.
 * Results are deterministic per PAN, so re-pulling the same customer is stable.
 */

export const BUREAU_NAME = "Experian Griffith";

export class BureauError extends Error {
  code: "NO_HIT" | "UPSTREAM_TIMEOUT" | "INVALID_PAN";
  constructor(code: BureauError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "BureauError";
  }
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function bandForScore(score: number): CreditBand {
  if (score >= 780) return "excellent";
  if (score >= 720) return "good";
  if (score >= 650) return "fair";
  return "poor";
}

export const BAND_LABEL: Record<CreditBand, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  no_history: "No History",
};

const LENDERS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra", "Bajaj Finserv", "IDFC First"];
const ACCOUNT_TYPES = ["Personal Loan", "Auto Loan", "Credit Card", "Consumer Durable Loan", "Home Loan"];

export interface BureauPullInput {
  lead: Pick<Lead, "id" | "name" | "pan" | "mobile" | "dob" | "monthlyIncome" | "creditScore">;
  pulledBy: string;
  pulledByRole: UserRole;
  /** Force a specific failure for demo purposes */
  simulate?: "no_hit" | "timeout";
}

const LATENCY_MS = 1600;

export async function fetchCreditReport({ lead, pulledBy, pulledByRole, simulate }: BureauPullInput): Promise<CreditReport> {
  await new Promise(r => setTimeout(r, LATENCY_MS));

  if (simulate === "no_hit") {
    throw new BureauError("NO_HIT", `No bureau record found for PAN ${lead.pan}. Capture full PAN and retry.`);
  }
  if (simulate === "timeout") {
    throw new BureauError("UPSTREAM_TIMEOUT", "Experian Griffith sandbox did not respond in time. Retry the pull.");
  }
  if (!lead.pan) {
    throw new BureauError("INVALID_PAN", "PAN is required for a bureau enquiry.");
  }

  const seed = hash(`${lead.pan}|${lead.id}`);
  const rnd = seeded(seed);

  // Anchor on the seeded score when present so downstream demo data stays coherent.
  const score = lead.creditScore ?? 560 + Math.floor(rnd() * 290);
  const band = bandForScore(score);

  const accountCount = 1 + Math.floor(rnd() * 4);
  const tradeLines: CreditTradeLine[] = Array.from({ length: accountCount }, (_, i) => {
    const sanctioned = 50000 + Math.floor(rnd() * 1800000);
    const closed = rnd() > 0.72;
    const outstanding = closed ? 0 : Math.floor(sanctioned * (0.25 + rnd() * 0.6));
    const tenure = 12 + Math.floor(rnd() * 72);
    const emi = closed ? 0 : Math.max(1500, Math.round(outstanding / Math.max(6, tenure / 2) / 100) * 100);
    const dpdRoll = rnd();
    const maxDpd = score >= 750 ? 0 : dpdRoll > 0.75 ? [15, 30, 60, 90][Math.floor(rnd() * 4)] : 0;
    const openedMonthsAgo = 3 + Math.floor(rnd() * 70);
    const opened = new Date();
    opened.setMonth(opened.getMonth() - openedMonthsAgo);
    return {
      id: `tl-${lead.id}-${i}`,
      lender: LENDERS[Math.floor(rnd() * LENDERS.length)],
      accountType: ACCOUNT_TYPES[Math.floor(rnd() * ACCOUNT_TYPES.length)],
      sanctionedAmount: sanctioned,
      outstandingAmount: outstanding,
      emi,
      tenure,
      openedAt: opened.toISOString(),
      status: closed ? "closed" : "active",
      maxDpd,
    };
  });

  const active = tradeLines.filter(t => t.status === "active");
  const totalObligations = active.reduce((sum, t) => sum + t.emi, 0);
  const maxDpd = tradeLines.reduce((m, t) => Math.max(m, t.maxDpd), 0);
  const enquiries6m = Math.floor(rnd() * 5);
  const enquiries12m = enquiries6m + Math.floor(rnd() * 5);
  const writeOff = score < 620 && rnd() > 0.7;

  const scoreFactors: CreditScoreFactor[] = [];
  if (maxDpd === 0) {
    scoreFactors.push({ label: "Clean repayment history", impact: "positive", detail: "No days-past-due reported in the last 24 months" });
  } else {
    scoreFactors.push({ label: "Delinquency reported", impact: "negative", detail: `Worst delinquency of ${maxDpd} DPD in last 24 months` });
  }
  if (enquiries6m >= 3) {
    scoreFactors.push({ label: "High recent enquiries", impact: "negative", detail: `${enquiries6m} credit enquiries in the last 6 months` });
  } else {
    scoreFactors.push({ label: "Low enquiry velocity", impact: "positive", detail: `${enquiries6m} enquiries in the last 6 months` });
  }
  const utilisation = active.length
    ? Math.round((active.reduce((s, t) => s + t.outstandingAmount, 0) / active.reduce((s, t) => s + t.sanctionedAmount, 0)) * 100)
    : 0;
  scoreFactors.push({
    label: utilisation > 60 ? "High credit utilisation" : "Healthy credit utilisation",
    impact: utilisation > 60 ? "negative" : "positive",
    detail: `${utilisation}% of sanctioned limits currently utilised`,
  });
  if (active.length > 3) {
    scoreFactors.push({ label: "Multiple active obligations", impact: "negative", detail: `${active.length} active credit accounts` });
  }
  if (writeOff) {
    scoreFactors.push({ label: "Write-off reported", impact: "negative", detail: "A settled/written-off account exists on the bureau file" });
  }

  const ref = `EXP-GRF-${String(seed).slice(0, 8)}`;

  return {
    referenceId: ref,
    bureau: BUREAU_NAME,
    environment: "sandbox",
    pulledAt: new Date().toISOString(),
    pulledBy,
    pulledByRole,
    pan: lead.pan,
    score,
    band,
    scoreFactors,
    tradeLines,
    enquiries6m,
    enquiries12m,
    totalObligations,
    activeAccounts: active.length,
    maxDpd,
    writeOff,
  };
}

/** Bureau pulls are throttled to one every 15 minutes per customer in production. */
export const REPULL_COOLDOWN_MINUTES = 15;

export function repullAvailableAt(report: CreditReport | null | undefined): Date | null {
  if (!report) return null;
  return new Date(new Date(report.pulledAt).getTime() + REPULL_COOLDOWN_MINUTES * 60000);
}
