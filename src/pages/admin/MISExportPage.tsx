import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BarChart3,
  Database,
  Download,
  Eye,
  FileText,
  Gauge,
  Handshake,
  Send,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { useLmsData } from "@/contexts/LmsDataContext";
import { can } from "@/lib/permissions";
import { agents, teams, getDispositionLabel, getStageLabel, getProductLabel } from "@/data/mockData";
import { allSubmissions, dispositionBreakdown, inr, partnerBreakdown, scopeLeads } from "@/lib/metrics";
import { buildCsv, dateStamp, downloadCsv, maskValue, type CsvColumn } from "@/lib/csv";
import { EmptyState } from "@/components/EmptyState";
import type { Lead } from "@/types/lms";

type ExportId =
  | "full_lead"
  | "disposition"
  | "stb_pipeline"
  | "source_attribution"
  | "agent_activity"
  | "staff_profile"
  | "partner_performance"
  | "bureau_summary";

interface ExportDef {
  id: ExportId;
  label: string;
  icon: typeof Database;
  description: string;
  pii: boolean;
}

const exportTypes: ExportDef[] = [
  { id: "full_lead", label: "Full Lead Export", icon: Database, description: "All lead fields including PAN, mobile and email", pii: true },
  { id: "disposition", label: "Disposition Summary", icon: BarChart3, description: "Call disposition counts across the selected period", pii: false },
  { id: "stb_pipeline", label: "Partner Pipeline", icon: Send, description: "Every partner application with status, TAT and amounts", pii: false },
  { id: "source_attribution", label: "Source Attribution", icon: FileText, description: "Lead source volume, contact rate and conversions", pii: false },
  { id: "agent_activity", label: "Agent Activity", icon: Users, description: "Agent-wise calls, follow-up compliance and conversions", pii: false },
  { id: "partner_performance", label: "Partner Performance", icon: Handshake, description: "Approval rate, TAT and disbursal value by lending partner", pii: false },
  { id: "bureau_summary", label: "Bureau Pull Summary", icon: Gauge, description: "Credit pulls with score band, FOIR and obligations", pii: true },
  { id: "staff_profile", label: "Staff Profile", icon: UserCog, description: "Staff hierarchy, status and contact details", pii: true },
];

type ExportHistoryItem = { id: string; label: string; rows: number; at: string; actor: string; reason?: string };

