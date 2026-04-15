import { useState, useMemo } from "react";
import { leads, agents, teams } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Shuffle } from "lucide-react";
import { toast } from "sonner";

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", teams: ["team-1"] },
  { id: "mgr-2", name: "Anjali Kapoor", teams: ["team-2"] },
];

const unallocatedPools = [
  { id: "pool-1", source: "Website", date: "2026-04-13", count: 15, product: "Personal Loan" },
  { id: "pool-2", source: "Google Ads", date: "2026-04-13", count: 8, product: "Home Loan" },
  { id: "pool-3", source: "Partner", date: "2026-04-12", count: 22, product: "Personal Loan" },
  { id: "pool-4", source: "Facebook", date: "2026-04-12", count: 5, product: "Business Loan" },
  { id: "pool-5", source: "IVR", date: "2026-04-11", count: 12, product: "Credit Card" },
];

const LeadAllocationPage = () => {
  const [showAllocate, setShowAllocate] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [allocMode, setAllocMode] = useState("round_robin");
  const [targetManager, setTargetManager] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [targetAgent, setTargetAgent] = useState("");

  const availableTeams = useMemo(() => {
    if (!targetManager) return teams;
    const mgr = managers.find(m => m.id === targetManager);
    return mgr ? teams.filter(t => mgr.teams.includes(t.id)) : [];
  }, [targetManager]);

  const availableAgents = useMemo(() => {
    if (!targetTeam) return [];
    return agents.filter(a => a.teamId === targetTeam && a.status === "active");
  }, [targetTeam]);

  const handleAllocate = () => {
    const pool = unallocatedPools.find(p => p.id === selectedPool);
    if (!pool) return;
    if (allocMode === "round_robin") {
      toast.success(`${pool.count} leads auto-allocated via Round Robin`);
    } else if (allocMode === "to_agent" && targetAgent) {
      toast.success(`${pool.count} leads allocated to ${agents.find(a => a.id === targetAgent)?.name}`);
    } else if (allocMode === "to_team" && targetTeam) {
      toast.success(`${pool.count} leads allocated to team ${teams.find(t => t.id === targetTeam)?.name}`);
    } else if (allocMode === "to_group" && targetManager) {
      toast.success(`${pool.count} leads allocated to ${managers.find(m => m.id === targetManager)?.name}'s group`);
    } else {
      toast.error("Select a valid allocation target");
      return;
    }
    setShowAllocate(false);
    setSelectedPool(null); setAllocMode("round_robin"); setTargetManager(""); setTargetTeam(""); setTargetAgent("");
  };

  const totalUnallocated = unallocatedPools.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Allocation</h1>
          <p className="text-muted-foreground text-sm">{totalUnallocated} unallocated leads across {unallocatedPools.length} pools</p>
        </div>
        <Button variant="outline" onClick={() => toast.success("Auto Round Robin triggered for all pools")}>
          <Shuffle className="h-4 w-4 mr-1" /> Auto Allocate All
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{totalUnallocated}</div><div className="text-xs text-muted-foreground">Total Unallocated</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{unallocatedPools.length}</div><div className="text-xs text-muted-foreground">Active Pools</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{agents.filter(a => a.status === "active").length}</div><div className="text-xs text-muted-foreground">Active Agents</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{teams.length}</div><div className="text-xs text-muted-foreground">Active Teams</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Unallocated Lead Pools</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unallocatedPools.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.date}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.product}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{p.count}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedPool(p.id); setShowAllocate(true); }}>
                      <Upload className="h-3 w-3 mr-1" /> Allocate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAllocate} onOpenChange={setShowAllocate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Leads — {unallocatedPools.find(p => p.id === selectedPool)?.source} ({unallocatedPools.find(p => p.id === selectedPool)?.count} leads)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Allocation Mode</Label>
              <Select value={allocMode} onValueChange={setAllocMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Auto Round Robin</SelectItem>
                  <SelectItem value="to_group">Assign to Manager Group</SelectItem>
                  <SelectItem value="to_team">Assign to Team</SelectItem>
                  <SelectItem value="to_agent">Assign to Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(allocMode === "to_group" || allocMode === "to_team" || allocMode === "to_agent") && (
              <div>
                <Label>Manager</Label>
                <Select value={targetManager} onValueChange={v => { setTargetManager(v); setTargetTeam(""); setTargetAgent(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(allocMode === "to_team" || allocMode === "to_agent") && (
              <div>
                <Label>Team</Label>
                <Select value={targetTeam} onValueChange={v => { setTargetTeam(v); setTargetAgent(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {availableTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {allocMode === "to_agent" && (
              <div>
                <Label>Agent</Label>
                <Select value={targetAgent} onValueChange={setTargetAgent}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {availableAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocate(false)}>Cancel</Button>
            <Button onClick={handleAllocate}>Allocate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadAllocationPage;
