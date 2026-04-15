import { useState, useMemo } from "react";
import { leads, agents, getDispositionLabel, getProductLabel, dispositionConfigs } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";

type ReportRow = { agent: string; agentName: string; disposition: string; dispositionLabel: string; count: number };

const GroupReportsPage = () => {
  const [agentFilter, setAgentFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (agentFilter !== "all" && l.assignedAgentId !== agentFilter) return false;
      if (productFilter !== "all" && l.productType !== productFilter) return false;
      if (dispositionFilter !== "all" && l.disposition !== dispositionFilter) return false;
      return true;
    });
  }, [agentFilter, productFilter, dispositionFilter]);

  const reportData = useMemo(() => {
    const map = new Map<string, ReportRow>();
    filtered.forEach(l => {
      const agent = agents.find(a => a.id === l.assignedAgentId);
      const config = dispositionConfigs.find(c => c.type === l.disposition);
      const key = `${l.assignedAgentId}__${l.disposition}`;
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { agent: l.assignedAgentId, agentName: agent?.name || "Unknown", disposition: l.disposition, dispositionLabel: config?.label || l.disposition, count: 1 });
    });
    return [...map.values()].sort((a, b) => a.agentName.localeCompare(b.agentName) || b.count - a.count);
  }, [filtered]);

  const totalCount = reportData.reduce((s, r) => s + r.count, 0);

  const handleExportCSV = () => {
    const header = "Agent,Disposition,Count\n";
    const rows = reportData.map(r => `${r.agentName},${r.dispositionLabel},${r.count}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "group_lead_report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const dispositions = [...new Set(leads.map(l => l.disposition))];

  const columns: ColumnDef<ReportRow>[] = [
    { id: "agent", label: "Agent", render: (r) => <span className="font-medium text-sm">{r.agentName}</span> },
    { id: "disposition", label: "Disposition", render: (r) => <span className="text-sm">{r.dispositionLabel}</span> },
    { id: "count", label: "Count", headerClassName: "text-right", render: (r) => <span className="text-right font-bold block">{r.count}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Group Lead Report</h1>
          <p className="text-muted-foreground text-sm">Agent × Disposition breakdown</p>
        </div>
        <Button size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
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
          <ConfigurableTable tableId="group-reports" columns={columns} data={reportData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupReportsPage;
