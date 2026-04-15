import { useState, useMemo } from "react";
import { leads, agents, teams, getDispositionLabel, dispositionConfigs } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", teams: ["team-1"] },
  { id: "mgr-2", name: "Anjali Kapoor", teams: ["team-2"] },
];

const OrgReportsPage = () => {
  const [managerFilter, setManagerFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const availableAgents = useMemo(() => {
    if (managerFilter !== "all") {
      const mgr = managers.find(m => m.id === managerFilter);
      return mgr ? agents.filter(a => mgr.teams.includes(a.teamId)) : [];
    }
    return agents;
  }, [managerFilter]);

  const reportData = useMemo(() => {
    let filtered = leads;
    if (managerFilter !== "all") {
      const mgr = managers.find(m => m.id === managerFilter);
      if (mgr) filtered = filtered.filter(l => mgr.teams.includes(l.assignedTeamId));
    }
    if (agentFilter !== "all") filtered = filtered.filter(l => l.assignedAgentId === agentFilter);

    const rows: { manager: string; agent: string; category: string; disposition: string; count: number }[] = [];
    const grouped = new Map<string, number>();

    filtered.forEach(l => {
      const agent = agents.find(a => a.id === l.assignedAgentId);
      const mgr = managers.find(m => m.teams.includes(l.assignedTeamId));
      const dc = dispositionConfigs.find(d => d.type === l.disposition);
      const key = `${mgr?.name || "—"}|${agent?.name || "—"}|${dc?.group || "Other"}|${dc?.label || l.disposition}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    grouped.forEach((count, key) => {
      const [manager, agent, category, disposition] = key.split("|");
      rows.push({ manager, agent, category, disposition, count });
    });

    return rows.sort((a, b) => a.manager.localeCompare(b.manager) || a.agent.localeCompare(b.agent));
  }, [leads, managerFilter, agentFilter]);

  const totalLeads = reportData.reduce((s, r) => s + r.count, 0);
  const mgrSummary = new Map<string, number>();
  reportData.forEach(r => {
    mgrSummary.set(r.manager, (mgrSummary.get(r.manager) || 0) + r.count);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisation Lead Count Report</h1>
          <p className="text-muted-foreground text-sm">{totalLeads} leads across organisation</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success("CSV exported")}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={managerFilter} onValueChange={v => { setManagerFilter(v); setAgentFilter("all"); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Manager" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {availableAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{totalLeads}</div><div className="text-xs text-muted-foreground">Total Leads</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{mgrSummary.size}</div><div className="text-xs text-muted-foreground">Managers</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{new Set(reportData.map(r => r.category)).size}</div><div className="text-xs text-muted-foreground">Disposition Categories</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Detailed Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Disposition</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.slice(0, 100).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{r.manager}</TableCell>
                    <TableCell className="text-xs">{r.agent}</TableCell>
                    <TableCell className="text-xs font-medium">{r.category}</TableCell>
                    <TableCell className="text-xs">{r.disposition}</TableCell>
                    <TableCell className="text-right font-medium">{r.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgReportsPage;
