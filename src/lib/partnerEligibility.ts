import type { Lead, LendingPartner, ProductType } from "@/types/lms";

export interface PartnerEligibilityResult {
  partner: LendingPartner;
  eligible: boolean;
  reasons: string[];
  /** Top-line one-sentence reason. */
  summary: string;
}

/**
 * Evaluate a lending partner against a lead for a given product. Pure function.
 */
export function evaluatePartner(
  partner: LendingPartner,
  lead: Pick<Lead, "creditScore" | "foir" | "monthlyIncome" | "productType">,
  productType: string,
): PartnerEligibilityResult {
  const reasons: string[] = [];
  let eligible = true;

  if (partner.status !== "active") {
    return { partner, eligible: false, reasons: ["Partner is inactive"], summary: "Inactive partner" };
  }

  if (!partner.products.includes(productType as ProductType)) {
    return { partner, eligible: false, reasons: [`Does not offer ${productType.replace(/_/g, " ")}`], summary: "Product not supported" };
  }

  if (lead.creditScore != null) {
    if (lead.creditScore < partner.minCreditScore) {
      eligible = false;
      reasons.push(`Rejected: credit score ${lead.creditScore} below ${partner.minCreditScore}`);
    } else {
      reasons.push(`Eligible: credit score ${lead.creditScore} ≥ ${partner.minCreditScore}`);
    }
  } else {
    reasons.push(`Credit score not captured (min ${partner.minCreditScore})`);
  }

  if (lead.foir != null) {
    if (lead.foir > partner.maxFoir) {
      eligible = false;
      reasons.push(`Rejected: FOIR ${lead.foir}% above ${partner.maxFoir}%`);
    } else {
      reasons.push(`Eligible: FOIR within ${partner.maxFoir}%`);
    }
  }

  if (lead.monthlyIncome != null) {
    if (lead.monthlyIncome < partner.minIncome) {
      eligible = false;
      reasons.push(`Rejected: income ₹${lead.monthlyIncome.toLocaleString()} below ₹${partner.minIncome.toLocaleString()}`);
    } else {
      reasons.push(`Eligible: income ≥ ₹${partner.minIncome.toLocaleString()}`);
    }
  }

  const summary = eligible
    ? "Eligible — meets all BRE thresholds"
    : reasons.find(r => r.startsWith("Rejected")) || "Ineligible";

  return { partner, eligible, reasons, summary };
}

export function evaluateAllPartners(
  partners: LendingPartner[],
  lead: Pick<Lead, "creditScore" | "foir" | "monthlyIncome" | "productType">,
  productType: string,
): PartnerEligibilityResult[] {
  return partners
    .filter(p => p.products.includes(productType as ProductType))
    .map(p => evaluatePartner(p, lead, productType))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible));
}

/**
 * Outcome → disposition taxonomy.
 * Aligned with Section 5.6 of the Frontend Change Requirements:
 * - Connected:  Interested, Not Interested, Callback Requested, Documents Pending, Needs More Information
 * - Not Connected: Switched Off, Number Busy, No Response, Ringing, Not Reachable
 * - Invalid: Wrong Number, Invalid Number, Duplicate Lead
 * - Compliance: Do Not Contact, Customer Complaint
 */
export type CallOutcome = "connected" | "not_connected" | "invalid" | "compliance";

export const OUTCOME_LABELS: Record<CallOutcome, string> = {
  connected: "Connected",
  not_connected: "Not Connected",
  invalid: "Invalid",
  compliance: "Compliance",
};

export const DISPOSITION_BY_OUTCOME: Record<CallOutcome, { type: string; label: string }[]> = {
  connected: [
    { type: "connected_interested", label: "Interested" },
    { type: "connected_not_interested", label: "Not Interested" },
    { type: "callback_requested", label: "Callback Requested" },
    { type: "documents_pending", label: "Documents Pending" },
    { type: "needs_more_information", label: "Needs More Information" },
  ],
  not_connected: [
    { type: "switched_off", label: "Switched Off" },
    { type: "number_busy", label: "Number Busy" },
    { type: "no_response", label: "No Response" },
    { type: "ringing", label: "Ringing" },
    { type: "not_reachable", label: "Not Reachable" },
  ],
  invalid: [
    { type: "wrong_number", label: "Wrong Number" },
    { type: "invalid_number", label: "Invalid Number" },
    { type: "duplicate_lead", label: "Duplicate Lead" },
  ],
  compliance: [
    { type: "do_not_contact", label: "Do Not Contact" },
    { type: "customer_complaint", label: "Customer Complaint" },
  ],
};

/**
 * Default behavioural rules per outcome — drive conditional fields.
 * These can be overridden by the Configuration > Call Rules screen later.
 */
export const OUTCOME_RULES: Record<CallOutcome, {
  notesRequired: boolean;
  followUpRequired: boolean;
  durationRequired: boolean;
  blocksFurtherCalls: boolean;
}> = {
  connected:     { notesRequired: false, followUpRequired: false, durationRequired: true,  blocksFurtherCalls: false },
  not_connected: { notesRequired: false, followUpRequired: true,  durationRequired: false, blocksFurtherCalls: false },
  invalid:       { notesRequired: true,  followUpRequired: false, durationRequired: false, blocksFurtherCalls: false },
  compliance:    { notesRequired: true,  followUpRequired: false, durationRequired: false, blocksFurtherCalls: true  },
};

/** Dispositions where notes are required regardless of outcome rule. */
export const DISPOSITION_NOTES_REQUIRED = new Set<string>([
  "connected_not_interested",
  "callback_requested",
  "documents_pending",
  "needs_more_information",
  "wrong_number",
  "duplicate_lead",
  "do_not_contact",
  "customer_complaint",
]);

/** Dispositions that require a follow-up to be scheduled. */
export const DISPOSITION_FOLLOWUP_REQUIRED = new Set<string>([
  "callback_requested",
  "documents_pending",
  "needs_more_information",
  "switched_off",
  "number_busy",
  "no_response",
  "ringing",
  "not_reachable",
]);

