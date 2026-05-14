import { useState, useMemo } from "react";
import { agents, teams } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Shuffle, ChevronRight, ChevronLeft, Check, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import { useRole } from "@/contexts/RoleContext";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { cn } from "@/lib/utils";

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

type AllocMode = "round_robin" | "to_group" | "to_agent";

const MODE_LABELS: Record<AllocMode, string> = {
  round_robin: "Round Robin (auto-balance across active agents)",
  to_group: "Assign to a Manager group",
  to_agent: "Assign to a single Agent",
};

const STEP_TITLES = ["Select batch", "Allocation mode", "Capacity preview", "Confirm"];

const LeadAllocationPage = () => {
  const { role } = useRole();
  const { logAudit } = useAudit();
  const actor = buildActor(role, "agent-1");

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);

  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [allocMode, setAllocMode] = useState<AllocMode>("round_robin");
  const [targetManager, setTargetManager] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [targetAgent, setTargetAgent] = useState("");

  const currentBatch = unallocatedBatches.find(b => b.id === selectedBatch);

  const openWizard = (batchId?: string) => {
    setSelectedBatch(batchId ?? null);
    setStep(batchId ? 1 : 0);
    setAllocMode("round_robin");
    setTargetManager("");
    setTargetTeam("");
    setTargetAgent("");
    setShowWizard(true);
  };

  const teamsForManager = (mgrId: string) =>
    !mgrId ? teams : teams.filter(t => managers.find(m => m.id === mgrId)?.teams.includes(t.id));
  const agentsForTeam = (teamId: string) =>
    !teamId ? [] : agents.filter(a => a.teamId === teamId && a.status === "active");

  // Capacity preview — distribute count across selected assignees
  const capacityPreview = useMemo(() => {
    if (!currentBatch) return [];
    const count = currentBatch.count;
    if (allocMode === "to_agent" && targetAgent) {
      const a = agents.find(x => x.id === targetAgent);
      return a ? [{ id: a.id, name: a.name, sub: a.teamName, current: a.leadsAssigned, incoming: count }] : [];
    }
    if (allocMode === "to_group" && targetManager) {
      const tIds = managers.find(m => m.id === targetManager)?.teams ?? [];
      const ags = agents.filter(a => tIds.includes(a.teamId) && a.status === "active");
      const per = Math.floor(count / Math.max(ags.length, 1));
      const rem = count - per * ags.length;
      return ags.map((a, i) => ({ id: a.id, name: a.name, sub: a.teamName, current: a.leadsAssigned, incoming: per + (i < rem ? 1 : 0) }));
    }
    if (allocMode === "round_robin") {
      const ags = agents.filter(a => a.status === "active");
      const per = Math.floor(count / Math.max(ags.length, 1));
      const rem = count - per * ags.length;
      return ags.map((a, i) => ({ id: a.id, name: a.name, sub: a.teamName, current: a.leadsAssigned, incoming: per + (i < rem ? 1 : 0) }));
    }
    return [];
  }, [currentBatch, allocMode, targetAgent, targetTeam, targetManager]);

  const canProceed = () => {
    if (step === 0) return !!selectedBatch;
    if (step === 1) {
      if (allocMode === "to_agent") return !!targetAgent;
      if (allocMode === "to_group") return !!targetManager;
      return true;
    }
    if (step === 2) return capacityPreview.length > 0;
    return true;
  };

  const handleConfirm = () => {
    if (!currentBatch) return;
    const target =
      allocMode === "round_robin" ? `Round Robin · ${capacityPreview.length} agents`
      : allocMode === "to_agent" ? `Agent ${agents.find(a => a.id === targetAgent)?.name}`
      : `Manager ${managers.find(m => m.id === targetManager)?.name}`;

    logAudit({
      ...actor,
      action: "allocate_batch",
      entityType: "batch",
      entityId: currentBatch.id,
      entityLabel: currentBatch.batchName,
      after: { mode: allocMode, target, count: currentBatch.count, distribution: capacityPreview.map(p => `${p.name}:${p.incoming}`) },
    });

    toast.success(`${currentBatch.count} leads from "${currentBatch.batchName}" allocated`, { description: target });
    setShowWizard(false);
    setSelectedBatch(null);
    setStep(0);
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
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={b.status === "allocated"} onClick={() => openWizard(b.id)}>
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
        <Button onClick={() => openWizard()}>
          <Shuffle className="h-4 w-4 mr-1.5" /> New Allocation
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

      <Dialog open={showWizard} onOpenChange={(v) => { setShowWizard(v); if (!v) setStep(0); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Allocate Leads — {STEP_TITLES[step]}</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            {STEP_TITLES.map((t, i) => (
              <div key={t} className="flex-1 flex items-center gap-2">
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                  i < step ? "bg-primary text-primary-foreground"
                  : i === step ? "bg-primary/15 text-primary border border-primary"
                  : "bg-muted text-muted-foreground",
                )}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-xs hidden md:inline", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>{t}</span>
                {i < STEP_TITLES.length - 1 && <div className="flex-1 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[280px] py-2">
            {step === 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Pick a batch to allocate</Label>
                <div className="border border-border rounded-lg divide-y divide-border max-h-72 overflow-auto">
                  {unallocatedBatches.filter(b => b.status !== "allocated").map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBatch(b.id)}
                      className={cn(
                        "w-full text-left p-3 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3",
                        selectedBatch === b.id && "bg-primary/5",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{b.batchName}</div>
                        <div className="text-xs text-muted-foreground">{b.source} · {b.product} · {b.uploadDate}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold tabular-nums">{b.count}</div>
                        <div className="text-[10px] text-muted-foreground">leads</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && currentBatch && (
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground">
                  Batch: <span className="font-medium text-foreground">{currentBatch.batchName}</span> · {currentBatch.count} leads
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Allocation mode</Label>
                  <div className="grid gap-2">
                    {(Object.keys(MODE_LABELS) as AllocMode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => { setAllocMode(m); setTargetManager(""); setTargetTeam(""); setTargetAgent(""); }}
                        className={cn(
                          "border border-border rounded-lg px-3 py-2.5 text-left text-sm hover:border-primary/40 transition-colors flex items-center gap-2",
                          allocMode === m && "border-primary bg-primary/5",
                        )}
                      >
                        <div className={cn("h-3.5 w-3.5 rounded-full border", allocMode === m ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                        <span>{MODE_LABELS[m]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {allocMode !== "round_robin" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Manager</Label>
                      <Select value={targetManager} onValueChange={(v) => { setTargetManager(v); setTargetTeam(""); setTargetAgent(""); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {allocMode === "to_agent" && (
                      <>
                        <div>
                          <Label className="text-xs">Team</Label>
                          <Select value={targetTeam} onValueChange={(v) => { setTargetTeam(v); setTargetAgent(""); }} disabled={!targetManager}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{teamsForManager(targetManager).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Agent</Label>
                          <Select value={targetAgent} onValueChange={setTargetAgent} disabled={!targetTeam}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{agentsForTeam(targetTeam).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 2 && currentBatch && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Capacity preview</div>
                    <div className="text-xs text-muted-foreground">{capacityPreview.length} assignees · {currentBatch.count} leads</div>
                  </div>
                  {capacityPreview.some(p => p.current + p.incoming > 200) && (
                    <Badge variant="outline" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> High load</Badge>
                  )}
                </div>
                <div className="border border-border rounded-lg divide-y divide-border max-h-72 overflow-auto">
                  {capacityPreview.map(p => {
                    const total = p.current + p.incoming;
                    const pct = Math.min(100, Math.round((total / 200) * 100));
                    return (
                      <div key={p.id} className="p-3 grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.sub}</div>
                        </div>
                        <div className="col-span-5">
                          <Progress value={pct} className="h-2" />
                          <div className="text-[10px] text-muted-foreground mt-1">{total}/200 capacity</div>
                        </div>
                        <div className="col-span-3 text-right">
                          <div className="text-sm font-semibold tabular-nums">+{p.incoming}</div>
                          <div className="text-[10px] text-muted-foreground">incoming</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && currentBatch && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Confirm allocation</div>
                  <div className="text-base font-semibold">{currentBatch.count} leads from {currentBatch.batchName}</div>
                  <div className="text-sm text-muted-foreground">{MODE_LABELS[allocMode]}</div>
                  <div className="text-xs text-muted-foreground">Distributed across {capacityPreview.length} assignee(s). Action will be logged in audit trail.</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex !justify-between">
            <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowWizard(false)}>Cancel</Button>
              {step < STEP_TITLES.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleConfirm}><Check className="h-4 w-4 mr-1" /> Confirm Allocation</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadAllocationPage;
