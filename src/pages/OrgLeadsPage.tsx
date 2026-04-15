import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { leads, agents, teams, getDispositionLabel, getStageLabel, getProductLabel } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Shuffle, Download } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import type { Lead } from "@/types/lms";

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", teams: ["team-1"] },
  { id: "mgr-2", name: "Anjali Kapoor", teams: ["team-2"] },
];

function stageBadgeVariant(stage: string) {
  if (stage === "disbursed" || stage === "approved") return "default" as const;
  if (stage === "declined" || stage === "closed_lost") return "destructive" as const;
  return "secondary" as const;
}

const OrgLeadsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [managerFilter, setManagerFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showReassign, setShowReassign] = useState(false);
  const [reassignManager, setReassignManager] = useState("");
  const [reassignAgent, setReassignAgent] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const sources = [...new Set(leads.map(l => l.leadSource))];

  const availableAgents = useMemo(() => {
    if (managerFilter !== "all") {
      const mgr = managers.find(m => m.id === managerFilter);
      return mgr ? agents.filter(a => mgr.teams.includes(a.teamId)) : [];
    }
    return agents;
  }, [managerFilter]);

  const reassignAgents = useMemo(() => {
    if (!reassignManager) return agents;
    const mgr = managers.find(m => m.id === reassignManager);
    return mgr ? agents.filter(a => mgr.teams.includes(a.teamId)) : [];
  }, [reassignManager]);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.id.includes(search)) return false;
      if (managerFilter !== "all") {
        const mgr = managers.find(m => m.id === managerFilter);
        if (!mgr || !mgr.teams.includes(l.assignedTeamId)) return false;
      }
      if (agentFilter !== "all" && l.assignedAgentId !== agentFilter) return false;
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (productFilter !== "all" && l.productType !== productFilter) return false;
      if (sourceFilter !== "all" && l.leadSource !== sourceFilter) return false;
      if (followUpFilter === "has_pending" && !l.followUps.some(f => f.status === "pending")) return false;
      if (followUpFilter === "has_missed" && !l.followUps.some(f => f.status === "missed")) return false;
      return true;
    });
  }, [search, managerFilter, agentFilter, stageFilter, productFilter, sourceFilter, followUpFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(l => l.id)));
  };

  const handleBulkReassign = () => {
    if (!reassignAgent) { toast.error("Select target agent"); return; }
    toast.success(`${selectedIds.size} leads reassigned to ${agents.find(a => a.id === reassignAgent)?.name}`);
    setShowReassign(false); setSelectedIds(new Set());
    setReassignManager(""); setReassignAgent(""); setReassignReason("");
  };

  const getManagerForTeam = (teamId: string) => managers.find(m => m.teams.includes(teamId))?.name || "—";

  const columns: ColumnDef<Lead>[] = [
    { id: "checkbox", label: "", locked: "start", headerClassName: "w-10", render: (lead) => (
      <div onClick={e => e.stopPropagation()}>
        <Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
      </div>
    )},
    { id: "name", label: "Name", render: (lead) => (
      <span className="font-medium">
        {lead.name}
        {lead.dndStatus === "dnd_registered" && <Badge variant="destructive" className="text-[9px] ml-1 px-1">DND</Badge>}
      </span>
    )},
    { id: "manager", label: "Manager", render: (lead) => <span className="text-xs text-muted-foreground">{getManagerForTeam(lead.assignedTeamId)}</span> },
    { id: "agent", label: "Agent", render: (lead) => <span className="text-xs text-muted-foreground">{agents.find(a => a.id === lead.assignedAgentId)?.name || "—"}</span> },
    { id: "team", label: "Team", render: (lead) => <span className="text-xs text-muted-foreground">{teams.find(t => t.id === lead.assignedTeamId)?.name || "—"}</span> },
    { id: "source", label: "Source", render: (lead) => <span className="text-xs text-muted-foreground">{lead.leadSource}</span> },
    { id: "product", label: "Product", render: (lead) => <Badge variant="outline" className="text-xs">{getProductLabel(lead.productType)}</Badge> },
    { id: "stage", label: "Stage", render: (lead) => <Badge variant={stageBadgeVariant(lead.stage)} className="text-xs">{getStageLabel(lead.stage)}</Badge> },
    { id: "disposition", label: "Disposition", render: (lead) => <span className="text-sm">{getDispositionLabel(lead.disposition)}</span> },
    { id: "followUp", label: "Follow-Up", render: (lead) => {
      const hasMissed = lead.followUps.some(f => f.status === "missed");
      const nextFU = lead.followUps.find(f => f.status === "pending");
      return hasMissed ? <Badge variant="destructive" className="text-[10px]">Missed</Badge>
        : nextFU ? <span className="text-xs text-muted-foreground">{new Date(nextFU.scheduledAt).toLocaleDateString()}</span>
        : <span className="text-xs text-muted-foreground">—</span>;
    }},
    { id: "days", label: "Days", headerClassName: "text-right", render: (lead) => {
      const d = Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / 86400000);
      return <span className={`text-right text-sm font-medium ${d <= 3 ? "text-success" : d <= 7 ? "text-warning" : "text-destructive"}`}>{d}d</span>;
    }},
    { id: "city", label: "City", defaultVisible: false, render: (lead) => <span className="text-xs">{lead.city}</span> },
    { id: "income", label: "Income", defaultVisible: false, render: (lead) => <span className="text-xs">₹{lead.monthlyIncome.toLocaleString()}</span> },
    { id: "priority", label: "Priority", defaultVisible: false, render: (lead) => <Badge variant={lead.priority === "hot" ? "destructive" : lead.priority === "warm" ? "default" : "secondary"} className="text-xs">{lead.priority}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisation Leads</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} of {leads.length} leads</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button size="sm" onClick={() => setShowReassign(true)}>
              <Shuffle className="h-4 w-4 mr-1" /> Reassign ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => toast.success("CSV exported")}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <Tabs value={stageFilter} onValueChange={setStageFilter} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap gap-1 bg-transparent p-0">
          {["all","new","contacted","interested","bank_selected","stb_submitted","approved","declined","disbursed","closed_lost"].map(s => {
            const count = s === "all" ? leads.length : leads.filter(l => l.stage === s).length;
            return (
              <TabsTrigger key={s} value={s} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5">
                {s === "all" ? "All" : getStageLabel(s as any)} <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p =>
              <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Follow-Up" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="has_pending">Has Pending F/U</SelectItem>
            <SelectItem value="has_missed">Has Missed F/U</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <ConfigurableTable tableId="org-leads" columns={columns} data={filtered.slice(0, 50)} onRowClick={(lead) => navigate(`/leads/${lead.id}`)} />
        </CardContent>
      </Card>

      <Dialog open={showReassign} onOpenChange={setShowReassign}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reassign {selectedIds.size} Lead(s) — Org Wide</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Manager (optional)</Label>
              <Select value={reassignManager} onValueChange={v => { setReassignManager(v); setReassignAgent(""); }}>
                <SelectTrigger><SelectValue placeholder="Select Manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign to Agent *</Label>
              <Select value={reassignAgent} onValueChange={setReassignAgent}>
                <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  {reassignAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea placeholder="Reason..." value={reassignReason} onChange={e => setReassignReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassign(false)}>Cancel</Button>
            <Button onClick={handleBulkReassign}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgLeadsPage;
