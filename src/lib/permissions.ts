import type { Lead, STBSubmission, UserRole } from "@/types/lms";

/**
 * Route-level access map. Keys can be exact paths or path prefixes
 * (matched via startsWith for ones ending in `/`).
 */
type RouteRule = { path: string; roles: UserRole[]; prefix?: boolean };

const RULES: RouteRule[] = [
  // Open to all authenticated roles
  { path: "/", roles: ["agent", "manager", "cluster_head", "data_admin"] },
  { path: "/leads", roles: ["agent", "manager", "cluster_head", "data_admin"], prefix: true },
  { path: "/follow-ups", roles: ["agent", "manager", "cluster_head", "data_admin"] },
  { path: "/stb", roles: ["agent", "manager", "cluster_head", "data_admin"] },
  { path: "/performance", roles: ["agent", "manager", "cluster_head", "data_admin"] },

  // Reports — managers and above
  { path: "/reports", roles: ["manager", "cluster_head", "data_admin"] },

  // Group routes — managers and cluster heads
  { path: "/group-", roles: ["manager", "cluster_head"], prefix: true },

  // Org routes — cluster heads only (data_admin uses admin/* mirrors)
  { path: "/org-", roles: ["cluster_head", "data_admin"], prefix: true },

  // Org-wide ops — cluster heads + data admin
  { path: "/staff-management", roles: ["cluster_head", "data_admin"] },
  { path: "/system-config", roles: ["cluster_head", "data_admin"] },
  { path: "/audit-trail", roles: ["cluster_head", "data_admin"] },
  { path: "/lead-allocation", roles: ["cluster_head", "data_admin"] },

  // Admin portal — primarily data_admin; allocation also for cluster_head
  { path: "/admin/allocation", roles: ["cluster_head", "data_admin"] },
  { path: "/admin/", roles: ["data_admin"], prefix: true },
];

export function isRouteAllowed(role: UserRole, pathname: string): boolean {
  // Find the most specific matching rule (longest match wins)
  const matches = RULES.filter(r =>
    r.prefix ? pathname.startsWith(r.path) : pathname === r.path,
  );
  if (matches.length === 0) return true; // unknown routes (e.g. 404) fall through
  matches.sort((a, b) => b.path.length - a.path.length);
  return matches[0].roles.includes(role);
}

export function rolesForRoute(pathname: string): UserRole[] | null {
  const matches = RULES.filter(r =>
    r.prefix ? pathname.startsWith(r.path) : pathname === r.path,
  );
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.path.length - a.path.length);
  return matches[0].roles;
}

// ---------- Action-level guards ----------

export const can = {
  exportPII: (role: UserRole) => role === "cluster_head" || role === "data_admin",
  exportTeamSummary: (role: UserRole) => role !== "agent",
  exportAny: (role: UserRole) => role !== "agent",
  reassign: (role: UserRole) => role === "manager" || role === "cluster_head" || role === "data_admin",
  editLead: (role: UserRole) => role !== "data_admin", // data_admin can edit metadata only via admin tools
  sendToBank: (role: UserRole) => role === "agent" || role === "manager" || role === "cluster_head",
  backdateBeyond24h: (role: UserRole) => role !== "agent",
  viewLeadSource: (role: UserRole) => role !== "agent",
  updateStbStatus: (role: UserRole) => role === "cluster_head" || role === "data_admin",
  overrideClosedLead: (role: UserRole) => role === "manager" || role === "cluster_head",
  configureSystem: (role: UserRole) => role === "cluster_head" || role === "data_admin",
  uploadLeads: (role: UserRole) => role === "data_admin",
  allocateLeads: (role: UserRole) => role === "cluster_head" || role === "data_admin",
};

// ---------- STB lock helpers ----------

export const STB_TERMINAL_STATUSES: STBSubmission["status"][] = [
  "submitted",
  "approved",
  "declined",
  "disbursed",
];

export interface LeadLockState {
  locked: boolean;
  submission?: STBSubmission;
  reason?: string;
  allowedNextAction?: string;
}

export function getLeadLockState(lead: Pick<Lead, "stbSubmissions">): LeadLockState {
  const blocking = lead.stbSubmissions.find(s => STB_TERMINAL_STATUSES.includes(s.status));
  if (!blocking) return { locked: false };

  const allowedNextAction =
    blocking.status === "submitted" ? "Awaiting bank decision — track status only"
      : blocking.status === "approved" ? "Approved — proceed to disbursement"
      : blocking.status === "declined" ? "Declined — close lead or override (Manager)"
      : "Disbursed — lead closed";

  return {
    locked: true,
    submission: blocking,
    reason: `STB ${blocking.status} with ${blocking.partnerName}`,
    allowedNextAction,
  };
}
