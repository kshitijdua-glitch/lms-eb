import { getLeadsForTeam, getDispositionLabel, getProductLabel, agents } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

function getFollowUpStatus(scheduledAt: string, status: string) {
  if (status === "missed") return { label: "Overdue", variant: "destructive" as const };
  if (status === "completed") return { label: "Completed", variant: "default" as const };
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff < 0) return { label: "Overdue", variant: "destructive" as const };
  if (diff < 3600000) return { label: "Due Now", variant: "default" as const };
  return { label: "Upcoming", variant: "secondary" as const };
}

const TeamFollowUpsPage = () => {
  const navigate = useNavigate();
  const teamLeads = getLeadsForTeam("team-1");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const teamAgents = agents.filter(a => a.teamId === "team-1" && a.id !== "agent-9");

  const allFollowUps = teamLeads.flatMap(l =>
    l.followUps.filter(f => f.status !== "completed").map(f => ({
      ...f,
      leadId: l.id, leadName: l.name, leadMobile: l.mobile,
      priority: l.priority, productType: l.productType,
      allocatedAt: l.allocatedAt, retryCount: l.retryCount,
      disposition: l.disposition, assignedAgentId: l.assignedAgentId,
    }))
  ).filter(f => {
    if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
    if (agentFilter !== "all" && f.assignedAgentId !== agentFilter) return false;
    return true;
  }).sort((a, b) => {
    const order: Record<string, number> = { "Overdue": 0, "Due Now": 1, "Upcoming": 2 };
    return (order[getFollowUpStatus(a.scheduledAt, a.status).label] ?? 3) - (order[getFollowUpStatus(b.scheduledAt, b.status).label] ?? 3);
  });

  const overdue = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Overdue");

  // 5+ NC escalation leads
  const ncLeads = teamLeads.filter(l => l.retryCount >= 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Team Follow-Ups</h1>
          <p className="text-muted-foreground text-sm">
            {allFollowUps.length} total · <span className="text-destructive">{overdue.length} overdue</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {teamAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
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

      {/* NC Escalation Alerts */}
      {ncLeads.length > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="p-3">
            <div className="text-sm font-medium text-destructive mb-2">⚠ 5+ Not Contactable — TL Review Required ({ncLeads.length})</div>
            <div className="flex flex-wrap gap-2">
              {ncLeads.map(l => (
                <Badge key={l.id} variant="destructive" className="text-xs cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>
                  {l.name} ({l.retryCount} retries) — {agents.find(a => a.id === l.assignedAgentId)?.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Days Since Alloc</TableHead>
                <TableHead>Retry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFollowUps.map(f => {
                const status = getFollowUpStatus(f.scheduledAt, f.status);
                const agent = agents.find(a => a.id === f.assignedAgentId);
                const daysSinceAlloc = Math.floor((Date.now() - new Date(f.allocatedAt).getTime()) / 86400000);
                return (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${f.leadId}`)}>
                    <TableCell className="text-xs text-muted-foreground">{f.leadId}</TableCell>
                    <TableCell className="font-medium text-sm">{f.leadName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{agent?.name}</TableCell>
                    <TableCell className="text-sm capitalize">{f.type.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(f.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={status.variant} className="text-xs">{status.label}</Badge></TableCell>
                    <TableCell><Badge variant={f.priority === "hot" ? "destructive" : f.priority === "warm" ? "default" : "secondary"} className="text-xs">{f.priority}</Badge></TableCell>
                    <TableCell className="text-sm">{daysSinceAlloc}d</TableCell>
                    <TableCell className="text-xs">
                      {f.retryCount > 0 ? <span>{f.retryCount}/5 {f.retryCount >= 5 && <Badge variant="destructive" className="text-[9px] ml-1">Escalate</Badge>}</span> : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamFollowUpsPage;
