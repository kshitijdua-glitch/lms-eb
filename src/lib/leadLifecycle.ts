/**
 * Lead lifecycle definitions per Master PRD §6.
 * The `LeadStage` union in types/lms.ts is the source of truth; this file
 * provides labels, ordering, and transition guards.
 */
import type { LeadStage, UserRole } from "@/types/lms";

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  interested: "Interested",
  bank_selected: "Bank Selected",
  ready_for_slp: "Ready for SLP",
  sent_to_lp: "Sent to Lending Partner",
  stb_submitted: "Sent to Lending Partner", // legacy alias
  approved: "Approved",
  declined: "Declined",
  disbursed: "Disbursed",
  closed_lost: "Closed Lost",
  rejected: "Rejected",
  invalid: "Invalid",
  profile_correction: "Profile Correction Required",
  compliance_hold: "Compliance Hold",
  expired: "Expired",
};

export const CLOSED_STAGES: LeadStage[] = [
  "disbursed", "closed_lost", "rejected", "invalid", "expired",
];

export const SLP_BLOCKED_STAGES: LeadStage[] = [
  ...CLOSED_STAGES, "declined", "compliance_hold",
];

/** Map legacy stage value → canonical PRD stage. */
export function canonicalStage(stage: LeadStage): LeadStage {
  if (stage === "stb_submitted") return "sent_to_lp";
  return stage;
}

/** Whether a role may transition between two stages. */
export function canTransition(role: UserRole, from: LeadStage, to: LeadStage): boolean {
  const a = canonicalStage(from);
  const b = canonicalStage(to);
  if (role === "agent") {
    if (CLOSED_STAGES.includes(a)) return false;
    // Forward only, no SLP-status updates
    if (a === "sent_to_lp" || a === "approved") return false;
    return true;
  }
  if (role === "manager" || role === "cluster_head") return true;
  if (role === "data_admin") return false;
  return false;
}

export function isClosed(stage: LeadStage): boolean {
  return CLOSED_STAGES.includes(canonicalStage(stage));
}
