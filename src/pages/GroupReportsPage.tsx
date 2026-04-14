import { useState, useMemo } from "react";
import { leads, agents, teams, getDispositionLabel, getProductLabel, dispositionConfigs } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const GroupReportsPage = () => {
  const [tlFilter, setTlFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");

  const availableAgents = useMemo(() => {
    if (tlFilter === "all") return agents.filter(a => a.tlId);
    const team = teams.find(t => t.tlId === tlFilter);
    return team ? agents.filter(a => a.teamId === team.id && a.id !== team.tlId) : [];
  }, [tlFilter]);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (tlFilter !== "all") {
        const team = teams.find(t => t.tlId === tlFilter);
        if (!team || l.assignedTeamId !== team.id) return false;
      }
      if (agentFilter !== "all" && l.assignedAgentId !== agentFilter) return false;
      if (productFilter !== "all" && l.productType !== productFilter) return false;
      if (dispositionFilter !== "all" && l.disposition !== dispositionFilter) return false;
      return true;
    });
  }, [tlFilter, agentFilter, productFilter, dispositionFilter]);

  const reportData = useMemo(() => {
    const map = new Map<string, { tl: string; tlName: string; agent: string; agentName: string; disposition: string; dispositionLabel: string; count: number }>();
    filtered.forEach(l => {
      const agent = agents.find(a => a.id === l.assignedAgentId);
      const team = teams.find(t => t.id === l.assignedTeamId);
      const config = dispositionConfigs.find(c => c.type === l.disposition);
      const key = `${l.assignedTeamId}__${l.assignedAgentId}__${l.disposition}`;
      const existing = map.get(key);
      if (existing) { existing.count++; }
      else {
        map.set(key, {
          tl: team?.tlId || "", tlName: team?.tlName || "—",
          agent: l.assignedAgentId, agentName: agent?.name || "Unknown",
          disposition: l.disposition, dispositionLabel: config?.label || l.disposition,
          count: 1,
        });
      }
    });
    return [...map.values()].sort((a, b) => a.tlName.localeCompare(b.tlName) || a.agentName.localeCompare(b.agentName) || b.count - a.count);
  }, [filtered]);

  const totalCount = reportData.reduce((s, r) => s + r.count, 0);

  // TL-level summaries
  const tlSummaries = useMemo(() => {
    const map = new Map<string, { tlName: string; count: number }>();
    reportData.forEach(r => {
      const existing = map.get(r.tl);
      if (existing) existing.count += r.count;
      else map.set(r.tl, { tlName: r.tlName, count: r.count });
    });
    return map;
  }, [reportData]);

  const handleExportCSV = () => {
    const header = "TL,Agent,Disposition,Count\n";
    const rows = reportData.map(r => `${r.tlName},${r.agentName},${r.dispositionLabel},${r.count}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "group_lead_report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const dispositions = [...new Set(leads.map(l => l.disposition))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Group Lead Report</h1>
          <p className="text-muted-foreground text-sm">TL × Agent × Disposition breakdown</p>
        </div>
        <Button size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={tlFilter} onValueChange={v => { setTlFilter(v); setAgentFilter("all"); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="TL" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All TLs</SelectItem>
            {teams.map(t => <SelectItem key={t.tlId} value={t.tlId}>{t.tlName}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {availableAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p =>
              <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Disposition" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dispositions</SelectItem>
            {dispositions.map(d => <SelectItem key={d} value={d}>{getDispositionLabel(d)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Report ({reportData.length} rows · {totalCount} total leads)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TL</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm text-muted-foreground">{r.tlName}</TableCell>
                  <TableCell className="font-medium text-sm">{r.agentName}</TableCell>
                  <TableCell className="text-sm">{r.dispositionLabel}</TableCell>
                  <TableCell className="text-right font-bold">{r.count}</TableCell>
                </TableRow>
              ))}
              {/* TL Summary rows */}
              {[...tlSummaries.entries()].map(([tlId, data]) => (
                <TableRow key={`summary-${tlId}`} className="bg-muted/30 font-medium">
                  <TableCell>{data.tlName} Total</TableCell>
                  <TableCell colSpan={2}></TableCell>
                  <TableCell className="text-right font-bold">{data.count}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={3}>Grand Total</TableCell>
                <TableCell className="text-right">{totalCount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupReportsPage;
