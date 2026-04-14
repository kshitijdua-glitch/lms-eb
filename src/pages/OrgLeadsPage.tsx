import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { leads, agents, teams, getDispositionLabel, getStageLabel, getProductLabel } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowUpDown, Shuffle, Download } from "lucide-react";
import { toast } from "sonner";

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
  const [tlFilter, setTlFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [sortField, setSortField] = useState("lastActivity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showReassign, setShowReassign] = useState(false);
  const [reassignManager, setReassignManager] = useState("");
  const [reassignTL, setReassignTL] = useState("");
  const [reassignAgent, setReassignAgent] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const sources = [...new Set(leads.map(l => l.leadSource))];

  // Cascading filters
  const availableTeams = useMemo(() => {
    if (managerFilter === "all") return teams;
    const mgr = managers.find(m => m.id === managerFilter);
    return mgr ? teams.filter(t => mgr.teams.includes(t.id)) : [];
  }, [managerFilter]);

  const availableAgents = useMemo(() => {
    if (tlFilter !== "all") {
      const team = teams.find(t => t.tlId === tlFilter);
      return team ? agents.filter(a => a.teamId === team.id && a.id !== team.tlId) : [];
    }
    if (managerFilter !== "all") {
      const mgr = managers.find(m => m.id === managerFilter);
      return mgr ? agents.filter(a => mgr.teams.includes(a.teamId) && !teams.some(t => t.tlId === a.id)) : [];
    }
    return agents.filter(a => a.tlId);
  }, [managerFilter, tlFilter]);

  // Reassign cascading
  const reassignTeams = useMemo(() => {
    if (!reassignManager) return teams;
    const mgr = managers.find(m => m.id === reassignManager);
    return mgr ? teams.filter(t => mgr.teams.includes(t.id)) : [];
  }, [reassignManager]);

  const reassignAgents = useMemo(() => {
    if (!reassignTL) return [];
    const team = teams.find(t => t.tlId === reassignTL);
    return team ? agents.filter(a => a.teamId === team.id && a.id !== team.tlId) : [];
  }, [reassignTL]);

  const filtered = useMemo(() => {
    let result = leads.filter(l => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.id.includes(search)) return false;
      if (managerFilter !== "all") {
        const mgr = managers.find(m => m.id === managerFilter);
        if (!mgr || !mgr.teams.includes(l.assignedTeamId)) return false;
      }
      if (tlFilter !== "all") {
        const team = teams.find(t => t.tlId === tlFilter);
        if (!team || l.assignedTeamId !== team.id) return false;
      }
      if (agentFilter !== "all" && l.assignedAgentId !== agentFilter) return false;
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (productFilter !== "all" && l.productType !== productFilter) return false;
      if (sourceFilter !== "all" && l.leadSource !== sourceFilter) return false;
      if (followUpFilter === "has_pending" && !l.followUps.some(f => f.status === "pending")) return false;
      if (followUpFilter === "has_missed" && !l.followUps.some(f => f.status === "missed")) return false;
      return true;
    });
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "stage") cmp = a.stage.localeCompare(b.stage);
      else cmp = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [leads, search, managerFilter, tlFilter, agentFilter, stageFilter, productFilter, sourceFilter, followUpFilter, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

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
    const stbLocked = [...selectedIds].filter(id => leads.find(l => l.id === id)?.stbSubmissions.length);
    if (stbLocked.length > 0) {
      toast.error(`${stbLocked.length} leads have active STB and cannot be reassigned`);
      return;
    }
    toast.success(`${selectedIds.size} leads reassigned to ${agents.find(a => a.id === reassignAgent)?.name}`);
    setShowReassign(false); setSelectedIds(new Set());
    setReassignManager(""); setReassignTL(""); setReassignAgent(""); setReassignReason("");
  };

  const getManagerForTeam = (teamId: string) => managers.find(m => m.teams.includes(teamId))?.name || "—";

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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={managerFilter} onValueChange={v => { setManagerFilter(v); setTlFilter("all"); setAgentFilter("all"); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Manager" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tlFilter} onValueChange={v => { setTlFilter(v); setAgentFilter("all"); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="TL" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All TLs</SelectItem>
            {availableTeams.map(t => <SelectItem key={t.tlId} value={t.tlId}>{t.tlName}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {availableAgents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {["new","contacted","interested","bre_done","stb_submitted","approved","declined","disbursed","closed_lost"].map(s =>
              <SelectItem key={s} value={s}>{getStageLabel(s as any)}</SelectItem>
            )}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>Name <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>TL</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("stage")}>Stage <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead>Follow-Up</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => toggleSort("days")}>Days <ArrowUpDown className="inline h-3 w-3" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map(lead => {
                const daysSince = Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / 86400000);
                const agent = agents.find(a => a.id === lead.assignedAgentId);
                const team = teams.find(t => t.id === lead.assignedTeamId);
                const nextFU = lead.followUps.find(f => f.status === "pending");
                const hasMissed = lead.followUps.some(f => f.status === "missed");
                return (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-accent/50">
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => navigate(`/leads/${lead.id}`)}>
                      {lead.name}
                      {lead.dndStatus === "dnd_registered" && <Badge variant="destructive" className="text-[9px] ml-1 px-1">DND</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{getManagerForTeam(lead.assignedTeamId)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{team?.tlName || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{agent?.name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.leadSource}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getProductLabel(lead.productType)}</Badge></TableCell>
                    <TableCell onClick={() => navigate(`/leads/${lead.id}`)}><Badge variant={stageBadgeVariant(lead.stage)} className="text-xs">{getStageLabel(lead.stage)}</Badge></TableCell>
                    <TableCell className="text-sm" onClick={() => navigate(`/leads/${lead.id}`)}>{getDispositionLabel(lead.disposition)}</TableCell>
                    <TableCell onClick={() => navigate(`/leads/${lead.id}`)}>
                      {hasMissed ? <Badge variant="destructive" className="text-[10px]">Missed</Badge>
                        : nextFU ? <span className="text-xs text-muted-foreground">{new Date(nextFU.scheduledAt).toLocaleDateString()}</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${daysSince <= 3 ? "text-success" : daysSince <= 7 ? "text-warning" : "text-destructive"}`} onClick={() => navigate(`/leads/${lead.id}`)}>{daysSince}d</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Org-wide Reassign Dialog */}
      <Dialog open={showReassign} onOpenChange={setShowReassign}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reassign {selectedIds.size} Lead(s) — Org Wide</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Manager (optional)</Label>
              <Select value={reassignManager} onValueChange={v => { setReassignManager(v); setReassignTL(""); setReassignAgent(""); }}>
                <SelectTrigger><SelectValue placeholder="Select Manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target TL / Team *</Label>
              <Select value={reassignTL} onValueChange={v => { setReassignTL(v); setReassignAgent(""); }}>
                <SelectTrigger><SelectValue placeholder="Select TL" /></SelectTrigger>
                <SelectContent>
                  {reassignTeams.map(t => <SelectItem key={t.tlId} value={t.tlId}>{t.tlName} ({t.name})</SelectItem>)}
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
