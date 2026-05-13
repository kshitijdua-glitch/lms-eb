import { leads, agents, teams, getDispositionLabel, getProductLabel } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import { PriorityBadge } from "@/components/PriorityBadge";
import type { ColumnDef } from "@/types/table";

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", teams: ["team-1"] },
  { id: "mgr-2", name: "Anjali Kapoor", teams: ["team-2"] },
];

type OFUItem = {
  id: string; scheduledAt: string; type: string; status: string;
  leadId: string; leadName: string; priority: string; productType: string;
  allocatedAt: string; retryCount: number; disposition: string;
  assignedAgentId: string; assignedTeamId: string;
};

function getFollowUpStatus(scheduledAt: string, status: string) {
  if (status === "missed") return { label: "Overdue", variant: "destructive" as const };
  if (status === "completed") return { label: "Completed", variant: "default" as const };
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff < 0) return { label: "Overdue", variant: "destructive" as const };
  if (diff < 3600000) return { label: "Due Now", variant: "default" as const };
  return { label: "Upcoming", variant: "secondary" as const };
}

const OrgFollowUpsPage = () => {
  const navigate = useNavigate();
  const [managerFilter, setManagerFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const availableAgents = useMemo(() => {
    if (managerFilter !== "all") {
      const mgr = managers.find(m => m.id === managerFilter);
      return mgr ? agents.filter(a => mgr.teams.includes(a.teamId)) : [];
    }
    return agents;
  }, [managerFilter]);

  const allFollowUps = useMemo(() => {
    return leads.flatMap(l =>
      l.followUps.filter(f => f.status !== "completed").map(f => ({
        ...f, leadId: l.id, leadName: l.name, priority: l.priority,
        productType: l.productType, allocatedAt: l.allocatedAt,
        retryCount: l.retryCount, disposition: l.disposition,
        assignedAgentId: l.assignedAgentId, assignedTeamId: l.assignedTeamId,
      }))
    ).filter(f => {
      if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
      if (agentFilter !== "all" && f.assignedAgentId !== agentFilter) return false;
      if (managerFilter !== "all") {
        const mgr = managers.find(m => m.id === managerFilter);
        if (!mgr || !mgr.teams.includes(f.assignedTeamId)) return false;
      }
      return true;
    }).sort((a, b) => {
      const order: Record<string, number> = { "Overdue": 0, "Due Now": 1, "Upcoming": 2 };
      return (order[getFollowUpStatus(a.scheduledAt, a.status).label] ?? 3) - (order[getFollowUpStatus(b.scheduledAt, b.status).label] ?? 3);
    });
  }, [priorityFilter, agentFilter, managerFilter]);

  const overdue = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Overdue");
  const getManagerForTeam = (teamId: string) => managers.find(m => m.teams.includes(teamId))?.name || "—";

  const columns: ColumnDef<OFUItem>[] = [
    { id: "lead", label: "Lead", render: (f) => <span className="font-medium text-sm">{f.leadName}</span> },
    { id: "manager", label: "Manager", render: (f) => <span className="text-xs text-muted-foreground">{getManagerForTeam(f.assignedTeamId)}</span> },
    { id: "agent", label: "Agent", render: (f) => <span className="text-xs text-muted-foreground">{agents.find(a => a.id === f.assignedAgentId)?.name}</span> },
    { id: "team", label: "Team", render: (f) => <span className="text-xs text-muted-foreground">{teams.find(t => t.id === f.assignedTeamId)?.name || "—"}</span> },
    { id: "type", label: "Type", render: (f) => <span className="text-sm capitalize">{f.type.replace(/_/g, " ")}</span> },
    { id: "scheduled", label: "Scheduled", render: (f) => <span className="text-sm text-muted-foreground">{new Date(f.scheduledAt).toLocaleString()}</span> },
    { id: "status", label: "Status", render: (f) => { const s = getFollowUpStatus(f.scheduledAt, f.status); return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>; }},
    { id: "priority", label: "Priority", render: (f) => { const lead = leads.find(l => l.id === f.leadId); return lead ? <PriorityBadge lead={lead} /> : null; } },
    { id: "days", label: "Days", render: (f) => <span className="text-sm">{Math.floor((Date.now() - new Date(f.allocatedAt).getTime()) / 86400000)}d</span> },
    { id: "retry", label: "Retry", render: (f) => (
      <span className="text-xs">{f.retryCount > 0 ? <span>{f.retryCount}/5 {f.retryCount >= 5 && <Badge variant="destructive" className="text-[9px] ml-1">Escalate</Badge>}</span> : "—"}</span>
    )},
    { id: "disposition", label: "Disposition", defaultVisible: false, render: (f) => <span className="text-xs">{getDispositionLabel(f.disposition as any)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Organisation Follow-Ups</h1>
          <p className="text-muted-foreground text-sm">
            {allFollowUps.length} total · <span className="text-destructive">{overdue.length} overdue</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={managerFilter} onValueChange={v => { setManagerFilter(v); setAgentFilter("all"); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Manager" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {availableAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ConfigurableTable tableId="org-follow-ups" columns={columns} data={allFollowUps} onRowClick={(f) => navigate(`/leads/${f.leadId}`)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgFollowUpsPage;
