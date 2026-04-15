import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { leads, teams, agents, getStageLabel, getLeadsForTeam, getLeadsForAgent, getAgentsForTeam, lendingPartners } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Clock, Send, TrendingUp, BarChart3, UserCog,
  FileText, AlertTriangle, CheckCircle, Target, Phone, Calendar,
} from "lucide-react";

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { currentAgentId } = useRole();
  const today = new Date().toISOString().split("T")[0];
  const now = Date.now();

  // --- Own Production (agent-style) ---
  const myLeads = leads.filter(l => l.assignedAgentId === currentAgentId);
  const myWorkedToday = myLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
  const myPendingFU = myLeads.filter(l => l.followUps.some(f => f.status === "pending")).length;
  const myMissedFU = myLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
  const mySTB = myLeads.filter(l => l.stbSubmissions.length > 0).length;
  const myDisbursed = myLeads.filter(l => l.stage === "disbursed").length;
  const myCallsToday = myLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0);
  const myDailyTarget = 10;
  const myTargetPct = Math.min(100, Math.round((myCallsToday / myDailyTarget) * 100));

  // --- Group (all teams) ---
  const allLeads = leads;
  const totalAllocated = allLeads.length;
  const totalContacted = allLeads.filter(l => l.stage !== "new").length;
  const totalSTB = allLeads.filter(l => l.stbSubmissions.length > 0).length;
  const totalApproved = allLeads.filter(l => l.stage === "approved" || l.stage === "disbursed").length;
  const totalDisbursed = allLeads.filter(l => l.stage === "disbursed").length;

  const groupMissedFUs = allLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
  const groupFUCompliance = totalAllocated > 0
    ? Math.round(((totalAllocated - groupMissedFUs) / totalAllocated) * 100) : 100;

  // Agent activity status (all agents across all teams)
  const allAgents = agents.filter(a => !teams.some(t => t.tlId === a.id));
  const agentStatus = allAgents.map(a => {
    const agentLeads = allLeads.filter(l => l.assignedAgentId === a.id);
    const workedToday = agentLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
    const callsToday = agentLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0);
    const missedFUs = agentLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
    const loggedIn = workedToday > 0 || callsToday > 0;
    return { ...a, agentLeads: agentLeads.length, workedToday, callsToday, missedFUs, loggedIn };
  });

  const zeroActivityAgents = agentStatus.filter(a => !a.loggedIn);

  // Expiring leads (within 3 days)
  const expiringLeads = allLeads.filter(l => {
    const exp = new Date(l.expiresAt).getTime();
    return exp > now && exp - now <= 3 * 86400000;
  });

  // Business Performance Strip
  const funnel = [
    { label: "Allocated", value: totalAllocated, rate: 100 },
    { label: "Contacted", value: totalContacted, rate: totalAllocated ? Math.round((totalContacted / totalAllocated) * 100) : 0 },
    { label: "STB", value: totalSTB, rate: totalContacted ? Math.round((totalSTB / totalContacted) * 100) : 0 },
    { label: "Approved", value: totalApproved, rate: totalSTB ? Math.round((totalApproved / totalSTB) * 100) : 0 },
    { label: "Disbursed", value: totalDisbursed, rate: totalApproved ? Math.round((totalDisbursed / totalApproved) * 100) : 0 },
  ];

  const quickNav = [
    { label: "My Leads", icon: Users, path: "/leads" },
    { label: "My Follow-Ups", icon: Clock, path: "/follow-ups" },
    { label: "My STB", icon: Send, path: "/stb" },
    { label: "Group Leads", icon: Users, path: "/group-leads" },
    { label: "Group Follow-Ups", icon: Clock, path: "/group-follow-ups" },
    { label: "Group STB", icon: Send, path: "/group-stb" },
    { label: "Group Management", icon: UserCog, path: "/group-management" },
    { label: "Lead Report", icon: FileText, path: "/group-reports" },
    { label: "Performance", icon: TrendingUp, path: "/performance" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Own production + Group operations overview</p>
      </div>

      {/* Quick Nav */}
      <div className="flex flex-wrap gap-2">
        {quickNav.map(q => (
          <Button key={q.label} variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate(q.path)}>
            <q.icon className="h-3 w-3" /> {q.label}
          </Button>
        ))}
      </div>

      {/* Own Production */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Phone className="h-4 w-4" /> My Production</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "My Leads", value: myLeads.length, icon: Users, color: "text-primary" },
            { label: "Missed F/U", value: myMissedFU, icon: AlertTriangle, color: "text-destructive" },
            { label: "Pending F/U", value: myPendingFU, icon: Calendar, color: "text-warning" },
            { label: "Worked Today", value: myWorkedToday, icon: Phone, color: "text-info" },
            { label: "My STB", value: mySTB, icon: Send, color: "text-primary" },
            { label: "My Disbursed", value: myDisbursed, icon: CheckCircle, color: "text-success" },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-3">
                <k.icon className={`h-4 w-4 ${k.color} mb-1`} />
                <div className="text-xl font-bold">{k.value}</div>
                <div className="text-[10px] text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-3">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">My Daily Call Target</span>
              </div>
              <span className="text-sm text-muted-foreground">{myCallsToday}/{myDailyTarget} calls</span>
            </div>
            <Progress value={myTargetPct} className="h-2" />
            {myTargetPct >= 100 && <p className="text-xs text-success mt-1">🎉 Target achieved!</p>}
          </CardContent>
        </Card>
      </div>

      {/* Group Health */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Group Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: totalAllocated },
            { label: "Missed F/Us", value: groupMissedFUs, danger: groupMissedFUs > 5 },
            { label: "F/U Compliance", value: `${groupFUCompliance}%`, danger: groupFUCompliance < 80 },
            { label: "Group Disbursed", value: totalDisbursed },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-3">
                <div className={`text-xl font-bold ${(k as any).danger ? "text-destructive" : ""}`}>{k.value}</div>
                <div className="text-[10px] text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Agent Activity Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><UserCog className="h-4 w-4" /> Agent Activity Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agentStatus.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${a.loggedIn ? "bg-success" : "bg-destructive"}`} />
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground">({a.teamName})</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Leads: {a.agentLeads}</span>
                  <span>Calls: {a.callsToday}</span>
                  <span>Worked: {a.workedToday}</span>
                  {a.missedFUs > 0 && <Badge variant="destructive" className="text-[9px]">{a.missedFUs} missed</Badge>}
                  {!a.loggedIn && <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zero Activity Alerts */}
      {zeroActivityAgents.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" /> Zero Activity Today ({zeroActivityAgents.length} agents)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {zeroActivityAgents.map(a => (
                <Badge key={a.id} variant="outline" className="text-xs">{a.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Performance Strip */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Business Performance Funnel</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              {funnel.map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold">{step.value}</div>
                    <div className="text-[10px] text-muted-foreground">{step.label}</div>
                    {i > 0 && (
                      <Badge variant="outline" className="text-[9px] mt-0.5">{step.rate}%</Badge>
                    )}
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="text-muted-foreground text-lg">→</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Leads */}
      {expiringLeads.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" /> Leads Expiring Soon ({expiringLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringLeads.slice(0, 5).map(l => {
                const daysLeft = Math.ceil((new Date(l.expiresAt).getTime() - now) / 86400000);
                const agent = agents.find(a => a.id === l.assignedAgentId);
                return (
                  <div key={l.id} className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${l.id}`)}>
                    <div>
                      <span className="font-medium text-sm">{l.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">Agent: {agent?.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-warning">{daysLeft}d left</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Pipeline Summary */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Bank Pipeline Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {lendingPartners.filter(lp => lp.status === "active").map(lp => {
              const subs = allLeads.flatMap(l => l.stbSubmissions).filter(s => s.partnerId === lp.id);
              return (
                <div key={lp.id} className="p-2 rounded border text-center">
                  <div className="text-xs font-medium mb-1">{lp.name}</div>
                  <div className="text-sm font-bold">{subs.length}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {subs.filter(s => s.status === "approved" || s.status === "disbursed").length} approved
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
