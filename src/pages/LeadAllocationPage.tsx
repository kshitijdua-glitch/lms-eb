import { useState, useMemo } from "react";
import { agents, teams } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", teams: ["team-1"] },
  { id: "mgr-2", name: "Anjali Kapoor", teams: ["team-2"] },
];

type BatchRow = {
  id: string;
  batchName: string;
  fileName: string;
  uploadDate: string;
  source: string;
  product: string;
  count: number;
  status: "awaiting_allocation" | "partially_allocated" | "allocated";
};

const unallocatedBatches: BatchRow[] = [
  { id: "batch-1", batchName: "Google_Ads_Apr14", fileName: "Google_Ads_Apr14.csv", uploadDate: "2026-04-14", source: "Google Ads", product: "Personal Loan", count: 238, status: "awaiting_allocation" },
  { id: "batch-2", batchName: "Partner_Leads_Q1", fileName: "Partner_Leads_Q1.xlsx", uploadDate: "2026-04-13", source: "Partner", product: "Home Loan", count: 85, status: "awaiting_allocation" },
  { id: "batch-3", batchName: "FB_Campaign_Mar", fileName: "FB_Campaign_Mar.csv", uploadDate: "2026-04-12", source: "Facebook", product: "Personal Loan", count: 42, status: "partially_allocated" },
  { id: "batch-4", batchName: "IVR_Apr_Week2", fileName: "IVR_Apr_Week2.csv", uploadDate: "2026-04-11", source: "IVR", product: "Credit Card", count: 18, status: "awaiting_allocation" },
  { id: "batch-5", batchName: "Website_Organic_Apr", fileName: "Website_Organic_Apr.xlsx", uploadDate: "2026-04-10", source: "Website", product: "Business Loan", count: 31, status: "awaiting_allocation" },
];

const statusLabels: Record<BatchRow["status"], string> = {
  awaiting_allocation: "Awaiting Allocation",
  partially_allocated: "Partially Allocated",
  allocated: "Allocated",
};

const statusVariant: Record<BatchRow["status"], "default" | "secondary" | "outline"> = {
  awaiting_allocation: "secondary",
  partially_allocated: "outline",
  allocated: "default",
};

const LeadAllocationPage = () => {
  const [showAllocate, setShowAllocate] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
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
    const batch = unallocatedBatches.find(b => b.id === selectedBatch);
    if (!batch) return;
    if (allocMode === "round_robin") toast.success(`${batch.count} leads from "${batch.batchName}" auto-allocated via Round Robin`);
    else if (allocMode === "to_agent" && targetAgent) toast.success(`${batch.count} leads from "${batch.batchName}" allocated to ${agents.find(a => a.id === targetAgent)?.name}`);
    else if (allocMode === "to_team" && targetTeam) toast.success(`${batch.count} leads from "${batch.batchName}" allocated to team ${teams.find(t => t.id === targetTeam)?.name}`);
    else if (allocMode === "to_group" && targetManager) toast.success(`${batch.count} leads from "${batch.batchName}" allocated to ${managers.find(m => m.id === targetManager)?.name}'s group`);
    else { toast.error("Select a valid allocation target"); return; }
    setShowAllocate(false); setSelectedBatch(null); setAllocMode("round_robin"); setTargetManager(""); setTargetTeam(""); setTargetAgent("");
  };

  const totalUnallocated = unallocatedBatches.filter(b => b.status !== "allocated").reduce((s, b) => s + b.count, 0);
  const activeBatches = unallocatedBatches.filter(b => b.status !== "allocated").length;
  const currentBatch = unallocatedBatches.find(b => b.id === selectedBatch);

  const columns: ColumnDef<BatchRow>[] = [
    { id: "batchName", label: "Batch Name", render: (b) => <span className="font-medium">{b.batchName}</span> },
    { id: "fileName", label: "File", render: (b) => <span className="text-xs text-muted-foreground">{b.fileName}</span> },
    { id: "uploadDate", label: "Upload Date", render: (b) => <span className="text-sm text-muted-foreground">{b.uploadDate}</span> },
    { id: "source", label: "Source", render: (b) => <Badge variant="outline" className="text-xs">{b.source}</Badge> },
    { id: "product", label: "Product", render: (b) => <Badge variant="outline" className="text-xs">{b.product}</Badge> },
    { id: "count", label: "Leads", headerClassName: "text-right", render: (b) => <span className="text-right font-medium block">{b.count}</span> },
    { id: "status", label: "Status", render: (b) => <Badge variant={statusVariant[b.status]} className="text-[10px]">{statusLabels[b.status]}</Badge> },
    { id: "action", label: "Action", locked: "end", render: (b) => (
      <div onClick={e => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={b.status === "allocated"} onClick={() => { setSelectedBatch(b.id); setShowAllocate(true); }}>
          <Upload className="h-3 w-3 mr-1" /> Allocate
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Allocation</h1>
          <p className="text-muted-foreground text-sm">{totalUnallocated} unallocated leads across {activeBatches} batches</p>
        </div>
        <Button variant="outline" onClick={() => toast.success("Auto Round Robin triggered for all batches")}>
          <Shuffle className="h-4 w-4 mr-1" /> Auto Allocate All
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{totalUnallocated}</div><div className="text-xs text-muted-foreground">Total Unallocated</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{activeBatches}</div><div className="text-xs text-muted-foreground">Active Batches</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{agents.filter(a => a.status === "active").length}</div><div className="text-xs text-muted-foreground">Active Agents</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{teams.length}</div><div className="text-xs text-muted-foreground">Active Teams</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <ConfigurableTable tableId="lead-allocation" columns={columns} data={unallocatedBatches} />
        </CardContent>
      </Card>

      <Dialog open={showAllocate} onOpenChange={setShowAllocate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate — {currentBatch?.batchName} ({currentBatch?.count} leads)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Allocation Mode</Label><Select value={allocMode} onValueChange={setAllocMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="round_robin">Auto Round Robin</SelectItem><SelectItem value="to_group">Assign to Manager Group</SelectItem><SelectItem value="to_team">Assign to Team</SelectItem><SelectItem value="to_agent">Assign to Agent</SelectItem></SelectContent></Select></div>
            {(allocMode === "to_group" || allocMode === "to_team" || allocMode === "to_agent") && (
              <div><Label>Manager</Label><Select value={targetManager} onValueChange={v => { setTargetManager(v); setTargetTeam(""); setTargetAgent(""); }}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
            )}
            {(allocMode === "to_team" || allocMode === "to_agent") && (
              <div><Label>Team</Label><Select value={targetTeam} onValueChange={v => { setTargetTeam(v); setTargetAgent(""); }}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{availableTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            )}
            {allocMode === "to_agent" && (
              <div><Label>Agent</Label><Select value={targetAgent} onValueChange={setTargetAgent}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{availableAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
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
