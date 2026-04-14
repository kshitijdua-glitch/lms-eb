import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shuffle, Users } from "lucide-react";
import { toast } from "sonner";

const mockPools = [
  { id: "pool-1", batch: "Google_Ads_Apr10", source: "Google Ads", product: "Personal Loan", date: "2026-04-10", count: 85, status: "Unallocated" },
  { id: "pool-2", batch: "Website_Apr06", source: "Website", product: "Home Loan", date: "2026-04-06", count: 120, status: "Unallocated" },
  { id: "pool-3", batch: "Partner_HDFC_Apr08", source: "Partner", product: "Personal Loan", date: "2026-04-08", count: 45, status: "Partial" },
  { id: "pool-4", batch: "Facebook_Apr04", source: "Facebook", product: "Credit Card", date: "2026-04-04", count: 0, status: "Allocated" },
  { id: "pool-5", batch: "IVR_Apr02", source: "IVR", product: "Business Loan", date: "2026-04-02", count: 32, status: "Unallocated" },
];

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", groupSize: 12 },
  { id: "mgr-2", name: "Anjali Kapoor", groupSize: 10 },
];

const tls = [
  { id: "tl-1", name: "Priya Sharma", team: "Alpha Squad", agentCount: 5, managerId: "mgr-1" },
  { id: "tl-2", name: "Ravi Kumar", team: "Beta Force", agentCount: 5, managerId: "mgr-1" },
];

const AdminAllocationPage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState("manager_group");
  const [manager, setManager] = useState("");
  const [tl, setTl] = useState("");

  const unallocated = mockPools.filter(p => p.status !== "Allocated");
  const selectedCount = unallocated.filter(p => selected.includes(p.id)).reduce((s, p) => s + p.count, 0);
  const filteredTLs = manager ? tls.filter(t => t.managerId === manager) : tls;

  const targetAgents = mode === "manager_group" && manager
    ? managers.find(m => m.id === manager)?.groupSize || 0
    : mode === "tl_team" && tl
      ? tls.find(t => t.id === tl)?.agentCount || 0
      : mode === "rr_group" ? managers.reduce((s, m) => s + m.groupSize, 0)
        : mode === "rr_team" && tl ? tls.find(t => t.id === tl)?.agentCount || 0 : 0;

  const leadsPerAgent = targetAgents > 0 ? Math.ceil(selectedCount / targetAgents) : 0;

  const handleAllocate = () => {
    if (selected.length === 0) return;
    toast.success(`${selectedCount} leads allocated via ${mode.replace(/_/g, " ")} to ${targetAgents} agents (~${leadsPerAgent} each)`);
    setSelected([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Allocation</h1>
        <p className="text-muted-foreground text-sm">Allocate unallocated lead pools to groups or teams</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Unallocated Pools ({unallocated.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager_group">Assign to Manager Group</SelectItem>
                  <SelectItem value="tl_team">Assign to TL Team</SelectItem>
                  <SelectItem value="rr_group">Auto Round Robin (Group)</SelectItem>
                  <SelectItem value="rr_team">Auto Round Robin (Team)</SelectItem>
                </SelectContent>
              </Select>
              {(mode === "manager_group" || mode === "tl_team") && (
                <Select value={manager} onValueChange={v => { setManager(v); setTl(""); }}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Manager" /></SelectTrigger>
                  <SelectContent>
                    {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {(mode === "tl_team" || mode === "rr_team") && (
                <Select value={tl} onValueChange={setTl}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="TL" /></SelectTrigger>
                  <SelectContent>
                    {filteredTLs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" disabled={selected.length === 0 || targetAgents === 0} onClick={handleAllocate}>
                <Shuffle className="h-3 w-3 mr-1" /> Allocate ({selectedCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unallocated.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox checked={selected.includes(p.id)} onCheckedChange={() =>
                      setSelected(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])
                    } />
                  </TableCell>
                  <TableCell className="font-medium">{p.batch}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{p.source}</Badge></TableCell>
                  <TableCell className="text-sm">{p.product}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.date}</TableCell>
                  <TableCell className="text-right font-medium">{p.count}</TableCell>
                  <TableCell><Badge variant={p.status === "Partial" ? "secondary" : "outline"} className="text-[10px]">{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected.length > 0 && targetAgents > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">Allocation Preview</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Total Leads:</span> <span className="font-bold">{selectedCount}</span></div>
              <div><span className="text-muted-foreground">Target Agents:</span> <span className="font-bold">{targetAgents}</span></div>
              <div><span className="text-muted-foreground">Leads/Agent:</span> <span className="font-bold">~{leadsPerAgent}</span></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAllocationPage;
