import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { FunnelChart } from "@/components/FunnelChart";
import { EmptyState } from "@/components/EmptyState";
import { agents, teams } from "@/data/mockData";
import { useLmsData } from "@/contexts/LmsDataContext";
import { computeFunnel, computeKpis, inrCompact, partnerBreakdown } from "@/lib/metrics";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BarChart3, CheckCircle, Clock, FileText, Gauge, Send,
  Settings, Shield, TrendingUp, Upload, UserCog, Users,
} from "lucide-react";

const MANAGERS = [
  { id: "mgr-1", name: "Vikram Mehta", teams: ["team-1"] },
  { id: "mgr-2", name: "Anjali Kapoor", teams: ["team-2"] },
];

export function ClusterHeadDashboard() {
  const navigate = useNavigate();
  const { leads } = useLmsData();

  const kpis = useMemo(() => computeKpis(leads), [leads]);
  const funnel = useMemo(() => computeFunnel(leads), [leads]);
  const partners = useMemo(() => partnerBreakdown(leads), [leads]);

  const managerStats = useMemo(
    () =>
      MANAGERS.map(mgr => {
        const mgrLeads = leads.filter(l => mgr.teams.includes(l.assignedTeamId));
        const k = computeKpis(mgrLeads);
        return {
          name: mgr.name,
          teamNames: teams.filter(t => mgr.teams.includes(t.id)).map(t => t.name).join(", "),
          groupSize: agents.filter(a => mgr.teams.includes(a.teamId)).length,
          leads: mgrLeads.length,
          contactRate: k.contactRate,
          submitted: k.submitted,
          approvalRate: k.approvalRate,
          disbursed: k.disbursed,
          overdue: k.followUpsOverdue,
        };
      }),
    [leads],
  );

  const inactiveAgents = agents.filter(a => a.status === "inactive").length;
  const staleSubmissions = leads
    .flatMap(l => l.stbSubmissions ?? [])
    .filter(s => (s.status === "submitted" || s.status === "under_review") &&
      Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / 86400000) > 7).length;
  const expiring = leads.filter(l => {
    const days = Math.floor((new Date(l.expiresAt).getTime() - Date.now()) / 86400000);
    return days <= 7 && days > 0;
  }).length;

  const alerts = [
    { label: "Inactive agents", value: inactiveAgents, bad: inactiveAgents > 0 },
    { label: "Consent pending", value: kpis.consentPending, bad: kpis.consentPending > 3 },
    { label: "Overdue follow-ups", value: kpis.followUpsOverdue, bad: kpis.followUpsOverdue > 5 },
    { label: "Stale applications (>7d)", value: staleSubmissions, bad: staleSubmissions > 0 },
    { label: "Expiring leads (7d)", value: expiring, bad: expiring > 3 },
  ];

  const quickNav = [
    { label: "Org leads", icon: Users, path: "/org-leads" },
    { label: "Org follow-ups", icon: Clock, path: "/org-follow-ups" },
    { label: "Partner submissions", icon: Send, path: "/org-stb" },
    { label: "Staff", icon: UserCog, path: "/staff-management" },
    { label: "System config", icon: Settings, path: "/system-config" },
    { label: "Allocation", icon: Upload, path: "/lead-allocation" },
    { label: "Reports", icon: FileText, path: "/org-reports" },
    { label: "Audit trail", icon: Shield, path: "/audit-trail" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Cluster head dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Organisation-wide pipeline, partner performance and compliance</p>
        </div>
        <div className="text-xs text-muted-foreground">
          Sanctioned: <strong className="text-foreground">{inrCompact(kpis.sanctionedAmount)}</strong> · Disbursed:{" "}
          <strong className="text-foreground">{inrCompact(kpis.disbursedAmount)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total leads" value={kpis.total} icon={Users} to="/org-leads" />
        <KpiCard label="Contact rate" value={`${kpis.contactRate}%`} icon={CheckCircle} tone="info" hint={`${kpis.contacted} contacted`} />
        <KpiCard label="Bureau pulls" value={kpis.bureauPulled} icon={Gauge} />
        <KpiCard label="Submissions" value={kpis.submitted} icon={Send} to="/org-stb" hint={`${kpis.approvalRate}% approval`} />
        <KpiCard label="Disbursed" value={kpis.disbursed} icon={TrendingUp} tone="success" hint={inrCompact(kpis.disbursedAmount)} />
        <KpiCard label="Overdue follow-ups" value={kpis.followUpsOverdue} icon={AlertTriangle} tone="danger" to="/org-follow-ups" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart steps={funnel} title="Organisation lifecycle funnel" />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4" aria-hidden /> Partner performance</CardTitle>
          </CardHeader>
          <CardContent className={partners.length ? "space-y-3" : ""}>
            {partners.length === 0 ? (
              <EmptyState title="No partner applications yet" description="Submit a lead to a lending partner to see performance." />
            ) : (
              partners.slice(0, 6).map(p => (
                <div key={p.partnerId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium truncate">{p.partnerName}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {p.approved}/{p.submitted} · {p.approvalRate}% · {p.avgTat}d · {inrCompact(p.disbursedAmount)}
                    </span>
                  </div>
                  <Progress value={p.approvalRate} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" aria-hidden /> Manager group comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead className="text-right">Group size</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Contact rate</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Approval %</TableHead>
                  <TableHead className="text-right">Disbursed</TableHead>
                  <TableHead className="text-right">Overdue F/U</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managerStats.map(m => (
                  <TableRow key={m.name}>
                    <TableCell className="font-medium whitespace-nowrap">{m.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{m.teamNames}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.groupSize}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.leads}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={m.contactRate > 70 ? "success" : "warning"}>{m.contactRate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{m.submitted}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.approvalRate}%</TableCell>
                    <TableCell className="text-right tabular-nums">{m.disbursed}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.overdue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Compliance &amp; SLA alerts
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {alerts.map(a => (
            <KpiCard key={a.label} label={a.label} value={a.value} tone={a.bad ? "danger" : "success"} />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Quick navigation</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {quickNav.map(n => (
              <Button key={n.label} variant="outline" className="flex flex-col h-auto py-3 gap-1" onClick={() => navigate(n.path)}>
                <n.icon className="h-5 w-5" aria-hidden />
                <span className="text-[10px] text-center leading-tight">{n.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
