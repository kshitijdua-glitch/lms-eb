import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/KpiCard";
import { FunnelChart } from "@/components/FunnelChart";
import { EmptyState } from "@/components/EmptyState";
import { getDispositionLabel, getStageLabel } from "@/data/mockData";
import { useLmsData } from "@/contexts/LmsDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { computeFunnel, computeKpis, inrCompact, scopeLeads } from "@/lib/metrics";
import { getFollowUpBucket } from "@/lib/followUpStatus";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Calendar, CheckCircle, Clock, Phone, Plus, Send, Target, TrendingUp, Users } from "lucide-react";

const DAILY_TARGET = 15;

export function AgentDashboard() {
  const navigate = useNavigate();
  const { leads } = useLmsData();
  const { role, currentAgentId, currentTeamId } = useRole();
  const { user } = useAuth();

  const myLeads = useMemo(
    () => scopeLeads(leads, { role, agentId: currentAgentId, teamId: currentTeamId }),
    [leads, role, currentAgentId, currentTeamId],
  );
  const kpis = useMemo(() => computeKpis(myLeads), [myLeads]);
  const funnel = useMemo(() => computeFunnel(myLeads), [myLeads]);

  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const overdueLeads = useMemo(
    () => myLeads.filter(l => (l.followUps ?? []).some(f => getFollowUpBucket(f.scheduledAt, f.status) === "overdue")),
    [myLeads],
  );
  const workedToday = myLeads.filter(l => l.lastActivityAt?.slice(0, 10) === today).length;
  const neverContacted = myLeads.filter(l => (l.callLogs?.length ?? 0) === 0).length;
  const callsToday = myLeads.reduce(
    (sum, l) => sum + (l.callLogs ?? []).filter(c => c.timestamp.slice(0, 10) === today).length,
    0,
  );
  const targetPct = Math.min(100, Math.round((callsToday / DAILY_TARGET) * 100));

  const expiringLeads = myLeads.filter(l => {
    const exp = new Date(l.expiresAt).getTime();
    return exp > now && exp - now <= 3 * 86400000;
  });

  const firstName = (user?.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Your live pipeline and today's priorities</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Never contacted: <span className="font-semibold text-warning">{neverContacted}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Assigned leads" value={kpis.total} icon={Users} to="/leads" />
        <KpiCard label="Overdue follow-ups" value={kpis.followUpsOverdue} icon={AlertTriangle} tone="danger" to="/follow-ups" />
        <KpiCard label="Due today" value={kpis.followUpsToday} icon={Calendar} tone="warning" to="/follow-ups" />
        <KpiCard label="Worked today" value={workedToday} icon={Phone} tone="info" hint={`${callsToday} calls logged`} />
        <KpiCard label="Partner submissions" value={kpis.submitted} icon={Send} to="/stb" />
        <KpiCard
          label="Disbursed value"
          value={inrCompact(kpis.disbursedAmount)}
          icon={TrendingUp}
          tone="success"
          hint={`${kpis.disbursed} disbursed · ${kpis.approvalRate}% approval`}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-sm font-medium">Daily call target</span>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">{callsToday}/{DAILY_TARGET} calls</span>
          </div>
          <Progress value={targetPct} className="h-2" />
          {targetPct >= 100 && <p className="text-xs text-success mt-1">Target achieved for today.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart steps={funnel} title="My lifecycle funnel" />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" aria-hidden /> Work quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Contact rate</span><span className="font-semibold">{kpis.contactRate}%</span></div>
            <Progress value={kpis.contactRate} className="h-2" />
            <div className="flex justify-between"><span className="text-muted-foreground">Follow-up compliance</span><span className="font-semibold">{kpis.followUpCompliance}%</span></div>
            <Progress value={kpis.followUpCompliance} className="h-2" />
            <div className="flex justify-between"><span className="text-muted-foreground">Bureau reports pulled</span><span className="font-semibold">{kpis.bureauPulled}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Hot leads</span><span className="font-semibold">{kpis.hotLeads}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Consent pending</span><span className="font-semibold">{kpis.consentPending}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button className="h-16 text-sm" onClick={() => navigate("/leads")}>
          <Users className="mr-2 h-4 w-4" aria-hidden /> My leads ({kpis.total})
        </Button>
        <Button variant="outline" className="h-16 text-sm" onClick={() => navigate("/follow-ups")}>
          <Calendar className="mr-2 h-4 w-4" aria-hidden /> Follow-ups ({kpis.followUpsPending})
        </Button>
        <Button variant="outline" className="h-16 text-sm" onClick={() => navigate("/stb")}>
          <Send className="mr-2 h-4 w-4" aria-hidden /> Submissions ({kpis.submitted})
        </Button>
        <Button variant="outline" className="h-16 text-sm border-dashed" onClick={() => navigate("/leads?create=true")}>
          <Plus className="mr-2 h-4 w-4" aria-hidden /> Create new lead
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden /> Overdue follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className={overdueLeads.length ? "space-y-2" : ""}>
            {overdueLeads.length === 0 ? (
              <EmptyState title="Nothing overdue" description="Every scheduled follow-up is on time." />
            ) : (
              overdueLeads.slice(0, 5).map(lead => (
                <button
                  key={lead.id}
                  className="w-full flex items-center justify-between gap-2 p-2 rounded border text-left hover:bg-accent/50"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <span className="min-w-0">
                    <span className="font-medium text-sm block truncate">{lead.name}</span>
                    <span className="text-muted-foreground text-xs">{lead.mobile}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Badge variant="destructive" className="text-[10px]">{getDispositionLabel(lead.disposition)}</Badge>
                    <Badge variant="outline" className="text-[10px]">{getStageLabel(lead.stage)}</Badge>
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" aria-hidden /> Expiring within 3 days
            </CardTitle>
          </CardHeader>
          <CardContent className={expiringLeads.length ? "space-y-2" : ""}>
            {expiringLeads.length === 0 ? (
              <EmptyState title="No expiring leads" description="No allocations are close to expiry." />
            ) : (
              expiringLeads.slice(0, 5).map(lead => {
                const daysLeft = Math.max(1, Math.ceil((new Date(lead.expiresAt).getTime() - now) / 86400000));
                return (
                  <button
                    key={lead.id}
                    className="w-full flex items-center justify-between gap-2 p-2 rounded border text-left hover:bg-accent/50"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-sm block truncate">{lead.name}</span>
                      <span className="text-muted-foreground text-xs">{lead.mobile}</span>
                    </span>
                    <Badge variant="outline" className="text-xs text-warning shrink-0">{daysLeft}d left</Badge>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
