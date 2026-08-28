import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Clock, History as HistoryIcon, IndianRupee, PencilLine, Search, Send, XCircle } from "lucide-react";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import { KpiCard } from "@/components/KpiCard";
import { SubmissionStatusDialog, type SubmissionTarget } from "@/components/SubmissionStatusDialog";
import { SubmissionHistoryPanel } from "@/components/SubmissionHistoryPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLmsData } from "@/contexts/LmsDataContext";
import { useRole } from "@/contexts/RoleContext";
import { agents, teams, getProductLabel } from "@/data/mockData";
import { allSubmissions, inrCompact, scopeLeads } from "@/lib/metrics";
import { STB_STATUS_LABELS, canUpdateSubmissionStatus, nextAllowedStatuses } from "@/lib/permissions";
import type { ColumnDef } from "@/types/table";
import type { STBStatus } from "@/types/lms";

type Row = SubmissionTarget & { assignedAgentId: string; assignedTeamId: string; productType: string };

const statusVariant = (s: STBStatus) =>
  s === "disbursed" || s === "approved" ? "default" : s === "declined" ? "destructive" : "secondary";

interface Props {
  /** agent = own leads, team = own team, org = everything */
  scope: "agent" | "team" | "org";
  title: string;
  subtitle?: string;
  tableId: string;
}

