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
 * Disposition taxonomy filtered by call outcome.
 * Aligned with product spec.
 */
export const DISPOSITION_BY_OUTCOME: Record<"connected" | "not_connected" | "invalid", { type: string; label: string }[]> = {
  connected: [
    { type: "connected_interested", label: "Interested" },
    { type: "hot_follow_up", label: "Hot Follow-Up" },
    { type: "warm_follow_up", label: "Warm Follow-Up" },
    { type: "document_follow_up", label: "Document Follow-Up" },
    { type: "stb_qualified", label: "STB Qualified" },
    { type: "already_has_loan", label: "Already Has Loan" },
    { type: "connected_not_interested", label: "Not Interested" },
    { type: "callback_requested", label: "Callback Requested" },
  ],
  not_connected: [
    { type: "no_response", label: "No Response / Ringing" },
    { type: "number_busy", label: "Busy" },
    { type: "switched_off", label: "Switched Off" },
    { type: "not_contactable", label: "Not Reachable" },
  ],
  invalid: [
    { type: "invalid_number", label: "Invalid Number" },
    { type: "pan_not_available", label: "PAN Not Available" },
    { type: "income_proof_not_ready", label: "Income Proof Not Ready" },
  ],
};
