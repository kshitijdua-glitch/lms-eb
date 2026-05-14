/**
 * FOIR (Fixed Obligation to Income Ratio) — calculated, never editable.
 * Per Master PRD §11.
 */
export function calculateFoir(monthlyObligation: number | null | undefined, monthlyIncome: number | null | undefined): number | null {
  if (monthlyIncome == null || monthlyIncome <= 0) return null;
  if (monthlyObligation == null || monthlyObligation < 0) return null;
  return Math.round((monthlyObligation / monthlyIncome) * 10000) / 100; // 2 decimals
}

export function formatFoir(foir: number | null | undefined): string {
  if (foir == null || isNaN(foir)) return "—";
  return `${foir.toFixed(2)}%`;
}

/** Lead-shaped helper. */
export function leadFoir(lead: { monthlyObligation?: number; existingObligations?: number; monthlyIncome: number }): number | null {
  const obligation = lead.monthlyObligation ?? lead.existingObligations ?? 0;
  return calculateFoir(obligation, lead.monthlyIncome);
}