export function PartnerSubmissionsBoard({ scope, title, subtitle, tableId }: Props) {
  const navigate = useNavigate();
  const { leads } = useLmsData();
  const { role, currentAgentId, currentTeamId } = useRole();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [target, setTarget] = useState<SubmissionTarget | null>(null);
  const [historyTarget, setHistoryTarget] = useState<SubmissionTarget | null>(null);

  const scoped = useMemo(
    () =>
      scopeLeads(leads, {
        role: scope === "agent" ? "agent" : scope === "team" ? "manager" : "cluster_head",
        agentId: currentAgentId,
        teamId: currentTeamId,
      }),
    [leads, scope, currentAgentId, currentTeamId],
  );

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    return allSubmissions(scoped)
      .map(s => ({ ...s, leadId: s.leadId, leadName: s.leadName }) as Row)
      .filter(s => statusFilter === "all" || s.status === statusFilter)
      .filter(s => {
        if (ownerFilter === "all") return true;
        return scope === "org" ? s.assignedTeamId === ownerFilter : s.assignedAgentId === ownerFilter;
      })
      .filter(s => !q || s.leadName.toLowerCase().includes(q) || s.partnerName.toLowerCase().includes(q) || (s.applicationRef ?? "").toLowerCase().includes(q))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [scoped, search, statusFilter, ownerFilter, scope]);

  const counts = useMemo(() => {
    const all = allSubmissions(scoped);
    return {
      pending: all.filter(s => s.status === "submitted" || s.status === "under_review").length,
      approved: all.filter(s => s.status === "approved").length,
      disbursed: all.filter(s => s.status === "disbursed").length,
      declined: all.filter(s => s.status === "declined").length,
      disbursedAmount: all.reduce((n, s) => n + (s.disbursedAmount ?? 0), 0),
    };
  }, [scoped]);

  const columns: ColumnDef<Row>[] = [
    { id: "lead", label: "Lead", render: s => <span className="font-medium text-sm">{s.leadName}</span> },
    ...(scope !== "agent"
      ? [
          { id: "agent", label: "Agent", render: (s: Row) => <span className="text-xs text-muted-foreground">{agents.find(a => a.id === s.assignedAgentId)?.name ?? "—"}</span> },
          { id: "team", label: "Team", render: (s: Row) => <span className="text-xs text-muted-foreground">{teams.find(t => t.id === s.assignedTeamId)?.name ?? "—"}</span> },
        ]
      : []),
    { id: "product", label: "Product", render: s => <Badge variant="outline" className="text-xs">{getProductLabel(s.productType as never)}</Badge> },
    { id: "partner", label: "Partner", render: s => <span className="text-sm">{s.partnerName}</span> },
    { id: "ref", label: "Ref", defaultVisible: false, render: s => <span className="text-xs text-muted-foreground">{s.applicationRef ?? "—"}</span> },
    { id: "submitted", label: "Submitted", render: s => <span className="text-sm text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</span> },
    { id: "days", label: "TAT", render: s => <span className="text-sm tabular-nums">{Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / 86400000)}d</span> },
    {
      id: "status",
      label: "Status",
      render: s => (
        <div className="flex items-center gap-1.5">
          <Badge variant={statusVariant(s.status)} className="text-xs">{STB_STATUS_LABELS[s.status]}</Badge>
          {s.manualOverride && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground border border-border rounded px-1">M</span>
              </TooltipTrigger>
              <TooltipContent>Manually overridden — auto sync paused</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
    { id: "sanction", label: "Sanction", render: s => <span className="text-sm tabular-nums">{s.sanctionAmount ? inrCompact(s.sanctionAmount) : "—"}</span> },
    { id: "disbursedAmt", label: "Disbursed", render: s => <span className="text-sm tabular-nums">{s.disbursedAmount ? inrCompact(s.disbursedAmount) : "—"}</span> },
    { id: "integration", label: "Integration", defaultVisible: false, render: s => <Badge variant="outline" className="text-[10px] capitalize">{s.integrationType}</Badge> },
    {
      id: "update",
      label: "Action",
      locked: "end",
      render: s => {
        const allowed = canUpdateSubmissionStatus(role, { leadTeamId: s.assignedTeamId, userTeamId: currentTeamId });
        const canMove = nextAllowedStatuses(s.status).length > 0;
        return (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  aria-label={`View status history for ${s.leadName} with ${s.partnerName}`}
                  onClick={() => setHistoryTarget(s)}
                >
                  <HistoryIcon className="h-3.5 w-3.5 mr-1" aria-hidden /> History
                </Button>
              </TooltipTrigger>
              <TooltipContent>Status history &amp; audit download</TooltipContent>
            </Tooltip>
            {allowed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={!canMove}
                    aria-label={`Update status for ${s.leadName} with ${s.partnerName}`}
                    onClick={() => setTarget(s)}
                  >
                    <PencilLine className="h-3.5 w-3.5 mr-1" aria-hidden /> Update
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{canMove ? "Update partner status" : "Final status — no change allowed"}</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },

    },
  ];

  const ownerOptions = scope === "org" ? teams.map(t => ({ id: t.id, name: t.name })) : agents.filter(a => scope !== "team" || a.teamId === currentTeamId).map(a => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle ?? `${rows.length} of ${allSubmissions(scoped).length} applications shown`}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="In progress" value={counts.pending} icon={Clock} tone="info" />
        <KpiCard label="Approved" value={counts.approved} icon={CheckCircle} tone="success" />
        <KpiCard label="Disbursed" value={counts.disbursed} icon={Send} tone="success" />
        <KpiCard label="Declined" value={counts.declined} icon={XCircle} tone="danger" />
        <KpiCard label="Disbursed value" value={inrCompact(counts.disbursedAmount)} icon={IndianRupee} tone="default" className="col-span-2 lg:col-span-1" />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Applications</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Input
                  className="pl-8 h-9 w-full sm:w-56"
                  placeholder="Search lead, partner or ref"
                  aria-label="Search applications"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Filter by status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(Object.keys(STB_STATUS_LABELS) as STBStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STB_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scope !== "agent" && (
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="h-9 w-full sm:w-40" aria-label={scope === "org" ? "Filter by team" : "Filter by agent"}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{scope === "org" ? "All teams" : "All agents"}</SelectItem>
                    {ownerOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ConfigurableTable
            tableId={tableId}
            columns={columns}
            data={rows}
            pageSize={25}
            onRowClick={s => navigate(`/leads/${s.leadId}`)}
          />
        </CardContent>
      </Card>

      <SubmissionStatusDialog submission={target} onOpenChange={open => !open && setTarget(null)} />

      <Dialog open={!!historyTarget} onOpenChange={open => !open && setHistoryTarget(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {historyTarget?.leadName} · application history
            </DialogTitle>
          </DialogHeader>
          {historyTarget && (
            <SubmissionHistoryPanel submission={historyTarget} leadName={historyTarget.leadName} dense />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
