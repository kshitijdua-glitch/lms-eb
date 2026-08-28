import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/KpiCard";
import { FunnelChart } from "@/components/FunnelChart";
import { EmptyState } from "@/components/EmptyState";
import { agents } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useLmsData } from "@/contexts/LmsDataContext";
import { agentBreakdown, computeFunnel, computeKpis, inrCompact, partnerBreakdown, scopeLeads } from "@/lib/metrics";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BarChart3, Calendar, CheckCircle, Clock, FileText, LayoutDashboard,
  Send, Target, TrendingUp, UserCog, Users,
} from "lucide-react";

const MY_TARGET = 10;

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { role, currentAgentId, currentTeamId } = useRole();
  const { leads } = useLmsData();

  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const teamLeads = useMemo(
    () => scopeLeads(leads, { role, agentId: currentAgentId, teamId: currentTeamId }),
    [leads, role, currentAgentId, currentTeamId],
  );
  const myLeads = useMemo(() => leads.filter(l => l.assignedAgentId === currentAgentId), [leads, currentAgentId]);

  const teamKpis = useMemo(() => computeKpis(teamLeads), [teamLeads]);
  const myKpis = useMemo(() => computeKpis(myLeads), [myLeads]);
  const funnel = useMemo(() => computeFunnel(teamLeads), [teamLeads]);
  const partners = useMemo(() => partnerBreakdown(teamLeads).slice(0, 5), [teamLeads]);

  const teamAgents = useMemo(
    () => agents.filter(a => teamLeads.some(l => l.assignedAgentId === a.id) || a.teamId === currentTeamId),
    [teamLeads, currentTeamId],
  );
  const rows = useMemo(() => agentBreakdown(teamLeads, teamAgents), [teamLeads, teamAgents]);

  const myCallsToday = myLeads.reduce((s, l) => s + (l.callLogs ?? []).filter(c => c.timestamp.slice(0, 10) === today).length, 0);
  const myTargetPct = Math.min(100, Math.round((myCallsToday / MY_TARGET) * 100));

  const activity = teamAgents.map(a => {
    const own = teamLeads.filter(l => l.assignedAgentId === a.id);
    const callsToday = own.reduce((s, l) => s + (l.callLogs ?? []).filter(c => c.timestamp.slice(0, 10) === today).length, 0);
    const workedToday = own.filter(l => l.lastActivityAt?.slice(0, 10) === today).length;
    const k = computeKpis(own);
    return { ...a, leadCount: own.length, callsToday, workedToday, overdue: k.followUpsOverdue, active: callsToday > 0 || workedToday > 0 };
  });
  const online = activity.filter(a => a.active).length;
  const zeroActivity = activity.filter(a => !a.active && a.leadCount > 0);
  const expiring = teamLeads.filter(l => {
    const exp = new Date(l.expiresAt).getTime();
    return exp > now && exp - now < 7 * 86400000;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" aria-hidden /> Manager dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Live team production, SLA health and partner pipeline</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Team leads" value={teamKpis.total} icon={FileText} to="/group-leads" />
          <KpiCard label="Contact rate" value={`${teamKpis.contactRate}%`} icon={CheckCircle} tone="info" hint={`${teamKpis.contacted} contacted`} />
          <KpiCard label="Overdue follow-ups" value={teamKpis.followUpsOverdue} icon={AlertTriangle} tone="danger" to="/group-follow-ups" />
          <KpiCard label="Due today" value={teamKpis.followUpsToday} icon={Clock} tone="warning" to="/group-follow-ups" />
          <KpiCard label="Submissions" value={teamKpis.submitted} icon={Send} to="/group-stb" hint={`${teamKpis.approvalRate}% approval`} />
          <KpiCard label="Disbursed value" value={inrCompact(teamKpis.disbursedAmount)} icon={TrendingUp} tone="success" hint={`${teamKpis.disbursed} disbursed`} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart steps={funnel} title="Team lifecycle funnel" />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" aria-hidden /> Team health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Follow-up compliance</span><span className="font-semibold">{teamKpis.followUpCompliance}%</span></div>
            <Progress value={teamKpis.followUpCompliance} className="h-2" />
            <div className="flex justify-between"><span className="text-muted-foreground">Agents active today</span><span className="font-semibold">{online}/{activity.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expiring leads (7d)</span><span className="font-semibold">{expiring}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bureau pulls</span><span className="font-semibold">{teamKpis.bureauPulled}</span></div>
            {zeroActivity.length > 0 && (
              <div className="p-2 rounded border border-destructive/30 space-y-1">
                <div className="text-[11px] font-medium text-destructive">Zero activity today</div>
                {zeroActivity.map(a => (
                  <div key={a.id} className="text-[11px] text-muted-foreground">{a.name} · {a.leadCount} leads</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">My own production</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="My leads" value={myKpis.total} icon={FileText} to="/leads" />
          <KpiCard label="My submissions" value={myKpis.submitted} icon={Send} />
          <KpiCard label="My overdue F/U" value={myKpis.followUpsOverdue} icon={AlertTriangle} tone="danger" to="/follow-ups" />
          <KpiCard label="My disbursed" value={myKpis.disbursed} icon={TrendingUp} tone="success" />
        </div>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Target className="h-4 w-4 text-primary shrink-0" aria-hidden />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Daily target · {myCallsToday}/{MY_TARGET} calls</div>
              <Progress value={myTargetPct} className="h-2 mt-1" />
            </div>
            <span className="text-sm font-semibold tabular-nums">{myTargetPct}%</span>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" aria-hidden /> Agent leaderboard</CardTitle>
          </CardHeader>
          <CardContent className={rows.length ? "p-0" : ""}>
            {rows.length === 0 ? (
              <EmptyState title="No agent activity yet" description="Metrics appear once leads are allocated to your team." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Agent</th>
                      <th className="text-right p-2 font-medium">Leads</th>
                      <th className="text-right p-2 font-medium">Contact %</th>
                      <th className="text-right p-2 font-medium">Subs</th>
                      <th className="text-right p-2 font-medium">Disb.</th>
                      <th className="text-right p-2 font-medium">Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.agentId} className="border-t">
                        <td className="p-2 whitespace-nowrap">{r.agentName}</td>
                        <td className="p-2 text-right tabular-nums">{r.total}</td>
                        <td className="p-2 text-right tabular-nums">{r.contactRate}%</td>
                        <td className="p-2 text-right tabular-nums">{r.submitted}</td>
                        <td className="p-2 text-right tabular-nums">{r.disbursed}</td>
                        <td className="p-2 text-right tabular-nums">
                          {r.followUpsOverdue > 0
                            ? <Badge variant="destructive" className="text-[10px]">{r.followUpsOverdue}</Badge>
                            : <span className="text-muted-foreground">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4" aria-hidden /> Partner pipeline</CardTitle>
          </CardHeader>
          <CardContent className={partners.length ? "space-y-3" : ""}>
            {partners.length === 0 ? (
              <EmptyState title="No submissions yet" description="Partner metrics appear after the first application is submitted." />
            ) : (
              partners.map(p => (
                <div key={p.partnerId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{p.partnerName}</span>
                    <span className="text-muted-foreground tabular-nums">{p.approved}/{p.submitted} · {p.approvalRate}% · {p.avgTat}d TAT</span>
                  </div>
                  <Progress value={p.approvalRate} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Group leads", path: "/group-leads", icon: FileText },
          { label: "Group follow-ups", path: "/group-follow-ups", icon: Calendar },
          { label: "Partner submissions", path: "/group-stb", icon: Send },
          { label: "Group management", path: "/group-management", icon: UserCog },
        ].map(nav => (
          <Button key={nav.path} variant="outline" className="h-16 flex-col gap-1" onClick={() => navigate(nav.path)}>
            <nav.icon className="h-5 w-5" aria-hidden />
            <span className="text-xs">{nav.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
