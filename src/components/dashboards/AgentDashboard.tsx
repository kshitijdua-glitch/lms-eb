import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { leads, getLeadsForAgent, getDispositionLabel, getStageLabel } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Calendar, CheckCircle, Phone, Send, TrendingUp, Users } from "lucide-react";

export function AgentDashboard() {
  const navigate = useNavigate();
  const myLeads = getLeadsForAgent("agent-1");
  const today = new Date().toISOString().split("T")[0];

  const missedFollowUps = myLeads.filter(l => l.followUps.some(f => f.status === "missed"));
  const todayFollowUps = myLeads.filter(l => l.followUps.some(f => f.status === "pending" && f.scheduledAt.split("T")[0] <= today));
  const workedToday = myLeads.filter(l => l.lastActivityAt.split("T")[0] === today);
  const stbCount = myLeads.filter(l => l.stbSubmissions.length > 0);
  const approved = myLeads.filter(l => l.stage === "approved" || l.stage === "disbursed");
  const disbursed = myLeads.filter(l => l.stage === "disbursed");
  const totalDisbursed = disbursed.reduce((s, l) => s + (l.stbSubmissions[0]?.disbursedAmount || 0), 0);

  const kpis = [
    { label: "Missed Follow-Ups", value: missedFollowUps.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Today's Follow-Ups", value: todayFollowUps.length, icon: Calendar, color: "text-warning" },
    { label: "Leads Worked Today", value: workedToday.length, icon: Phone, color: "text-info" },
    { label: "STB Count (Month)", value: stbCount.length, icon: Send, color: "text-primary" },
    { label: "Approved (Month)", value: approved.length, icon: CheckCircle, color: "text-success" },
    { label: "Disbursed Amount", value: `₹${(totalDisbursed / 100000).toFixed(1)}L`, icon: TrendingUp, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, Amit!</h1>
        <p className="text-muted-foreground">Here's your daily overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Button className="h-20 text-lg" onClick={() => navigate("/leads")}>
          <Users className="mr-2 h-5 w-5" /> My Leads ({myLeads.length})
        </Button>
        <Button variant="outline" className="h-20 text-lg" onClick={() => navigate("/follow-ups")}>
          <Calendar className="mr-2 h-5 w-5" /> My Follow-Ups ({todayFollowUps.length})
        </Button>
        <Button variant="outline" className="h-20 text-lg" onClick={() => navigate("/stb")}>
          <Send className="mr-2 h-5 w-5" /> My STB ({stbCount.length})
        </Button>
      </div>

      {missedFollowUps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Missed Follow-Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missedFollowUps.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <div>
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">{lead.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">{getDispositionLabel(lead.disposition)}</Badge>
                    <Badge variant="outline" className="text-xs">{getStageLabel(lead.stage)}</Badge>
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
