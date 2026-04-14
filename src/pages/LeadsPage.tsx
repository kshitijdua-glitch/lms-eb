import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { leads, getLeadsForAgent, getLeadsForTeam, getDispositionLabel, getStageLabel, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Download, ArrowUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function stageBadgeVariant(stage: string) {
  if (stage === "disbursed") return "default";
  if (stage === "approved") return "default";
  if (stage === "declined" || stage === "closed_lost") return "destructive";
  return "secondary";
}

function agingColor(days: number) {
  if (days <= 3) return "text-success";
  if (days <= 7) return "text-warning";
  return "text-destructive";
}

const LeadsPage = () => {
  const { role } = useRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [showCreateLead, setShowCreateLead] = useState(searchParams.get("create") === "true");
  const [sortField, setSortField] = useState<string>("lastActivity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // New lead form state
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadMobile, setNewLeadMobile] = useState("");
  const [newLeadProduct, setNewLeadProduct] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("");
  const [newLeadCity, setNewLeadCity] = useState("");
  const [newLeadIncome, setNewLeadIncome] = useState("");
  const [newLeadLoanAmt, setNewLeadLoanAmt] = useState("");
  const [newLeadNotes, setNewLeadNotes] = useState("");

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1")
    : role === "team_leader" ? getLeadsForTeam("team-1")
    : leads;

  const today = new Date().toISOString().split("T")[0];
  const workedToday = allLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
  const neverContacted = allLeads.filter(l => l.callLogs.length === 0).length;

  const filtered = useMemo(() => {
    let result = allLeads.filter(l => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.id.includes(search)) return false;
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (productFilter !== "all" && l.productType !== productFilter) return false;
      if (sourceFilter !== "all" && l.leadSource !== sourceFilter) return false;
      if (followUpFilter === "has_pending" && !l.followUps.some(f => f.status === "pending")) return false;
      if (followUpFilter === "has_missed" && !l.followUps.some(f => f.status === "missed")) return false;
      if (followUpFilter === "none" && l.followUps.length > 0) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "stage") cmp = a.stage.localeCompare(b.stage);
      else if (sortField === "days") cmp = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      else cmp = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [allLeads, search, stageFilter, productFilter, sourceFilter, followUpFilter, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleCreateLead = () => {
    if (!newLeadName || !newLeadMobile || !newLeadSource) {
      toast.error("Name, Mobile, and Lead Source are required");
      return;
    }
    // Duplicate check
    const existing = allLeads.find(l => l.mobile.endsWith(newLeadMobile.slice(-4)));
    if (existing) {
      toast.warning(`Possible duplicate: ${existing.name} has similar mobile number`);
    }
    setShowCreateLead(false);
    toast.success("Lead created and assigned to you");
    toast.info("DND check: Number is clean ✓", { duration: 3000 });
    // Reset form
    setNewLeadName(""); setNewLeadMobile(""); setNewLeadProduct(""); setNewLeadSource("");
    setNewLeadCity(""); setNewLeadIncome(""); setNewLeadLoanAmt(""); setNewLeadNotes("");
  };

  const sources = [...new Set(allLeads.map(l => l.leadSource))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{role === "agent" ? "My Leads" : "All Leads"}</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} leads</p>
        </div>
        <div className="flex gap-2">
          {role === "agent" && (
            <Button size="sm" onClick={() => setShowCreateLead(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Lead
            </Button>
          )}
          {role !== "agent" && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-bold">{allLeads.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Worked Today:</span>
          <span className="font-bold text-success">{workedToday}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Never Contacted:</span>
          <span className="font-bold text-warning">{neverContacted}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {["new","contacted","interested","bre_done","stb_submitted","approved","declined","disbursed","closed_lost"].map(s => (
              <SelectItem key={s} value={s}>{getStageLabel(s as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p => (
              <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Follow-Up" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="has_pending">Has Pending F/U</SelectItem>
            <SelectItem value="has_missed">Has Missed F/U</SelectItem>
            <SelectItem value="none">No Follow-Ups</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("stage")}>
                  Stage <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead>Last Disposition</TableHead>
                <TableHead>Follow-Up</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => toggleSort("days")}>
                  Days <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 30).map(lead => {
                const daysSinceActivity = Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / 86400000);
                const nextFU = lead.followUps.find(f => f.status === "pending");
                const hasMissed = lead.followUps.some(f => f.status === "missed");
                return (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <TableCell className="font-medium">
                      {lead.name}
                      {lead.dndStatus === "dnd_registered" && <Badge variant="destructive" className="text-[9px] ml-1 px-1">DND</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.mobile}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.leadSource}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getProductLabel(lead.productType)}</Badge></TableCell>
                    <TableCell><Badge variant={stageBadgeVariant(lead.stage)} className="text-xs">{getStageLabel(lead.stage)}</Badge></TableCell>
                    <TableCell className="text-sm">{getDispositionLabel(lead.disposition)}</TableCell>
                    <TableCell>
                      {hasMissed ? (
                        <Badge variant="destructive" className="text-[10px]">Missed</Badge>
                      ) : nextFU ? (
                        <span className="text-xs text-muted-foreground">{new Date(nextFU.scheduledAt).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(lead.lastActivityAt).toLocaleDateString()}</TableCell>
                    <TableCell className={`text-right text-sm font-medium ${agingColor(daysSinceActivity)}`}>{daysSinceActivity}d</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enhanced Create Lead Dialog */}
      <Dialog open={showCreateLead} onOpenChange={setShowCreateLead}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Lead</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Full Name *</Label><Input placeholder="Customer name" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} /></div>
              <div><Label>Mobile Number *</Label><Input placeholder="10-digit mobile" value={newLeadMobile} onChange={e => setNewLeadMobile(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Source *</Label>
                <Select value={newLeadSource} onValueChange={setNewLeadSource}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {["Website","Google Ads","Facebook","Referral","Partner","Walk-in","IVR","WhatsApp"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product Type</Label>
                <Select value={newLeadProduct} onValueChange={setNewLeadProduct}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p => (
                      <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>City</Label><Input placeholder="City" value={newLeadCity} onChange={e => setNewLeadCity(e.target.value)} /></div>
              <div><Label>Monthly Income (₹)</Label><Input type="number" placeholder="50000" value={newLeadIncome} onChange={e => setNewLeadIncome(e.target.value)} /></div>
              <div><Label>Loan Amount (₹)</Label><Input type="number" placeholder="500000" value={newLeadLoanAmt} onChange={e => setNewLeadLoanAmt(e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea placeholder="Any initial notes..." value={newLeadNotes} onChange={e => setNewLeadNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLead(false)}>Cancel</Button>
            <Button onClick={handleCreateLead}>Create Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsPage;
