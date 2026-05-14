/**
 * Send to Lending Partner (SLP) — formerly STB.
 * Implements Master PRD §10 readiness, status mapping, and locked fields.
 */
import type { Lead, LeadStage, STBSubmission } from "@/types/lms";
import { calculateFoir } from "./foir";
import { SLP_BLOCKED_STAGES, canonicalStage } from "./leadLifecycle";

export type SLPStatus = STBSubmission["status"]; // includes new statuses after types update
export const ACTIVE_SLP_STATUSES: SLPStatus[] = [
  "submitted", "documents_pending", "under_review", "approved",
] as SLPStatus[];

export interface ReadinessCheck {
  key: string;
  label: string;
  passed: boolean;
  hint?: string;
}

export function getSLPReadiness(lead: Lead, partnerSelected: boolean = true): ReadinessCheck[] {
  const foir = calculateFoir(lead.existingObligations, lead.monthlyIncome);
  const stage = canonicalStage(lead.stage);
  const hasActiveSlp = lead.stbSubmissions.some(s => (ACTIVE_SLP_STATUSES as string[]).includes(s.status));
  return [
    { key: "mobile", label: "Mobile number captured", passed: !!lead.mobile },
    { key: "pan", label: "PAN captured", passed: !!lead.pan, hint: "PAN required for partner submission" },
    { key: "income", label: "Monthly income > 0", passed: lead.monthlyIncome > 0 },
    { key: "obligation", label: "Monthly obligation captured", passed: lead.existingObligations != null && lead.existingObligations >= 0 },
    { key: "foir", label: "FOIR calculated", passed: foir != null },
    { key: "credit", label: "Credit score captured", passed: lead.creditScore != null },
    { key: "product", label: "Product selected", passed: !!lead.productType },
    { key: "partner", label: "Lending partner selected", passed: partnerSelected, hint: "Pick at least one eligible partner" },
    { key: "stage", label: "Lead in open status", passed: !SLP_BLOCKED_STAGES.includes(stage), hint: `Blocked in ${stage}` },
    { key: "no_active_slp", label: "No active SLP for this lead", passed: !hasActiveSlp, hint: "One active SLP per lead allowed" },
  ];
}

export function isSLPReady(lead: Lead, partnerSelected: boolean = true): boolean {
  return getSLPReadiness(lead, partnerSelected).every(c => c.passed);
}

/** SLP status → Lead stage mapping (PRD §10.17). */
export function leadStageFromSLP(status: SLPStatus): LeadStage {
  switch (status) {
    case "submitted":
    case "documents_pending":
    case "under_review":
      return "sent_to_lp";
    case "approved": return "approved";
    case "declined": return "declined";
    case "disbursed": return "disbursed";
    case "cancelled": return "bank_selected";
    case "expired": return "expired";
    default: return "sent_to_lp";
  }
}

/** Fields locked once an SLP submission is active (PRD §10.18). */
export const POST_SLP_LOCKED_FIELDS = [
  "pan", "productType", "monthlyIncome", "existingObligations",
  "foir", "creditScore", "selectedPartner", "existingLoans",
] as const;

export function isFieldLockedAfterSLP(field: string, lead: Lead): boolean {
  if (!(POST_SLP_LOCKED_FIELDS as readonly string[]).includes(field)) return false;
  return lead.stbSubmissions.some(s => (ACTIVE_SLP_STATUSES as string[]).includes(s.status))
    || ["sent_to_lp", "approved", "disbursed", "stb_submitted"].includes(canonicalStage(lead.stage));
}

export const SLP_STATUS_LABELS: Record<string, string> = {
  submitted: "Sent to Lending Partner",
  documents_pending: "Documents Pending",
  under_review: "Under Review",
  approved: "Approved",
  declined: "Declined",
  disbursed: "Disbursed",
  cancelled: "Cancelled",
  expired: "Expired",
};
