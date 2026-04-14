import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getLeadsForTeam, getLeadsForAgent, getAgentsForTeam, agents, getDispositionLabel, getStageLabel } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Users, TrendingUp, Clock, Phone, Send, Calendar, Target,
  CheckCircle, UserCog, BarChart3, FileText, Plus
} from "lucide-react";

export function TLDashboard() {
  const navigate = useNavigate();
  const teamLeads = getLeadsForTeam("team-1");
  const myLeads = getLeadsForAgent("agent-9");
  const teamAgents = getAgentsForTeam("team-1").filter(a => a.id !== "agent-9");
  const today = new Date().toISOString().split("T")[0];
  const now = Date.now();

  // === MY PRODUCTION ===
  const myTotalAssigned = myLeads.length;
  const myMissedFollowUps = myLeads.filter(l => l.followUps.some(f => f.status === "missed"));
  const myTodayFollowUps = myLeads.filter(l => l.followUps.some(f => f.status === "pending" && f.scheduledAt.split("T")[0] <= today));
  const myWorkedToday = myLeads.filter(l => l.lastActivityAt.split("T")[0] === today);
  const myStbCount = myLeads.filter(l => l.stbSubmissions.length > 0);
  const myDisbursed = myLeads.filter(l => l.stage === "disbursed");
  const myCallsToday = myLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0);
  const myDailyTarget = 10;
  const myTargetPct = Math.min(100, Math.round((myCallsToday / myDailyTarget) * 100));

  // === TEAM HEALTH ===
  const teamTotalLeads = teamLeads.length;
  const teamContacted = teamLeads.filter(l => l.stage !== "new").length;
  const teamStb = teamLeads.filter(l => l.stbSubmissions.length > 0).length;
  const teamDisbursed = teamLeads.filter(l => l.stage === "disbursed").length;
  const teamTotalDisbursedAmt = teamLeads.filter(l => l.stage === "disbursed").reduce((s, l) => s + (l.stbSubmissions[0]?.disbursedAmount || 0), 0);
  const teamMissedFUs = teamLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
  const teamFUCompliance = teamLeads.length > 0
    ? Math.round((teamLeads.filter(l => !l.followUps.some(f => f.status === "missed")).length / teamLeads.length) * 100) : 0;

  // Agent activity status
  const agentStatus = teamAgents.map(a => {
    const agentLeads = teamLeads.filter(l => l.assignedAgentId === a.id);
    const workedToday = agentLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
    const callsToday = agentLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0);
    const lastActivity = agentLeads.length > 0 ? Math.min(...agentLeads.map(l => Math.floor((now - new Date(l.lastActivityAt).getTime()) / 86400000))) : 999;
    const missedFUs = agentLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
    const loggedIn = workedToday > 0 || callsToday > 0;
    return { ...a, agentLeads: agentLeads.length, workedToday, callsToday, lastActivity, missedFUs, loggedIn };
  });

  const zeroActivityAgents = agentStatus.filter(a => !a.loggedIn);

  // Expiring team leads (within 3 days)
  const expiringTeamLeads = teamLeads.filter(l => {
    const exp = new Date(l.expiresAt).getTime();
    return exp > now && exp - now <= 3 * 86400000;
  });

  const myProductionKpis = [
    { label: "My Leads", value: myTotalAssigned, icon: Users, color: "text-primary" },
    { label: "Missed F/U", value: myMissedFollowUps.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Today's F/U", value: myTodayFollowUps.length, icon: Calendar, color: "text-warning" },
    { label: "Worked Today", value: myWorkedToday.length, icon: Phone, color: "text-info" },
    { label: "My STB", value: myStbCount.length, icon: Send, color: "text-primary" },
    { label: "My Disbursed", value: myDisbursed.length, icon: CheckCircle, color: "text-success" },
  ];

  const teamHealthKpis = [
    { label: "Team Leads", value: teamTotalLeads, icon: Users, color: "text-primary" },
    { label: "Contacted", value: teamContacted, icon: Phone, color: "text-info" },
    { label: "Team STB", value: teamStb, icon: Send, color: "text-primary" },
    { label: "Team Disbursed", value: teamDisbursed, icon: CheckCircle, color: "text-success" },
    { label: "Disbursed Amt", value: `₹${(teamTotalDisbursedAmt / 100000).toFixed(1)}L`, icon: TrendingUp, color: "text-success" },
    { label: "Missed F/Us", value: teamMissedFUs, icon: AlertTriangle, color: "text-destructive" },
    { label: "F/U Compliance", value: `${teamFUCompliance}%`, icon: Target, color: teamFUCompliance >= 90 ? "text-success" : "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Leader Dashboard</h1>
          <p className="text-muted-foreground">Priya Sharma — Alpha Squad</p>
        </div>
      </div>

      {/* === MY PRODUCTION === */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Phone className="h-4 w-4" /> My Production</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {myProductionKpis.map(k => (
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

      {/* === TEAM HEALTH === */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Team Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {teamHealthKpis.map(k => (
            <Card key={k.label}>
              <CardContent className="p-3">
                <k.icon className={`h-4 w-4 ${k.color} mb-1`} />
                <div className="text-xl font-bold">{k.value}</div>
                <div className="text-[10px] text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Nav — 9 Buttons */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {[
          { label: "My Leads", icon: Users, url: "/leads" },
          { label: "My Follow-Ups", icon: Calendar, url: "/follow-ups" },
          { label: "My STB", icon: Send, url: "/stb" },
          { label: "Team Leads", icon: Users, url: "/team-leads" },
          { label: "Team Follow-Ups", icon: Clock, url: "/team-follow-ups" },
          { label: "Team STB", icon: Send, url: "/team-stb" },
          { label: "Team Mgmt", icon: UserCog, url: "/team-management" },
          { label: "Lead Report", icon: BarChart3, url: "/team-reports" },
          { label: "Performance", icon: TrendingUp, url: "/performance" },
        ].map(n => (
          <Button key={n.label} variant="outline" className="h-12 text-xs" onClick={() => navigate(n.url)}>
            <n.icon className="mr-1 h-3 w-3" /> {n.label}
          </Button>
        ))}
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

      {/* Expiring Team Leads */}
      {expiringTeamLeads.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" /> Team Leads Expiring Soon ({expiringTeamLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringTeamLeads.slice(0, 5).map(l => {
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
    </div>
  );
}
