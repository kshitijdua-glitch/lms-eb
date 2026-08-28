import type { Lead, STBSubmission, UserRole } from "@/types/lms";

/** ---------- Scoping ---------- */

export interface ScopeCtx {
  role: UserRole;
  agentId: string;
  teamId: string;
}

/** Restricts a lead collection to what the current role may see. */
export function scopeLeads(leads: Lead[], ctx: ScopeCtx): Lead[] {
  switch (ctx.role) {
    case "agent":
      return leads.filter(l => l.assignedAgentId === ctx.agentId);
    case "manager":
      return leads.filter(l => l.assignedTeamId === ctx.teamId);
    default:
      return leads;
  }
}

/** ---------- Helpers ---------- */

const MONTH_FMT = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

export const monthKey = (iso: string | Date) => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return MONTH_FMT.format(new Date(y, m - 1, 1));
};

export const allSubmissions = (leads: Lead[]): (STBSubmission & { leadId: string; leadName: string; assignedAgentId: string; assignedTeamId: string; productType: string })[] =>
  leads.flatMap(l =>
    (l.stbSubmissions ?? []).map(s => ({
      ...s,
      leadId: l.id,
      leadName: l.name,
      assignedAgentId: l.assignedAgentId,
      assignedTeamId: l.assignedTeamId,
      productType: l.productType,
    })),
  );

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const isContacted = (l: Lead) => (l.callLogs ?? []).some(c => c.outcome === "connected");

/** ---------- Core KPIs ---------- */

export interface LmsKpis {
  total: number;
  allocated: number;
  contacted: number;
  contactRate: number;
  callsLogged: number;
  bureauPulled: number;
  submitted: number;
  approved: number;
  declined: number;
  disbursed: number;
  disbursedAmount: number;
  sanctionedAmount: number;
  approvalRate: number;
  followUpsPending: number;
  followUpsOverdue: number;
  followUpsToday: number;
  followUpCompliance: number;
  hotLeads: number;
  consentPending: number;
}

export function computeKpis(leads: Lead[]): LmsKpis {
  const subs = allSubmissions(leads);
  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 86400000);

  let pending = 0;
  let overdue = 0;
  let dueToday = 0;
  let completed = 0;
  let scheduled = 0;

  for (const lead of leads) {
    for (const f of lead.followUps ?? []) {
      scheduled += 1;
      if (f.status === "completed") completed += 1;
      if (f.status !== "pending") continue;
      pending += 1;
      const at = new Date(f.scheduledAt);
      if (at < today) overdue += 1;
      else if (at < tomorrow) dueToday += 1;
    }
  }

  const contacted = leads.filter(isContacted).length;
  const approved = subs.filter(s => s.status === "approved" || s.status === "disbursed").length;
  const disbursedSubs = subs.filter(s => s.status === "disbursed");

  return {
    total: leads.length,
    allocated: leads.length,
    contacted,
    contactRate: leads.length ? Math.round((contacted / leads.length) * 100) : 0,
    callsLogged: leads.reduce((n, l) => n + (l.callLogs?.length ?? 0), 0),
    bureauPulled: leads.filter(l => !!l.creditReport).length,
    submitted: subs.length,
    approved,
    declined: subs.filter(s => s.status === "declined").length,
    disbursed: disbursedSubs.length,
    disbursedAmount: disbursedSubs.reduce((n, s) => n + (s.disbursedAmount ?? 0), 0),
    sanctionedAmount: subs.reduce((n, s) => n + (s.sanctionAmount ?? 0), 0),
    approvalRate: subs.length ? Math.round((approved / subs.length) * 100) : 0,
    followUpsPending: pending,
    followUpsOverdue: overdue,
    followUpsToday: dueToday,
    followUpCompliance: scheduled ? Math.round((completed / scheduled) * 100) : 0,
    hotLeads: leads.filter(l => l.priority === "hot").length,
    consentPending: leads.filter(l => l.consentStatus !== "received").length,
  };
}

/** ---------- Funnel ---------- */

export interface FunnelStep {
  label: string;
  value: number;
  pctOfTop: number;
}

export function computeFunnel(leads: Lead[]): FunnelStep[] {
  const k = computeKpis(leads);
  const steps = [
    { label: "Allocated", value: k.allocated },
    { label: "Contacted", value: k.contacted },
    { label: "Bureau Pulled", value: k.bureauPulled },
    { label: "Submitted", value: k.submitted },
    { label: "Approved", value: k.approved },
    { label: "Disbursed", value: k.disbursed },
  ];
  const top = steps[0].value || 1;
  return steps.map(s => ({ ...s, pctOfTop: Math.round((s.value / top) * 100) }));
}

/** ---------- Monthly trend ---------- */

export interface MonthlyPoint {
  key: string;
  month: string;
  allocated: number;
  contacted: number;
  contactRate: number;
  callsLogged: number;
  stbCount: number;
  stbRate: number;
  approved: number;
  declined: number;
  disbursedCount: number;
  disbursedAmount: number;
  followUpCompliance: number;
}

