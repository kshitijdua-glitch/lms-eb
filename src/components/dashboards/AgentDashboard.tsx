import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { leads, getLeadsForAgent, getDispositionLabel, getStageLabel } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Calendar, CheckCircle, Clock, Phone, Plus, Send, Target, TrendingUp, Users } from "lucide-react";

export function AgentDashboard() {
  const navigate = useNavigate();
  const myLeads = getLeadsForAgent("agent-1");
  const today = new Date().toISOString().split("T")[0];

  const totalAssigned = myLeads.length;
  const missedFollowUps = myLeads.filter(l => l.followUps.some(f => f.status === "missed"));
  const todayFollowUps = myLeads.filter(l => l.followUps.some(f => f.status === "pending" && f.scheduledAt.split("T")[0] <= today));
  const workedToday = myLeads.filter(l => l.lastActivityAt.split("T")[0] === today);
  const neverContacted = myLeads.filter(l => l.callLogs.length === 0);
  const stbCount = myLeads.filter(l => l.stbSubmissions.length > 0);
  const approved = myLeads.filter(l => l.stage === "approved" || l.stage === "disbursed");
  const disbursed = myLeads.filter(l => l.stage === "disbursed");
  const totalDisbursed = disbursed.reduce((s, l) => s + (l.stbSubmissions[0]?.disbursedAmount || 0), 0);

  // Expiry warnings — leads expiring within 3 days
  const now = Date.now();
  const expiringLeads = myLeads.filter(l => {
    const exp = new Date(l.expiresAt).getTime();
    return exp > now && exp - now <= 3 * 86400000;
  });

  // Daily target tracker
  const dailyTarget = 15;
  const callsToday = myLeads.reduce((sum, l) => sum + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0);
  const targetPct = Math.min(100, Math.round((callsToday / dailyTarget) * 100));

  const kpis = [
    { label: "Total Assigned", value: totalAssigned, icon: Users, color: "text-primary" },
    { label: "Missed Follow-Ups", value: missedFollowUps.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Today's Follow-Ups", value: todayFollowUps.length, icon: Calendar, color: "text-warning" },
    { label: "Leads Worked Today", value: workedToday.length, icon: Phone, color: "text-info" },
    { label: "STB Count (Month)", value: stbCount.length, icon: Send, color: "text-primary" },
    { label: "Approved (Month)", value: approved.length, icon: CheckCircle, color: "text-success" },
    { label: "Disbursed Amount", value: `₹${(totalDisbursed / 100000).toFixed(1)}L`, icon: TrendingUp, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, Amit!</h1>
          <p className="text-muted-foreground">Here's your daily overview</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Never Contacted: <span className="font-bold text-warning">{neverContacted.length}</span>
        </div>
      </div>

      {/* KPI Cards — first 4 are highlighted gradient tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((kpi, i) => {
          const isHighlight = i < 4;
          if (isHighlight) {
            return (
              <Card
                key={kpi.label}
                className="border-0 text-white shadow-md bg-gradient-to-br from-primary to-[hsl(265_84%_62%)]"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kpi.icon className="h-4 w-4 text-white/90" />
                  </div>
                  <div className="text-xl font-bold">{kpi.value}</div>
                  <div className="text-[10px] text-white/80 leading-tight">{kpi.label}</div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card key={kpi.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Target Tracker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Daily Call Target</span>
            </div>
            <span className="text-sm text-muted-foreground">{callsToday}/{dailyTarget} calls</span>
          </div>
          <Progress value={targetPct} className="h-2" />
          {targetPct >= 100 && <p className="text-xs text-success mt-1">🎉 Target achieved! Keep going!</p>}
        </CardContent>
      </Card>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button className="h-16 text-sm" onClick={() => navigate("/leads")}>
          <Users className="mr-2 h-4 w-4" /> My Leads ({myLeads.length})
        </Button>
        <Button variant="outline" className="h-16 text-sm" onClick={() => navigate("/follow-ups")}>
          <Calendar className="mr-2 h-4 w-4" /> Follow-Ups ({todayFollowUps.length})
        </Button>
        <Button variant="outline" className="h-16 text-sm" onClick={() => navigate("/stb")}>
          <Send className="mr-2 h-4 w-4" /> My STB ({stbCount.length})
        </Button>
        <Button variant="outline" className="h-16 text-sm border-dashed" onClick={() => navigate("/leads?create=true")}>
          <Plus className="mr-2 h-4 w-4" /> Create New Lead
        </Button>
      </div>

      {/* Expiring Leads Warning */}
      {expiringLeads.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" />
              Leads Expiring Soon ({expiringLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringLeads.slice(0, 3).map((lead) => {
                const daysLeft = Math.ceil((new Date(lead.expiresAt).getTime() - now) / 86400000);
                return (
                  <div key={lead.id} className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <div>
                      <span className="font-medium text-sm">{lead.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">{lead.mobile}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-warning">{daysLeft}d left</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missed Follow-Ups */}
      {missedFollowUps.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Missed Follow-Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missedFollowUps.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <div>
                    <span className="font-medium text-sm">{lead.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">{lead.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[10px]">{getDispositionLabel(lead.disposition)}</Badge>
                    <Badge variant="outline" className="text-[10px]">{getStageLabel(lead.stage)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
