import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle, IndianRupee, Phone, Send, Target, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { FunnelChart } from "@/components/FunnelChart";
import { EmptyState } from "@/components/EmptyState";
import { useLmsData } from "@/contexts/LmsDataContext";
import { useRole } from "@/contexts/RoleContext";
import { agents } from "@/data/mockData";
import {
  agentBreakdown,
  computeFunnel,
  computeKpis,
  delta,
  inrCompact,
  monthlySeries,
  scopeLeads,
} from "@/lib/metrics";

const metricOptions = [
  { key: "contactRate", label: "Contact Rate %" },
  { key: "stbRate", label: "Submission Rate %" },
  { key: "followUpCompliance", label: "Follow-Up Compliance %" },
  { key: "allocated", label: "Allocated" },
  { key: "callsLogged", label: "Calls Logged" },
  { key: "stbCount", label: "Submissions" },
  { key: "approved", label: "Approved" },
  { key: "disbursedCount", label: "Disbursed" },
] as const;

const PerformancePage = () => {
  const { leads } = useLmsData();
  const { role, currentAgentId, currentTeamId } = useRole();

  const [scope, setScope] = useState<"self" | "team" | "org">(role === "agent" ? "self" : role === "manager" ? "team" : "org");
  const [months, setMonths] = useState(6);
  const [metric, setMetric] = useState<string>("contactRate");

  const scoped = useMemo(() => {
    if (scope === "self") return leads.filter(l => l.assignedAgentId === currentAgentId);
    if (scope === "team") return leads.filter(l => l.assignedTeamId === currentTeamId);
    return scopeLeads(leads, { role, agentId: currentAgentId, teamId: currentTeamId });
  }, [leads, scope, role, currentAgentId, currentTeamId]);

  const series = useMemo(() => monthlySeries(scoped, months), [scoped, months]);
  const kpis = useMemo(() => computeKpis(scoped), [scoped]);
  const funnel = useMemo(() => computeFunnel(scoped), [scoped]);
  const agentRows = useMemo(
    () =>
      agentBreakdown(
        scoped,
        agents
          .filter(a => (scope === "team" ? a.teamId === currentTeamId : true))
          .map(a => ({ id: a.id, name: a.name, teamName: a.teamName })),
      ),
    [scoped, scope, currentTeamId],
  );

  const current = series[series.length - 1];
  const prev = series[series.length - 2] ?? current;
  const metricLabel = metricOptions.find(m => m.key === metric)?.label ?? "";

  const scopeTabs = [
    ...(role !== "data_admin" ? [{ value: "self", label: "My performance" }] : []),
    ...(role !== "agent" ? [{ value: "team", label: "My team" }] : []),
    ...(role === "cluster_head" || role === "data_admin" ? [{ value: "org", label: "Organisation" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Performance</h1>
          <p className="text-muted-foreground text-sm">Live metrics derived from actual lead activity</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {scopeTabs.length > 1 && (
            <Tabs value={scope} onValueChange={v => setScope(v as typeof scope)}>
              <TabsList className="h-9">
                {scopeTabs.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          <Select value={String(months)} onValueChange={v => setMonths(Number(v))}>
            <SelectTrigger className="h-9 w-36" aria-label="Select period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">This month</SelectItem>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Allocated" value={kpis.allocated} icon={Users} deltaPct={delta(current?.allocated ?? 0, prev?.allocated ?? 0)} />
        <KpiCard label="Contacted" value={kpis.contacted} icon={Phone} tone="info" deltaPct={delta(current?.contacted ?? 0, prev?.contacted ?? 0)} />
        <KpiCard label="Contact rate" value={`${kpis.contactRate}%`} icon={Target} tone="info" deltaPct={delta(current?.contactRate ?? 0, prev?.contactRate ?? 0)} />
        <KpiCard label="Submissions" value={kpis.submitted} icon={Send} deltaPct={delta(current?.stbCount ?? 0, prev?.stbCount ?? 0)} />
        <KpiCard label="Approved" value={kpis.approved} icon={CheckCircle} tone="success" hint={`${kpis.approvalRate}% approval`} />
        <KpiCard label="Disbursed value" value={inrCompact(kpis.disbursedAmount)} icon={IndianRupee} tone="success" deltaPct={delta(current?.disbursedAmount ?? 0, prev?.disbursedAmount ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base">Trend · {metricLabel}</CardTitle>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="h-8 w-full sm:w-52 text-xs" aria-label="Select metric"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {metricOptions.map(m => <SelectItem key={m.key} value={m.key} className="text-xs">{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => [metric === "disbursedAmount" ? inrCompact(v) : v, metricLabel]}
                  />
                  <Area type="monotone" dataKey={metric} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#perfFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <FunnelChart steps={funnel} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Monthly summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {series.map(m => (
              <div key={m.key} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{m.month}</span>
                  <Badge variant="outline" className="text-[10px]">{m.contactRate}% contact</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>Allocated <b className="text-foreground">{m.allocated}</b></span>
                  <span>Calls <b className="text-foreground">{m.callsLogged}</b></span>
                  <span>Subs <b className="text-foreground">{m.stbCount}</b></span>
                  <span>Approved <b className="text-foreground">{m.approved}</b></span>
                  <span>Disbursed <b className="text-foreground">{m.disbursedCount}</b></span>
                  <span>Amount <b className="text-foreground">{inrCompact(m.disbursedAmount)}</b></span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-2.5 font-medium">Month</th>
                  {["Allocated", "Contacted", "Contact %", "Calls", "Submissions", "Sub %", "Approved", "Declined", "Disbursed", "Amount", "F/U Compliance"].map(h => (
                    <th key={h} className="text-right p-2.5 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {series.map(m => (
                  <tr key={m.key} className="border-b hover:bg-accent/50">
                    <td className="p-2.5 font-medium whitespace-nowrap">{m.month}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.allocated}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.contacted}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.contactRate}%</td>
                    <td className="p-2.5 text-right tabular-nums">{m.callsLogged}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.stbCount}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.stbRate}%</td>
                    <td className="p-2.5 text-right tabular-nums">{m.approved}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.declined}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.disbursedCount}</td>
                    <td className="p-2.5 text-right tabular-nums">{inrCompact(m.disbursedAmount)}</td>
                    <td className="p-2.5 text-right tabular-nums">{m.followUpCompliance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {scope !== "self" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Agent leaderboard</CardTitle></CardHeader>
          <CardContent className="p-0">
            {agentRows.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No agent activity yet" description="Metrics appear once leads are allocated and worked." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-2.5 font-medium">Agent</th>
                      <th className="text-left p-2.5 font-medium">Team</th>
                      {["Leads", "Contact %", "Calls", "Submissions", "Approved", "Disbursed", "Overdue F/U"].map(h => (
                        <th key={h} className="text-right p-2.5 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agentRows.map(r => (
                      <tr key={r.agentId} className="border-b hover:bg-accent/50">
                        <td className="p-2.5 font-medium whitespace-nowrap">{r.agentName}</td>
                        <td className="p-2.5 text-muted-foreground whitespace-nowrap">{r.teamName}</td>
                        <td className="p-2.5 text-right tabular-nums">{r.total}</td>
                        <td className="p-2.5 text-right tabular-nums">{r.contactRate}%</td>
                        <td className="p-2.5 text-right tabular-nums">{r.callsLogged}</td>
                        <td className="p-2.5 text-right tabular-nums">{r.submitted}</td>
                        <td className="p-2.5 text-right tabular-nums">{r.approved}</td>
                        <td className="p-2.5 text-right tabular-nums">{r.disbursed}</td>
                        <td className={`p-2.5 text-right tabular-nums ${r.followUpsOverdue > 0 ? "text-destructive font-medium" : ""}`}>{r.followUpsOverdue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        All figures recomputed live from lead activity, calls, follow-ups, and partner decisions.
      </div>
    </div>
  );
};

export default PerformancePage;