export function monthlySeries(leads: Lead[], months = 6): MonthlyPoint[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }

  const base = new Map<string, MonthlyPoint>(
    keys.map(k => [
      k,
      {
        key: k,
        month: monthLabel(k),
        allocated: 0,
        contacted: 0,
        contactRate: 0,
        callsLogged: 0,
        stbCount: 0,
        stbRate: 0,
        approved: 0,
        declined: 0,
        disbursedCount: 0,
        disbursedAmount: 0,
        followUpCompliance: 0,
      },
    ]),
  );

  const fuTotals = new Map<string, { done: number; total: number }>(keys.map(k => [k, { done: 0, total: 0 }]));

  for (const lead of leads) {
    const aKey = monthKey(lead.allocatedAt || lead.createdAt);
    const row = base.get(aKey);
    if (row) {
      row.allocated += 1;
      if (isContacted(lead)) row.contacted += 1;
    }

    for (const c of lead.callLogs ?? []) {
      const r = base.get(monthKey(c.timestamp));
      if (r) r.callsLogged += 1;
    }

    for (const f of lead.followUps ?? []) {
      const t = fuTotals.get(monthKey(f.scheduledAt));
      if (!t) continue;
      t.total += 1;
      if (f.status === "completed") t.done += 1;
    }

    for (const s of lead.stbSubmissions ?? []) {
      const r = base.get(monthKey(s.submittedAt));
      if (!r) continue;
      r.stbCount += 1;
      if (s.status === "approved" || s.status === "disbursed") r.approved += 1;
      if (s.status === "declined") r.declined += 1;
      if (s.status === "disbursed") {
        r.disbursedCount += 1;
        r.disbursedAmount += s.disbursedAmount ?? 0;
      }
    }
  }

  return keys.map(k => {
    const r = base.get(k)!;
    const fu = fuTotals.get(k)!;
    return {
      ...r,
      contactRate: r.allocated ? Math.round((r.contacted / r.allocated) * 100) : 0,
      stbRate: r.allocated ? Math.round((r.stbCount / r.allocated) * 100) : 0,
      followUpCompliance: fu.total ? Math.round((fu.done / fu.total) * 100) : 0,
    };
  });
}

/** ---------- Breakdowns ---------- */

export interface AgentMetricRow extends LmsKpis {
  agentId: string;
  agentName: string;
  teamName: string;
  lastActivityAt: string | null;
}

export function agentBreakdown(
  leads: Lead[],
  agentList: { id: string; name: string; teamName: string }[],
): AgentMetricRow[] {
  return agentList
    .map(a => {
      const own = leads.filter(l => l.assignedAgentId === a.id);
      const last = own
        .map(l => l.lastActivityAt)
        .filter(Boolean)
        .sort()
        .pop();
      return {
        agentId: a.id,
        agentName: a.name,
        teamName: a.teamName,
        lastActivityAt: last ?? null,
        ...computeKpis(own),
      };
    })
    .filter(r => r.total > 0)
    .sort((a, b) => b.disbursed - a.disbursed || b.submitted - a.submitted || b.contactRate - a.contactRate);
}

export interface PartnerMetricRow {
  partnerId: string;
  partnerName: string;
  submitted: number;
  approved: number;
  declined: number;
  disbursed: number;
  pending: number;
  approvalRate: number;
  disbursedAmount: number;
  avgTat: number;
}

export function partnerBreakdown(leads: Lead[]): PartnerMetricRow[] {
  const map = new Map<string, PartnerMetricRow & { tatSum: number; tatCount: number }>();
  for (const s of allSubmissions(leads)) {
    const row =
      map.get(s.partnerId) ??
      {
        partnerId: s.partnerId,
        partnerName: s.partnerName,
        submitted: 0,
        approved: 0,
        declined: 0,
        disbursed: 0,
        pending: 0,
        approvalRate: 0,
        disbursedAmount: 0,
        avgTat: 0,
        tatSum: 0,
        tatCount: 0,
      };
    row.submitted += 1;
    if (s.status === "approved" || s.status === "disbursed") row.approved += 1;
    if (s.status === "declined") row.declined += 1;
    if (s.status === "disbursed") {
      row.disbursed += 1;
      row.disbursedAmount += s.disbursedAmount ?? 0;
    }
    if (s.status === "submitted" || s.status === "under_review") row.pending += 1;

    const decided = (s.statusHistory ?? []).find(h => h.status === "approved" || h.status === "declined" || h.status === "disbursed");
    if (decided) {
      row.tatSum += Math.max(0, new Date(decided.at).getTime() - new Date(s.submittedAt).getTime()) / 86400000;
      row.tatCount += 1;
    }
    map.set(s.partnerId, row);
  }
  return [...map.values()]
    .map(r => ({
      partnerId: r.partnerId,
      partnerName: r.partnerName,
      submitted: r.submitted,
      approved: r.approved,
      declined: r.declined,
      disbursed: r.disbursed,
      pending: r.pending,
      approvalRate: r.submitted ? Math.round((r.approved / r.submitted) * 100) : 0,
      disbursedAmount: r.disbursedAmount,
      avgTat: r.tatCount ? Math.round((r.tatSum / r.tatCount) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.submitted - a.submitted);
}

export function stageBreakdown(leads: Lead[]) {
  const map = new Map<string, number>();
  for (const l of leads) map.set(l.stage, (map.get(l.stage) ?? 0) + 1);
  return [...map.entries()].map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count);
}

export function dispositionBreakdown(leads: Lead[]) {
  const map = new Map<string, number>();
  for (const l of leads) {
    for (const c of l.callLogs ?? []) map.set(c.disposition, (map.get(c.disposition) ?? 0) + 1);
  }
  return [...map.entries()].map(([disposition, count]) => ({ disposition, count })).sort((a, b) => b.count - a.count);
}

/** ---------- Formatting ---------- */

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const inrCompact = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

export const delta = (current: number, previous: number) => {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};