const MISExportPage = () => {
  const { role, currentAgentId, currentTeamId } = useRole();
  const { logAudit } = useAudit();
  const { leads } = useLmsData();
  const actor = buildActor(role, currentAgentId);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [teamFilter, setTeamFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  const [preview, setPreview] = useState<{ label: string; header: string[]; rows: string[][]; total: number } | null>(null);
  const [piiConfirm, setPiiConfirm] = useState<ExportDef | null>(null);
  const [piiReason, setPiiReason] = useState("");
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  const canPii = can.exportPII(role);

  /** Filters applied to the actual live lead data. */
  const filtered = useMemo(() => {
    const from = new Date(dateFrom).getTime();
    const to = new Date(dateTo).getTime() + 86400000 - 1;
    return scopeLeads(leads, { role, agentId: currentAgentId, teamId: currentTeamId }).filter(l => {
      const t = new Date(l.allocatedAt || l.createdAt).getTime();
      if (Number.isFinite(from) && t < from) return false;
      if (Number.isFinite(to) && t > to) return false;
      if (teamFilter !== "all" && l.assignedTeamId !== teamFilter) return false;
      if (agentFilter !== "all" && l.assignedAgentId !== agentFilter) return false;
      if (productFilter !== "all" && l.productType !== productFilter) return false;
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      return true;
    });
  }, [leads, role, currentAgentId, currentTeamId, dateFrom, dateTo, teamFilter, agentFilter, productFilter, stageFilter]);

  const agentName = (id: string) => agents.find(a => a.id === id)?.name ?? "—";
  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? "—";

  /** Builds the dataset (columns + rows) for a given export type. */
  const buildDataset = (id: ExportId, withPii: boolean): { columns: CsvColumn<any>[]; rows: any[] } => {
    const mask = (v: string | number | null | undefined) => (withPii ? v ?? "" : maskValue(v));

    switch (id) {
      case "full_lead":
        return {
          columns: [
            { key: "id", label: "Lead ID", value: (l: Lead) => l.id },
            { key: "name", label: "Name", value: (l: Lead) => l.name },
            { key: "mobile", label: "Mobile", value: (l: Lead) => mask(l.mobile) },
            { key: "email", label: "Email", value: (l: Lead) => mask(l.email) },
            { key: "pan", label: "PAN", value: (l: Lead) => mask(l.pan) },
            { key: "city", label: "City", value: (l: Lead) => l.city },
            { key: "product", label: "Product", value: (l: Lead) => getProductLabel(l.productType) },
            { key: "amount", label: "Loan Amount", value: (l: Lead) => l.loanAmount },
            { key: "income", label: "Monthly Income", value: (l: Lead) => l.monthlyIncome },
            { key: "foir", label: "FOIR %", value: (l: Lead) => l.foir },
            { key: "score", label: "Credit Score", value: (l: Lead) => l.creditScore ?? "" },
            { key: "stage", label: "Stage", value: (l: Lead) => getStageLabel(l.stage) },
            { key: "disposition", label: "Disposition", value: (l: Lead) => getDispositionLabel(l.disposition) },
            { key: "agent", label: "Agent", value: (l: Lead) => agentName(l.assignedAgentId) },
            { key: "team", label: "Team", value: (l: Lead) => teamName(l.assignedTeamId) },
            { key: "source", label: "Source", value: (l: Lead) => l.leadSource || l.source },
            { key: "allocatedAt", label: "Allocated At", value: (l: Lead) => l.allocatedAt?.slice(0, 10) ?? "" },
          ],
          rows: filtered,
        };

      case "disposition": {
        const rows = dispositionBreakdown(filtered);
        return {
          columns: [
            { key: "disposition", label: "Disposition", value: (r: any) => getDispositionLabel(r.disposition) },
            { key: "count", label: "Calls", value: (r: any) => r.count },
          ],
          rows,
        };
      }

      case "stb_pipeline": {
        const rows = allSubmissions(filtered);
        return {
          columns: [
            { key: "lead", label: "Lead", value: (r: any) => r.leadName },
            { key: "partner", label: "Partner", value: (r: any) => r.partnerName },
            { key: "ref", label: "Application Ref", value: (r: any) => r.applicationRef ?? "" },
            { key: "status", label: "Status", value: (r: any) => r.status },
            { key: "submittedAt", label: "Submitted", value: (r: any) => r.submittedAt.slice(0, 10) },
            { key: "tat", label: "TAT (days)", value: (r: any) => Math.floor((Date.now() - new Date(r.submittedAt).getTime()) / 86400000) },
            { key: "sanction", label: "Sanction Amount", value: (r: any) => r.sanctionAmount ?? "" },
            { key: "disbursed", label: "Disbursed Amount", value: (r: any) => r.disbursedAmount ?? "" },
            { key: "agent", label: "Agent", value: (r: any) => agentName(r.assignedAgentId) },
            { key: "team", label: "Team", value: (r: any) => teamName(r.assignedTeamId) },
          ],
          rows,
        };
      }

      case "source_attribution": {
        const map = new Map<string, { source: string; leads: number; contacted: number; submitted: number; disbursed: number }>();
        for (const l of filtered) {
          const key = l.leadSource || l.source || "unknown";
          const row = map.get(key) ?? { source: key, leads: 0, contacted: 0, submitted: 0, disbursed: 0 };
          row.leads += 1;
          if ((l.callLogs ?? []).some(c => c.outcome === "connected")) row.contacted += 1;
          row.submitted += l.stbSubmissions?.length ?? 0;
          row.disbursed += (l.stbSubmissions ?? []).filter(s => s.status === "disbursed").length;
          map.set(key, row);
        }
        return {
          columns: [
            { key: "source", label: "Source", value: (r: any) => r.source },
            { key: "leads", label: "Leads", value: (r: any) => r.leads },
            { key: "contacted", label: "Contacted", value: (r: any) => r.contacted },
            { key: "contactRate", label: "Contact %", value: (r: any) => (r.leads ? Math.round((r.contacted / r.leads) * 100) : 0) },
            { key: "submitted", label: "Submissions", value: (r: any) => r.submitted },
            { key: "disbursed", label: "Disbursed", value: (r: any) => r.disbursed },
          ],
          rows: [...map.values()].sort((a, b) => b.leads - a.leads),
        };
      }

      case "agent_activity": {
        const rows = agents
          .filter(a => teamFilter === "all" || a.teamId === teamFilter)
          .map(a => {
            const own = filtered.filter(l => l.assignedAgentId === a.id);
            const fus = own.flatMap(l => l.followUps ?? []);
            return {
              name: a.name,
              team: a.teamName,
              status: a.status,
              leads: own.length,
              calls: own.reduce((n, l) => n + (l.callLogs?.length ?? 0), 0),
              contacted: own.filter(l => (l.callLogs ?? []).some(c => c.outcome === "connected")).length,
              submissions: own.reduce((n, l) => n + (l.stbSubmissions?.length ?? 0), 0),
              disbursed: own.reduce((n, l) => n + (l.stbSubmissions ?? []).filter(s => s.status === "disbursed").length, 0),
              compliance: fus.length ? Math.round((fus.filter(f => f.status === "completed").length / fus.length) * 100) : 0,
            };
          })
          .filter(r => r.leads > 0);
        return {
          columns: [
            { key: "name", label: "Agent", value: (r: any) => r.name },
            { key: "team", label: "Team", value: (r: any) => r.team },
            { key: "status", label: "Status", value: (r: any) => r.status },
            { key: "leads", label: "Leads", value: (r: any) => r.leads },
            { key: "calls", label: "Calls", value: (r: any) => r.calls },
            { key: "contacted", label: "Contacted", value: (r: any) => r.contacted },
            { key: "submissions", label: "Submissions", value: (r: any) => r.submissions },
            { key: "disbursed", label: "Disbursed", value: (r: any) => r.disbursed },
            { key: "compliance", label: "F/U Compliance %", value: (r: any) => r.compliance },
          ],
          rows,
        };
      }

      case "partner_performance":
        return {
          columns: [
            { key: "partnerName", label: "Partner", value: (r: any) => r.partnerName },
            { key: "submitted", label: "Submissions", value: (r: any) => r.submitted },
            { key: "pending", label: "In Progress", value: (r: any) => r.pending },
            { key: "approved", label: "Approved", value: (r: any) => r.approved },
            { key: "declined", label: "Declined", value: (r: any) => r.declined },
            { key: "approvalRate", label: "Approval %", value: (r: any) => r.approvalRate },
            { key: "avgTat", label: "Avg TAT (days)", value: (r: any) => r.avgTat },
            { key: "disbursedAmount", label: "Disbursed Amount", value: (r: any) => r.disbursedAmount },
          ],
          rows: partnerBreakdown(filtered),
        };

      case "bureau_summary": {
        const rows = filtered.filter(l => !!l.creditReport);
        return {
          columns: [
            { key: "lead", label: "Lead", value: (l: Lead) => l.name },
            { key: "pan", label: "PAN", value: (l: Lead) => mask(l.pan) },
            { key: "score", label: "Score", value: (l: Lead) => l.creditReport?.score ?? "" },
            { key: "band", label: "Band", value: (l: Lead) => l.creditReport?.band ?? "" },
            { key: "pulledAt", label: "Pulled At", value: (l: Lead) => l.creditReport?.pulledAt?.slice(0, 10) ?? "" },
            { key: "obligations", label: "Obligations", value: (l: Lead) => l.existingObligations },
            { key: "foir", label: "FOIR %", value: (l: Lead) => l.foir },
            { key: "agent", label: "Agent", value: (l: Lead) => agentName(l.assignedAgentId) },
          ],
          rows,
        };
      }

      case "staff_profile":
        return {
          columns: [
            { key: "name", label: "Name", value: (a: any) => a.name },
            { key: "email", label: "Email", value: (a: any) => mask(a.email) },
            { key: "phone", label: "Phone", value: (a: any) => mask(a.phone) },
            { key: "team", label: "Team", value: (a: any) => a.teamName },
            { key: "manager", label: "Manager", value: (a: any) => a.managerName },
            { key: "status", label: "Status", value: (a: any) => a.status },
            { key: "joinedAt", label: "Joined", value: (a: any) => a.joinedAt },
          ],
          rows: agents.filter(a => teamFilter === "all" || a.teamId === teamFilter),
        };
    }
  };

  const rowCount = (id: ExportId) => buildDataset(id, canPii).rows.length;

  const runExport = (def: ExportDef, reason?: string) => {
    const { columns, rows } = buildDataset(def.id, def.pii ? canPii : false);
    if (rows.length === 0) {
      toast.error("No rows match the current filters.");
      return;
    }
    downloadCsv(`${def.id}_${dateStamp()}`, buildCsv(columns, rows));
    logAudit({
      ...actor,
      action: def.pii ? "export_pii" : "export_summary",
      entityType: "report",
      entityId: def.id,
      entityLabel: def.label,
      after: { rows: rows.length, dateFrom, dateTo, team: teamFilter, agent: agentFilter, product: productFilter, stage: stageFilter },
      reason,
    });
    setHistory(h => [
      { id: def.id, label: def.label, rows: rows.length, at: new Date().toISOString(), actor: actor.actorName, reason },
      ...h,
    ].slice(0, 8));
    if (def.pii) toast.warning("PII export recorded in the audit trail.");
    toast.success(`${def.label} · ${rows.length} rows downloaded.`);
  };

  const handleExport = (def: ExportDef) => {
    if (def.pii) {
      if (!canPii) {
        toast.error("Your role cannot export data containing personal information.");
        return;
      }
      setPiiConfirm(def);
      return;
    }
    runExport(def);
  };

  const openPreview = (def: ExportDef) => {
    const { columns, rows } = buildDataset(def.id, def.pii ? canPii : false);
    setPreview({
      label: def.label,
      header: columns.map(c => c.label),
      rows: rows.slice(0, 8).map(r => columns.map(c => String(c.value(r) ?? ""))),
      total: rows.length,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">MIS &amp; Data Export</h1>
        <p className="text-muted-foreground text-sm">
          Filtered CSV exports generated from live data · {filtered.length} leads in current selection
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="from">From date</Label>
              <Input id="from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="to">To date</Label>
              <Input id="to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Team</Label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger aria-label="Filter by team"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teams</SelectItem>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Agent</Label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger aria-label="Filter by agent"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agents.filter(a => teamFilter === "all" || a.teamId === teamFilter).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Product</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger aria-label="Filter by product"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {["personal_loan", "home_loan", "business_loan", "credit_card", "loan_against_property"].map(p => (
                    <SelectItem key={p} value={p}>{getProductLabel(p as never)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stage</Label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger aria-label="Filter by stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {["new", "contacted", "interested", "bank_selected", "stb_submitted", "approved", "declined", "disbursed", "closed_lost"].map(s => (
                    <SelectItem key={s} value={s}>{getStageLabel(s as never)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exportTypes.map(def => {
          const rows = rowCount(def.id);
          const restricted = def.pii && !canPii;
          return (
            <Card key={def.id} className="flex flex-col">
              <CardContent className="p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <def.icon className="h-5 w-5 text-primary shrink-0" aria-hidden />
                    <h3 className="font-semibold text-sm">{def.label}</h3>
                  </div>
                  {def.pii && (
                    <Badge variant="destructive" className="text-[9px] flex items-center gap-1 shrink-0">
                      <AlertTriangle className="h-3 w-3" aria-hidden /> PII
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex-1">{def.description}</p>
                <div className="text-xs font-medium tabular-nums">{rows} rows in current selection</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={restricted || rows === 0}
                    onClick={() => handleExport(def)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" aria-hidden />
                    {restricted ? "Restricted" : "Export CSV"}
                  </Button>
                  <Button size="sm" variant="outline" aria-label={`Preview ${def.label}`} onClick={() => openPreview(def)} disabled={rows === 0}>
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
                {restricted && <p className="text-[11px] text-muted-foreground">Cluster Head or Data Admin access required.</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent exports (this session)</CardTitle></CardHeader>
        <CardContent className={history.length ? "p-0" : ""}>
          {history.length === 0 ? (
            <EmptyState title="No exports yet" description="Generated exports appear here and are recorded in the audit trail." />
          ) : (
            <ul className="divide-y">
              {history.map((h, i) => (
                <li key={`${h.id}-${i}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 text-xs">
                  <span className="font-medium">{h.label}</span>
                  <span className="text-muted-foreground">
                    {h.rows} rows · {h.actor} · {new Date(h.at).toLocaleString()}
                    {h.reason ? ` · ${h.reason}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={v => !v && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.label} preview</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Showing first {preview?.rows.length ?? 0} of {preview?.total ?? 0} rows{!canPii && " · personal fields masked for your role"}
          </p>
          <div className="overflow-auto max-h-[50vh] border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>{preview?.header.map(h => <th key={h} className="text-left p-2 font-medium whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview?.rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    {r.map((c, j) => <td key={j} className="p-2 whitespace-nowrap">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* PII confirm modal */}
      <Dialog open={!!piiConfirm} onOpenChange={v => { if (!v) { setPiiConfirm(null); setPiiReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden /> Confirm PII export
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              You are about to export <strong>{piiConfirm?.label}</strong>, which contains personal data (PAN, mobile, email).
              This action is permanently recorded in the audit trail under your name and role.
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="pii-reason">Reason for export *</Label>
              <Textarea
                id="pii-reason"
                placeholder="e.g. Quarterly compliance review for regulatory submission"
                value={piiReason}
                onChange={e => setPiiReason(e.target.value)}
                className="min-h-[70px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPiiConfirm(null); setPiiReason(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!piiReason.trim()}
              onClick={() => {
                if (!piiConfirm) return;
                runExport(piiConfirm, piiReason.trim());
                setPiiConfirm(null);
                setPiiReason("");
              }}
            >
              Confirm &amp; export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        Total sanctioned value in current selection: {inr(allSubmissions(filtered).reduce((n, s) => n + (s.sanctionAmount ?? 0), 0))}
      </p>
    </div>
  );
};

export default MISExportPage;
