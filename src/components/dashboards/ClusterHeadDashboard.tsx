import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leads, agents, teams, lendingPartners } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatTile } from "@/components/StatTile";
import { useNavigate } from "react-router-dom";
import {
  Users, Clock, Send, CheckCircle, AlertTriangle, BarChart3, UserCog,
  Upload, Settings, FileText, TrendingUp, Shield, ArrowRight,
} from "lucide-react";

export function ClusterHeadDashboard() {
  const navigate = useNavigate();

  // Pipeline funnel
  const allocated = leads.length;
  const contacted = leads.filter(l => !["new"].includes(l.stage)).length;
  const stbSubmitted = leads.filter(l => ["stb_submitted", "approved", "disbursed"].includes(l.stage)).length;
  const approved = leads.filter(l => ["approved", "disbursed"].includes(l.stage)).length;
  const disbursed = leads.filter(l => l.stage === "disbursed").length;
  const totalDisbursedAmt = leads.flatMap(l => l.stbSubmissions).filter(s => s.status === "disbursed").reduce((s, d) => s + (d.disbursedAmount || 0), 0);

  const funnelSteps = [
    { label: "Allocated", value: allocated, rate: 100 },
    { label: "Contacted", value: contacted, rate: Math.round((contacted / allocated) * 100) },
    { label: "STB", value: stbSubmitted, rate: Math.round((stbSubmitted / allocated) * 100) },
    { label: "Approved", value: approved, rate: Math.round((approved / allocated) * 100) },
    { label: "Disbursed", value: disbursed, rate: Math.round((disbursed / allocated) * 100) },
  ];

  // Manager group comparison (mock 2 managers mapped to teams)
  const managers = [
    { name: "Vikram Mehta", teams: ["team-1"], id: "mgr-1" },
    { name: "Anjali Kapoor", teams: ["team-2"], id: "mgr-2" },
  ];

  const managerStats = managers.map(mgr => {
    const mgrTeams = teams.filter(t => mgr.teams.includes(t.id));
    const mgrAgents = agents.filter(a => mgr.teams.includes(a.teamId));
    const mgrLeads = leads.filter(l => mgr.teams.includes(l.assignedTeamId));
    const mgrContacted = mgrLeads.filter(l => !["new"].includes(l.stage)).length;
    const mgrSTB = mgrLeads.filter(l => ["stb_submitted", "approved", "disbursed"].includes(l.stage)).length;
    const mgrDisbursed = mgrLeads.filter(l => l.stage === "disbursed").length;
    return {
      name: mgr.name,
      groupSize: mgrAgents.length,
      leads: mgrLeads.length,
      contactRate: mgrLeads.length > 0 ? Math.round((mgrContacted / mgrLeads.length) * 100) : 0,
      stb: mgrSTB,
      disbursed: mgrDisbursed,
    };
  });

  // System alerts
  const today = new Date().toISOString().split("T")[0];
  const inactiveAgents = agents.filter(a => a.status === "inactive").length;
  
  const missedFUs = leads.flatMap(l => l.followUps).filter(f => f.status === "missed").length;
  const staleSTBs = leads.flatMap(l => l.stbSubmissions).filter(s => {
    const days = Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / 86400000);
    return s.status === "submitted" && days > 7;
  }).length;
  const expiringLeads = leads.filter(l => {
    const daysToExpiry = Math.floor((new Date(l.expiresAt).getTime() - Date.now()) / 86400000);
    return daysToExpiry <= 7 && daysToExpiry > 0;
  }).length;

  const alerts = [
    { label: "Inactive Agents", value: inactiveAgents, severity: inactiveAgents > 0 ? "warning" : "ok" },
    
    { label: "Missed Follow-Ups", value: missedFUs, severity: missedFUs > 5 ? "error" : missedFUs > 0 ? "warning" : "ok" },
    { label: "Stale STBs (>7d)", value: staleSTBs, severity: staleSTBs > 0 ? "warning" : "ok" },
    { label: "Expiring Leads (7d)", value: expiringLeads, severity: expiringLeads > 3 ? "error" : expiringLeads > 0 ? "warning" : "ok" },
  ];

  const quickNav = [
    { label: "Org Leads", icon: Users, path: "/org-leads" },
    { label: "Org Follow-Ups", icon: Clock, path: "/org-follow-ups" },
    { label: "Org SLP", icon: Send, path: "/org-stb" },
    { label: "Staff Mgmt", icon: UserCog, path: "/staff-management" },
    { label: "System Config", icon: Settings, path: "/system-config" },
    { label: "Lead Allocation", icon: Upload, path: "/lead-allocation" },
    { label: "Lead Report", icon: FileText, path: "/org-reports" },
    
    { label: "Audit Trail", icon: Shield, path: "/audit-trail" },
  ];

  const funnelTones = ["primary", "info", "warning", "success", "primary"] as const;
  const alertTones: Record<string, "destructive" | "warning" | "muted"> = {
    error: "destructive",
    warning: "warning",
    ok: "muted",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Cluster Head Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Organisation-wide overview & control</p>
      </div>

      {/* Pipeline Health Strip — gradient stat tiles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-eyebrow">Organisation Pipeline Health</h3>
          <span className="text-xs text-muted-foreground">
            Total Disbursed: <strong className="text-foreground">₹{(totalDisbursedAmt / 100000).toFixed(1)}L</strong>
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {funnelSteps.map((step, idx) => (
            <StatTile
              key={step.label}
              label={step.label}
              value={step.value}
              tone={funnelTones[idx]}
              variant="gradient"
              hint={`${step.rate}% conversion`}
            />
          ))}
        </div>
      </div>

      {/* Manager Group Comparison */}
      <Card>
        <CardHeader className="pb-3"><CardTitle>Manager Group Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Group Size</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Contact Rate</TableHead>
                <TableHead className="text-right">STB</TableHead>
                <TableHead className="text-right">Disbursed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerStats.map(m => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.groupSize}</TableCell>
                  <TableCell className="text-right">{m.leads}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={m.contactRate > 70 ? "success" : "warning"}>{m.contactRate}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">{m.stb}</TableCell>
                  <TableCell className="text-right">{m.disbursed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Alerts — soft StatTiles */}
      <div>
        <h3 className="text-eyebrow mb-2 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" /> System Alerts</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {alerts.map(a => (
            <StatTile
              key={a.label}
              label={a.label}
              value={a.value}
              tone={alertTones[a.severity]}
              variant="soft"
            />
          ))}
        </div>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick Navigation</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {quickNav.map(n => (
              <Button key={n.label} variant="outline" className="flex flex-col h-auto py-3 gap-1" onClick={() => navigate(n.path)}>
                <n.icon className="h-5 w-5" />
                <span className="text-[10px]">{n.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
