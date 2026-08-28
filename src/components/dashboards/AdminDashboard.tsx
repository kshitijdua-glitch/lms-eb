import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { FunnelChart } from "@/components/FunnelChart";
import { EmptyState } from "@/components/EmptyState";
import { agents, teams } from "@/data/mockData";
import { useLmsData } from "@/contexts/LmsDataContext";
import { computeFunnel, computeKpis, inrCompact } from "@/lib/metrics";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BarChart3, Building2, Database, FileText, Gauge,
  Settings, Shield, Upload, UserCog, Users,
} from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { leads } = useLmsData();

  const kpis = useMemo(() => computeKpis(leads), [leads]);
  const funnel = useMemo(() => computeFunnel(leads), [leads]);

  const unallocated = leads.filter(l => l.stage === "new").length;
  const staleLeads = leads.filter(l => {
    const days = Math.floor((Date.now() - new Date(l.lastActivityAt).getTime()) / 86400000);
    return days > 10 && l.stage !== "disbursed" && l.stage !== "closed_lost";
  }).length;
  const activeAgents = agents.filter(a => a.status === "active").length;
  const missingPan = leads.filter(l => !l.pan).length;

  /** Batch view derived from the live lead set. */
  const batches = useMemo(() => {
    const map = new Map<string, { name: string; rows: number; allocated: number; latest: string }>();
    for (const l of leads) {
      const key = l.batchId || l.leadSource || l.source || "unknown";
      const row = map.get(key) ?? { name: key, rows: 0, allocated: 0, latest: l.createdAt };
      row.rows += 1;
      if (l.assignedAgentId) row.allocated += 1;
      if (l.createdAt > row.latest) row.latest = l.createdAt;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.latest.localeCompare(a.latest)).slice(0, 6);
  }, [leads]);

  const quickNav = [
    { label: "Upload leads", icon: Upload, path: "/admin/upload" },
    { label: "Lead allocation", icon: Users, path: "/admin/allocation" },
    { label: "Lead pools", icon: Database, path: "/admin/pools" },
    { label: "Lending partners", icon: Building2, path: "/admin/partners" },
    { label: "MIS export", icon: BarChart3, path: "/admin/mis" },
    { label: "Staff management", icon: UserCog, path: "/admin/staff" },
    { label: "System config", icon: Settings, path: "/system-config" },
    { label: "Audit trail", icon: Shield, path: "/audit-trail" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Data admin dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Data operations, allocation coverage and system health</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total leads" value={kpis.total} icon={Database} to="/admin/pools" />
        <KpiCard label="Unallocated" value={unallocated} icon={AlertTriangle} tone={unallocated ? "warning" : "success"} to="/admin/allocation" />
        <KpiCard label="Stale (>10d)" value={staleLeads} icon={AlertTriangle} tone={staleLeads ? "danger" : "success"} />
        <KpiCard label="Missing PAN" value={missingPan} icon={FileText} tone={missingPan ? "warning" : "success"} />
        <KpiCard label="Bureau pulls" value={kpis.bureauPulled} icon={Gauge} />
        <KpiCard label="Active staff" value={`${activeAgents}/${agents.length}`} icon={UserCog} hint={`${teams.length} teams`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart steps={funnel} title="Data-to-disbursal funnel" />

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Batch &amp; source coverage</CardTitle></CardHeader>
          <CardContent className={batches.length ? "space-y-2" : ""}>
            {batches.length === 0 ? (
              <EmptyState title="No batches ingested" description="Upload a lead file to see batch coverage here." />
            ) : (
              batches.map(b => {
                const pct = b.rows ? Math.round((b.allocated / b.rows) * 100) : 0;
                return (
                  <div key={b.name} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium block truncate">{b.name}</span>
                      <span className="text-xs text-muted-foreground">{b.latest.slice(0, 10)}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">{b.allocated}/{b.rows} allocated</span>
                      <Badge variant={pct === 100 ? "success" : pct > 0 ? "warning" : "outline"} className="text-[10px]">
                        {pct === 100 ? "Allocated" : pct > 0 ? "Partial" : "Unallocated"}
                      </Badge>
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickNav.map(b => (
          <Button key={b.label} variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate(b.path)}>
            <b.icon className="h-5 w-5" aria-hidden />
            <span className="text-xs text-center leading-tight">{b.label}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Pipeline value in system · sanctioned {inrCompact(kpis.sanctionedAmount)} · disbursed {inrCompact(kpis.disbursedAmount)}
      </p>
    </div>
  );
}
