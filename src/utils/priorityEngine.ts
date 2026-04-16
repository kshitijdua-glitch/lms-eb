import type { Lead, Priority, DispositionType } from "@/types/lms";

export interface PriorityFactor {
  key: string;
  label: string;
  description: string;
  weight: number;
  enabled: boolean;
}

export interface PriorityConfig {
  factors: PriorityFactor[];
  thresholds: {
    hot: number;
    warm: number;
  };
}

export const defaultPriorityConfig: PriorityConfig = {
  factors: [
    { key: "highLoanAmount", label: "High Loan Amount", description: "Loan amount ≥ ₹10L", weight: 2, enabled: true },
    { key: "highIncome", label: "High Income", description: "Monthly income ≥ ₹50K", weight: 1, enabled: true },
    { key: "goodCreditScore", label: "Good Credit Score", description: "Credit score ≥ 750", weight: 2, enabled: true },
    { key: "lowFOIR", label: "Low FOIR", description: "FOIR < 40%", weight: 1, enabled: true },
    { key: "recentActivity", label: "Recent Activity", description: "Activity within last 2 days", weight: 1, enabled: true },
    { key: "followUpDisposition", label: "Follow-Up Disposition", description: "Lead has a follow-up disposition", weight: 1, enabled: true },
    { key: "lowCreditScore", label: "Low Credit Score", description: "Credit score < 600 (penalty)", weight: -2, enabled: true },
    { key: "highFOIR", label: "High FOIR", description: "FOIR > 60% (penalty)", weight: -1, enabled: true },
    { key: "highRetryCount", label: "High Retry Count", description: "Retry count > 5 (penalty)", weight: -1, enabled: true },
    { key: "lowLoanAmount", label: "Low Loan Amount", description: "Loan amount < ₹1L (penalty)", weight: -1, enabled: true },
    { key: "staleActivity", label: "Stale Activity", description: "No activity for > 14 days (penalty)", weight: -2, enabled: true },
  ],
  thresholds: {
    hot: 5,
    warm: 2,
  },
};

const followUpDispositions: DispositionType[] = [
  "hot_follow_up", "warm_follow_up", "cold_follow_up",
  "document_follow_up", "callback_requested", "price_discussion_pending", "stb_qualified",
];

export function calculatePriorityScore(lead: Lead, config: PriorityConfig): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const factorMap = Object.fromEntries(config.factors.map(f => [f.key, f]));

  const check = (key: string, condition: boolean, reason: string) => {
    const factor = factorMap[key];
    if (!factor || !factor.enabled || !condition) return;
    score += factor.weight;
    reasons.push(`${reason} (${factor.weight > 0 ? "+" : ""}${factor.weight})`);
  };

  check("highLoanAmount", lead.loanAmount >= 1000000, "Loan ≥ ₹10L");
  check("highIncome", lead.monthlyIncome >= 50000, "Income ≥ ₹50K");
  check("goodCreditScore", (lead.creditScore ?? 0) >= 750, "Credit ≥ 750");
  check("lowFOIR", lead.foir < 40, "FOIR < 40%");

  const daysSinceActivity = Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / 86400000);
  check("recentActivity", daysSinceActivity <= 2, "Active ≤ 2 days");
  check("followUpDisposition", followUpDispositions.includes(lead.disposition), "Follow-up disposition");
  check("lowCreditScore", lead.creditScore !== null && lead.creditScore < 600, "Credit < 600");
  check("highFOIR", lead.foir > 60, "FOIR > 60%");
  check("highRetryCount", lead.retryCount > 5, "Retries > 5");
  check("lowLoanAmount", lead.loanAmount < 100000, "Loan < ₹1L");
  check("staleActivity", daysSinceActivity > 14, "Inactive > 14 days");

  return { score, reasons };
}

export function calculatePriority(lead: Lead, config: PriorityConfig = defaultPriorityConfig): Priority {
  const { score } = calculatePriorityScore(lead, config);
  if (score >= config.thresholds.hot) return "hot";
  if (score >= config.thresholds.warm) return "warm";
  return "cold";
}
