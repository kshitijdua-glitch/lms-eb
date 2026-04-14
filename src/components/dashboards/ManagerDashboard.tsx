import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { leads, teams, agents, getStageLabel, getLeadsForTeam, lendingPartners } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Clock, Send, TrendingUp, BarChart3, UserCog,
  FileText, AlertTriangle, CheckCircle, Target,
} from "lucide-react";

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { currentAgentId } = useRole();

  // --- Own Production (agent-style) ---
  const myLeads = leads.filter(l => l.assignedAgentId === currentAgentId);
  const today = new Date().toISOString().split("T")[0];
  const myWorkedToday = myLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
  const myPendingFU = myLeads.filter(l => l.followUps.some(f => f.status === "pending")).length;
  const mySTB = myLeads.filter(l => l.stbSubmissions.length > 0).length;
  const myDisbursed = myLeads.filter(l => l.stage === "disbursed").length;

  // --- Group (all teams) ---
  const allLeads = leads;
  const totalAllocated = allLeads.length;
  const totalContacted = allLeads.filter(l => l.stage !== "new").length;
  const totalSTB = allLeads.filter(l => l.stbSubmissions.length > 0).length;
  const totalApproved = allLeads.filter(l => l.stage === "approved" || l.stage === "disbursed").length;
  const totalDisbursed = allLeads.filter(l => l.stage === "disbursed").length;

  const groupMissedFUs = allLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
  const groupPendingFUs = allLeads.filter(l => l.followUps.some(f => f.status === "pending")).length;
  const groupFUCompliance = totalAllocated > 0
    ? Math.round(((totalAllocated - groupMissedFUs) / totalAllocated) * 100) : 100;

  // TL Activity
  const tlAgents = teams.map(t => {
    const tl = agents.find(a => a.id === t.tlId);
    const tLeads = getLeadsForTeam(t.id);
    const workedToday = tLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
    const teamAgents = agents.filter(a => a.teamId === t.id && a.id !== t.tlId);
    const loggedIn = workedToday > 0;
    const missedFUs = tLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
    const stb = tLeads.filter(l => l.stbSubmissions.length > 0).length;
    const disbursed = tLeads.filter(l => l.stage === "disbursed").length;
    return {
      id: t.id, name: t.name, tlName: tl?.name || "—", tlId: t.tlId,
      agentCount: teamAgents.length, leadsCount: tLeads.length,
      workedToday, loggedIn, missedFUs, stb, disbursed,
    };
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
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">My Production</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "My Leads", value: myLeads.length },
            { label: "Worked Today", value: myWorkedToday },
            { label: "Pending F/U", value: myPendingFU },
            { label: "My STB", value: mySTB },
            { label: "My Disbursed", value: myDisbursed },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-3">
                <div className="text-xl font-bold">{k.value}</div>
                <div className="text-[10px] text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Group Health */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Group Health</h2>
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

        {/* TL Activity Status */}
        <Card className="mt-3">
          <CardHeader className="pb-2"><CardTitle className="text-sm">TL Activity Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tlAgents.map(tl => (
              <div key={tl.id} className="flex items-center gap-3 p-2 rounded border text-sm">
                <div className={`h-2.5 w-2.5 rounded-full ${tl.loggedIn ? "bg-success" : "bg-destructive"}`} />
                <div className="flex-1">
                  <span className="font-medium">{tl.tlName}</span>
                  <span className="text-xs text-muted-foreground ml-2">({tl.name} · {tl.agentCount} agents)</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>Leads: {tl.leadsCount}</span>
                  <span>Worked: {tl.workedToday}</span>
                  <span>STB: {tl.stb}</span>
                  <span>Disbursed: {tl.disbursed}</span>
                  {tl.missedFUs > 0 && <Badge variant="destructive" className="text-[9px]">{tl.missedFUs} missed F/U</Badge>}
                </div>
                {!tl.loggedIn && (
                  <Badge variant="secondary" className="text-[9px]">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Not Active
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
