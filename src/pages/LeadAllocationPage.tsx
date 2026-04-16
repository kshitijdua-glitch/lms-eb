import { useState, useMemo } from "react";
import { agents, teams } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Shuffle, Plus, Trash2 } from "lucide-react";
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

type AllocSplit = {
  id: string;
  mode: "round_robin" | "to_group" | "to_team" | "to_agent";
  managerId: string;
  teamId: string;
  agentId: string;
  count: number;
};

let splitIdCounter = 0;
const newSplit = (count: number): AllocSplit => ({
  id: `split-${++splitIdCounter}`,
  mode: "round_robin",
  count,
  managerId: "",
  teamId: "",
  agentId: "",
});

const LeadAllocationPage = () => {
  const [showAllocate, setShowAllocate] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<AllocSplit[]>([]);

  // single-allocation state (when split is off)
  const [allocMode, setAllocMode] = useState("round_robin");
  const [targetManager, setTargetManager] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [targetAgent, setTargetAgent] = useState("");

  const currentBatch = unallocatedBatches.find(b => b.id === selectedBatch);

  const openDialog = (batchId: string) => {
    setSelectedBatch(batchId);
    const batch = unallocatedBatches.find(b => b.id === batchId)!;
    setSplitMode(false);
    setSplits([newSplit(batch.count)]);
    setAllocMode("round_robin");
    setTargetManager("");
    setTargetTeam("");
    setTargetAgent("");
    setShowAllocate(true);
  };

  const teamsForManager = (mgrId: string) => {
    if (!mgrId) return teams;
    const mgr = managers.find(m => m.id === mgrId);
    return mgr ? teams.filter(t => mgr.teams.includes(t.id)) : [];
  };

  const agentsForTeam = (teamId: string) => {
    if (!teamId) return [];
    return agents.filter(a => a.teamId === teamId && a.status === "active");
  };

  const totalSplitCount = splits.reduce((s, sp) => s + sp.count, 0);
  const splitCountValid = currentBatch ? totalSplitCount === currentBatch.count : false;

  const updateSplit = (id: string, patch: Partial<AllocSplit>) => {
    setSplits(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addSplit = () => {
    if (!currentBatch) return;
    const used = splits.reduce((s, sp) => s + sp.count, 0);
    const remaining = Math.max(0, currentBatch.count - used);
    setSplits(prev => [...prev, newSplit(remaining)]);
  };

  const removeSplit = (id: string) => {
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const handleAllocate = () => {
    if (!currentBatch) return;

    if (splitMode) {
      if (!splitCountValid) {
        toast.error(`Split counts must add up to ${currentBatch.count} (currently ${totalSplitCount})`);
        return;
      }
      for (const sp of splits) {
        if (sp.count <= 0) { toast.error("Each split must have at least 1 lead"); return; }
        if (sp.mode === "to_agent" && !sp.agentId) { toast.error("Select an agent for each split"); return; }
        if (sp.mode === "to_team" && !sp.teamId) { toast.error("Select a team for each split"); return; }
        if (sp.mode === "to_group" && !sp.managerId) { toast.error("Select a manager for each split"); return; }
      }
      const summary = splits.map(sp => {
        const target = sp.mode === "round_robin" ? "Round Robin"
          : sp.mode === "to_agent" ? agents.find(a => a.id === sp.agentId)?.name
          : sp.mode === "to_team" ? teams.find(t => t.id === sp.teamId)?.name
          : managers.find(m => m.id === sp.managerId)?.name;
        return `${sp.count} → ${target}`;
      }).join(", ");
      toast.success(`"${currentBatch.batchName}" split-allocated: ${summary}`);
    } else {
      if (allocMode === "round_robin") toast.success(`${currentBatch.count} leads from "${currentBatch.batchName}" auto-allocated via Round Robin`);
      else if (allocMode === "to_agent" && targetAgent) toast.success(`${currentBatch.count} leads allocated to ${agents.find(a => a.id === targetAgent)?.name}`);
      else if (allocMode === "to_team" && targetTeam) toast.success(`${currentBatch.count} leads allocated to team ${teams.find(t => t.id === targetTeam)?.name}`);
      else if (allocMode === "to_group" && targetManager) toast.success(`${currentBatch.count} leads allocated to ${managers.find(m => m.id === targetManager)?.name}'s group`);
      else { toast.error("Select a valid allocation target"); return; }
    }

    setShowAllocate(false);
    setSelectedBatch(null);
  };

  const totalUnallocated = unallocatedBatches.filter(b => b.status !== "allocated").reduce((s, b) => s + b.count, 0);
  const activeBatches = unallocatedBatches.filter(b => b.status !== "allocated").length;

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
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={b.status === "allocated"} onClick={() => openDialog(b.id)}>
          <Upload className="h-3 w-3 mr-1" /> Allocate
        </Button>
      </div>
    )},
  ];

  const renderTargetSelectors = (
    mode: string,
    managerId: string,
    teamId: string,
    agentId: string,
    onManager: (v: string) => void,
    onTeam: (v: string) => void,
    onAgent: (v: string) => void,
  ) => (
    <>
      {(mode === "to_group" || mode === "to_team" || mode === "to_agent") && (
        <div>
          <Label className="text-xs">Manager</Label>
          <Select value={managerId} onValueChange={v => { onManager(v); onTeam(""); onAgent(""); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {(mode === "to_team" || mode === "to_agent") && (
        <div>
          <Label className="text-xs">Team</Label>
          <Select value={teamId} onValueChange={v => { onTeam(v); onAgent(""); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{teamsForManager(managerId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {mode === "to_agent" && (
        <div>
          <Label className="text-xs">Agent</Label>
          <Select value={agentId} onValueChange={onAgent}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{agentsForTeam(teamId).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
    </>
  );

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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Allocate — {currentBatch?.batchName} ({currentBatch?.count} leads)</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 pb-2 border-b">
            <Switch checked={splitMode} onCheckedChange={v => { setSplitMode(v); if (v && splits.length < 2 && currentBatch) { const half = Math.floor(currentBatch.count / 2); setSplits([newSplit(half), newSplit(currentBatch.count - half)]); } }} />
            <Label className="text-sm">Split batch across multiple targets</Label>
          </div>

          {!splitMode ? (
            <div className="space-y-3">
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
              {renderTargetSelectors(allocMode, targetManager, targetTeam, targetAgent, setTargetManager, setTargetTeam, setTargetAgent)}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {splits.map((sp, idx) => (
                <Card key={sp.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Split {idx + 1}</span>
                    {splits.length > 2 && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeSplit(sp.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Lead Count</Label>
                      <Input type="number" min={1} max={currentBatch?.count} value={sp.count} onChange={e => updateSplit(sp.id, { count: Math.max(0, parseInt(e.target.value) || 0) })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Mode</Label>
                      <Select value={sp.mode} onValueChange={v => updateSplit(sp.id, { mode: v as AllocSplit["mode"], managerId: "", teamId: "", agentId: "" })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="to_group">Manager Group</SelectItem>
                          <SelectItem value="to_team">Team</SelectItem>
                          <SelectItem value="to_agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {renderTargetSelectors(
                    sp.mode, sp.managerId, sp.teamId, sp.agentId,
                    v => updateSplit(sp.id, { managerId: v, teamId: "", agentId: "" }),
                    v => updateSplit(sp.id, { teamId: v, agentId: "" }),
                    v => updateSplit(sp.id, { agentId: v }),
                  )}
                </Card>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={addSplit}>
                <Plus className="h-3 w-3 mr-1" /> Add Split
              </Button>
              {currentBatch && (
                <div className={`text-xs text-center ${splitCountValid ? "text-green-600" : "text-destructive"}`}>
                  {totalSplitCount} / {currentBatch.count} leads assigned {splitCountValid ? "✓" : `(${currentBatch.count - totalSplitCount} remaining)`}
                </div>
              )}
            </div>
          )}

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
