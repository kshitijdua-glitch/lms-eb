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

  // Agent activity status (all agents)
  const agentStatus = agents.map(a => {
    const agentLeads = allLeads.filter(l => l.assignedAgentId === a.id);
    const workedToday = agentLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
    const callsToday = agentLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0);
    const missedFUs = agentLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
    const loggedIn = workedToday > 0 || callsToday > 0;
    return { ...a, agentLeads: agentLeads.length, workedToday, callsToday, missedFUs, loggedIn };
  });

  const agentsOnline = agentStatus.filter(a => a.loggedIn).length;
  const agentsOffline = agentStatus.filter(a => !a.loggedIn).length;
  const zeroActivityAgents = agentStatus.filter(a => !a.loggedIn && a.agentLeads > 0);

  // Expiring leads (within 7 days)
  const expiringLeads = allLeads.filter(l => {
    const exp = new Date(l.expiresAt).getTime();
    return exp > now && exp - now < 7 * 86400000;
  });

  // Business Funnel
  const funnelSteps = [
    { label: "Allocated", value: totalAllocated, pct: 100 },
    { label: "Contacted", value: totalContacted, pct: totalAllocated > 0 ? Math.round((totalContacted / totalAllocated) * 100) : 0 },
    { label: "STB", value: totalSTB, pct: totalAllocated > 0 ? Math.round((totalSTB / totalAllocated) * 100) : 0 },
    { label: "Approved", value: totalApproved, pct: totalAllocated > 0 ? Math.round((totalApproved / totalAllocated) * 100) : 0 },
    { label: "Disbursed", value: totalDisbursed, pct: totalAllocated > 0 ? Math.round((totalDisbursed / totalAllocated) * 100) : 0 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><LayoutDashboard className="h-6 w-6" /> Manager Dashboard</h2>

      {/* My Production */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">My Production</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "My Leads", value: myLeads.length, icon: FileText },
            { label: "Worked Today", value: myWorkedToday, icon: CheckCircle },
            { label: "Pending F/U", value: myPendingFU, icon: Clock },
            { label: "Missed F/U", value: myMissedFU, icon: AlertTriangle, alert: myMissedFU > 0 },
            { label: "STB", value: mySTB, icon: Send },
            { label: "Disbursed", value: myDisbursed, icon: TrendingUp },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-3">
                <k.icon className={`h-4 w-4 mb-1 ${k.alert ? "text-destructive" : "text-muted-foreground"}`} />
                <div className="text-xl font-bold">{k.value}</div>
                <div className="text-[10px] text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-3">
          <CardContent className="p-3 flex items-center gap-4">
            <Target className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Daily Target: {myCallsToday}/{myDailyTarget} calls</div>
              <Progress value={myTargetPct} className="h-2 mt-1" />
            </div>
            <span className="text-sm font-bold">{myTargetPct}%</span>
          </CardContent>
        </Card>
      </div>

      {/* Business Funnel */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Performance Funnel</h3>
        <div className="grid grid-cols-5 gap-2">
          {funnelSteps.map((step, i) => (
            <Card key={step.label}>
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold">{step.value}</div>
                <div className="text-[10px] text-muted-foreground">{step.label}</div>
                <div className="text-[10px] font-medium text-primary">{step.pct}%</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Group Health */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Agent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-3 text-xs">
              <span>Online: <strong className="text-success">{agentsOnline}</strong></span>
              <span>Offline: <strong className="text-destructive">{agentsOffline}</strong></span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {agentStatus.map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs p-1.5 rounded border">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${a.loggedIn ? "bg-success" : "bg-destructive"}`} />
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground">({a.teamName})</span>
                  </div>
                  <div className="flex gap-3">
                    <span>{a.callsToday} calls</span>
                    <span>{a.workedToday} worked</span>
                    {a.missedFUs > 0 && <Badge variant="destructive" className="text-[9px]">{a.missedFUs} missed</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Group Health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">F/U Compliance</span>
              <span className={groupFUCompliance >= 90 ? "text-success font-bold" : groupFUCompliance >= 70 ? "text-warning font-bold" : "text-destructive font-bold"}>{groupFUCompliance}%</span>
            </div>
            <Progress value={groupFUCompliance} className="h-2" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Missed F/U</span>
              <span className="font-bold">{groupMissedFUs}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Expiring Leads (7d)</span>
              <span className="font-bold">{expiringLeads.length}</span>
            </div>
            {zeroActivityAgents.length > 0 && (
              <div className="p-2 rounded border border-destructive/30">
                <div className="text-[10px] text-destructive font-medium mb-1">⚠ Zero Activity Today</div>
                {zeroActivityAgents.map(a => (
                  <div key={a.id} className="text-[10px] text-muted-foreground">{a.name} ({a.agentLeads} leads)</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Group Leads", path: "/group-leads", icon: FileText },
          { label: "Group Follow-Ups", path: "/group-follow-ups", icon: Calendar },
          { label: "Group STB", path: "/group-stb", icon: Send },
          { label: "Group Management", path: "/group-management", icon: UserCog },
        ].map(nav => (
          <Button key={nav.path} variant="outline" className="h-16 flex flex-col gap-1" onClick={() => navigate(nav.path)}>
            <nav.icon className="h-5 w-5" />
            <span className="text-xs">{nav.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
