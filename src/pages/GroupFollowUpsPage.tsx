import { leads, agents, teams, getDispositionLabel, getProductLabel } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import { getFollowUpStatus, getFollowUpBucket, type FollowUpBucket } from "@/lib/followUpStatus";
import { Bell, Shuffle, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { useRole } from "@/contexts/RoleContext";

type GFUItem = {
  id: string; scheduledAt: string; type: string; status: string; notes: string;
  leadId: string; leadName: string; priority: string; productType: string;
  allocatedAt: string; retryCount: number; disposition: string;
  assignedAgentId: string; assignedTeamId: string;
};

type Tab = FollowUpBucket | "escalated";

const GroupFollowUpsPage = () => {
  const navigate = useNavigate();
  const { role } = useRole();
  const { logAudit } = useAudit();
  const actor = buildActor(role, "mgr-1");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [tab, setTab] = useState<Tab>("overdue");

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
      return true;
    });
  }, [priorityFilter, agentFilter]);

  const buckets = useMemo(() => {
    const out: Record<Tab, GFUItem[]> = { overdue: [], today: [], upcoming: [], completed: [], escalated: [] };
    for (const f of allFollowUps) {
      const b = getFollowUpBucket(f.scheduledAt, f.status);
      if (b === "completed") continue;
      out[b].push(f);
      if (f.retryCount >= 5) out.escalated.push(f);
    }
    return out;
  }, [allFollowUps]);

  const handleNudge = (f: GFUItem) => {
    const agent = agents.find(a => a.id === f.assignedAgentId);
    logAudit({ ...actor, action: "nudge_agent", entityType: "follow_up", entityId: f.id, entityLabel: f.leadName, after: { agent: agent?.name } });
    toast.success(`Nudge sent to ${agent?.name || "agent"}`);
  };
  const handleReassign = (f: GFUItem) => {
    logAudit({ ...actor, action: "reassign_follow_up", entityType: "follow_up", entityId: f.id, entityLabel: f.leadName });
    toast.info(`Open lead to reassign — ${f.leadName}`);
    navigate(`/leads/${f.leadId}`);
  };
  const handleReschedule = (f: GFUItem) => {
    logAudit({ ...actor, action: "reschedule_follow_up", entityType: "follow_up", entityId: f.id, entityLabel: f.leadName });
    navigate(`/leads/${f.leadId}`);
  };

  const columns: ColumnDef<GFUItem>[] = [
    { id: "lead", label: "Lead", render: (f) => <span className="font-medium text-sm">{f.leadName}</span> },
    { id: "agent", label: "Agent", render: (f) => <span className="text-xs text-muted-foreground">{agents.find(a => a.id === f.assignedAgentId)?.name}</span> },
    { id: "team", label: "Team", render: (f) => <span className="text-xs text-muted-foreground">{teams.find(t => t.id === f.assignedTeamId)?.name || "—"}</span> },
    { id: "type", label: "Type", render: (f) => <span className="text-sm capitalize">{f.type.replace(/_/g, " ")}</span> },
    { id: "scheduled", label: "Scheduled", render: (f) => <span className="text-sm text-muted-foreground">{new Date(f.scheduledAt).toLocaleString()}</span> },
    { id: "status", label: "Status", render: (f) => { const s = getFollowUpStatus(f.scheduledAt, f.status); return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>; }},
    { id: "priority", label: "Priority", render: (f) => <Badge variant={f.priority === "hot" ? "destructive" : f.priority === "warm" ? "default" : "secondary"} className="text-xs">{f.priority}</Badge> },
    { id: "retry", label: "Retry", render: (f) => (
      <span className="text-xs">{f.retryCount > 0 ? <span>{f.retryCount}/5 {f.retryCount >= 5 && <Badge variant="destructive" className="text-[9px] ml-1">Escalate</Badge>}</span> : "—"}</span>
    )},
    { id: "actions", label: "Actions", locked: "end", render: (f) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <Tooltip><TooltipTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleNudge(f)} aria-label="Nudge agent"><Bell className="h-3.5 w-3.5" /></Button>
        </TooltipTrigger><TooltipContent>Nudge agent</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleReassign(f)} aria-label="Reassign"><Shuffle className="h-3.5 w-3.5" /></Button>
        </TooltipTrigger><TooltipContent>Reassign</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleReschedule(f)} aria-label="Reschedule"><CalendarClock className="h-3.5 w-3.5" /></Button>
        </TooltipTrigger><TooltipContent>Reschedule</TooltipContent></Tooltip>
      </div>
    )},
    { id: "disposition", label: "Disposition", defaultVisible: false, render: (f) => <span className="text-xs">{getDispositionLabel(f.disposition as any)}</span> },
    { id: "product", label: "Product", defaultVisible: false, render: (f) => <Badge variant="outline" className="text-xs">{getProductLabel(f.productType as any)}</Badge> },
  ];

  const tabData = (t: Tab) => buckets[t] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Group Follow-Ups</h1>
          <p className="text-muted-foreground text-sm">
            <span className="text-destructive font-medium">{buckets.overdue.length} overdue</span>
            <span className="opacity-50 mx-1.5">·</span>
            <span className="text-amber-600 font-medium">{buckets.today.length} today</span>
            <span className="opacity-50 mx-1.5">·</span>
            <span>{buckets.upcoming.length} upcoming</span>
            {buckets.escalated.length > 0 && <><span className="opacity-50 mx-1.5">·</span><span className="text-destructive">{buckets.escalated.length} escalated</span></>}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-border w-full justify-start rounded-none">
          {([
            { v: "overdue", label: "Overdue", count: buckets.overdue.length },
            { v: "today", label: "Today", count: buckets.today.length },
            { v: "upcoming", label: "Upcoming", count: buckets.upcoming.length },
            { v: "escalated", label: "Escalated", count: buckets.escalated.length },
          ] as { v: Tab; label: string; count: number }[]).map(t => (
            <TabsTrigger key={t.v} value={t.v}
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 -mb-px text-sm font-medium text-muted-foreground">
              {t.label}
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground tabular-nums">
                {String(t.count).padStart(2, "0")}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {(["overdue", "today", "upcoming", "escalated"] as Tab[]).map(t => (
          <TabsContent key={t} value={t} className="mt-5">
            <Card>
              <CardContent className="p-0">
                {tabData(t).length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">No {t} follow-ups</div>
                ) : (
                  <ConfigurableTable
                    tableId={`group-follow-ups-${t}`}
                    columns={columns}
                    data={tabData(t)}
                    onRowClick={(f) => navigate(`/leads/${f.leadId}`)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default GroupFollowUpsPage;
