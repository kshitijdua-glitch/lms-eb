import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLeadsForTeam, getAgentsForTeam, agents, getDispositionLabel } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, Users, TrendingUp, Clock } from "lucide-react";

const COLORS = ["hsl(221, 83%, 25%)", "hsl(199, 89%, 48%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export function TLDashboard() {
  const teamLeads = getLeadsForTeam("team-1");
  const teamAgents = getAgentsForTeam("team-1");

  const totalLeads = teamLeads.length;
  const contacted = teamLeads.filter(l => l.stage !== "new").length;
  const stbSubmitted = teamLeads.filter(l => l.stbSubmissions.length > 0).length;
  const followUpCompliance = teamLeads.length > 0
    ? Math.round((teamLeads.filter(l => !l.followUps.some(f => f.status === "missed")).length / teamLeads.length) * 100) : 0;

  const agentActivity = teamAgents.filter(a => a.id !== "agent-9").map(a => {
    const agentLeads = teamLeads.filter(l => l.assignedAgentId === a.id);
    return {
      name: a.name.split(" ")[0],
      leads: agentLeads.length,
      contacted: agentLeads.filter(l => l.stage !== "new").length,
      stb: agentLeads.filter(l => l.stbSubmissions.length > 0).length,
    };
  });

  const dispositionBreakdown = ["connected_interested", "connected_not_interested", "not_contactable", "documents_pending", "bre_eligible"].map(d => ({
    name: getDispositionLabel(d as any),
    value: teamLeads.filter(l => l.disposition === d).length,
  }));

  const agingAlerts = teamLeads.filter(l => {
    const daysSince = Math.floor((Date.now() - new Date(l.lastActivityAt).getTime()) / 86400000);
    return daysSince > 3 && l.stage !== "disbursed" && l.stage !== "closed_lost";
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Dashboard — Alpha Squad</h1>
        <p className="text-muted-foreground">Team Leader: Priya Sharma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: totalLeads, icon: Users },
          { label: "Contacted", value: contacted, icon: TrendingUp },
          { label: "STB Submitted", value: stbSubmitted, icon: TrendingUp },
          { label: "FU Compliance", value: `${followUpCompliance}%`, icon: Clock },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <k.icon className="h-4 w-4 text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Agent Activity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={agentActivity}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="leads" fill="hsl(221, 83%, 25%)" name="Total" />
                <Bar dataKey="contacted" fill="hsl(199, 89%, 48%)" name="Contacted" />
                <Bar dataKey="stb" fill="hsl(142, 76%, 36%)" name="STB" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Disposition Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={dispositionBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {dispositionBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {agingAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Aging Alerts ({agingAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-auto">
              {agingAlerts.slice(0, 10).map(l => {
                const days = Math.floor((Date.now() - new Date(l.lastActivityAt).getTime()) / 86400000);
                return (
                  <div key={l.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <span className="font-medium text-sm">{l.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">Agent: {agents.find(a => a.id === l.assignedAgentId)?.name}</span>
                    </div>
                    <Badge variant={days > 7 ? "destructive" : "secondary"} className="text-xs">
                      {days}d inactive
                    </Badge>
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
