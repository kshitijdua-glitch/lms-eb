import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { leads, getLeadsForAgent, getDispositionLabel, getStageLabel, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Download, Users, CheckCircle2, Clock4, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import type { Lead } from "@/types/lms";

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

  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadMobile, setNewLeadMobile] = useState("");
  const [newLeadProduct, setNewLeadProduct] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("");
  const [newLeadCity, setNewLeadCity] = useState("");
  const [newLeadIncome, setNewLeadIncome] = useState("");
  const [newLeadLoanAmt, setNewLeadLoanAmt] = useState("");
  const [newLeadNotes, setNewLeadNotes] = useState("");

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : leads;

  const today = new Date().toISOString().split("T")[0];
  const workedToday = allLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
  const neverContacted = allLeads.filter(l => l.callLogs.length === 0).length;
  const pendingFollowUps = allLeads.filter(l => l.followUps.some(f => f.status === "pending")).length;

  const filtered = useMemo(() => {
    return allLeads.filter(l => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.id.includes(search)) return false;
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (productFilter !== "all" && l.productType !== productFilter) return false;
      if (sourceFilter !== "all" && l.leadSource !== sourceFilter) return false;
      if (followUpFilter === "has_pending" && !l.followUps.some(f => f.status === "pending")) return false;
      if (followUpFilter === "has_missed" && !l.followUps.some(f => f.status === "missed")) return false;
      if (followUpFilter === "none" && l.followUps.length > 0) return false;
      return true;
    });
  }, [allLeads, search, stageFilter, productFilter, sourceFilter, followUpFilter]);

  const handleCreateLead = () => {
    if (!newLeadName || !newLeadMobile || !newLeadSource) {
      toast.error("Name, Mobile, and Lead Source are required");
      return;
    }
    const existing = allLeads.find(l => l.mobile.endsWith(newLeadMobile.slice(-4)));
    if (existing) {
      toast.warning(`Possible duplicate: ${existing.name} has similar mobile number`);
    }
    setShowCreateLead(false);
    toast.success("Lead created and assigned to you");
    toast.info("DND check: Number is clean ✓", { duration: 3000 });
    setNewLeadName(""); setNewLeadMobile(""); setNewLeadProduct(""); setNewLeadSource("");
    setNewLeadCity(""); setNewLeadIncome(""); setNewLeadLoanAmt(""); setNewLeadNotes("");
  };

  const sources = [...new Set(allLeads.map(l => l.leadSource))];

  const summaryTiles = [
    { label: "Total Leads", value: allLeads.length, icon: Users, tone: "text-muted-foreground" },
    { label: "Worked Today", value: workedToday, icon: CheckCircle2, tone: "text-success" },
    { label: "Pending Follow-ups", value: pendingFollowUps, icon: Clock4, tone: "text-primary" },
    { label: "Never Contacted", value: neverContacted, icon: AlertCircle, tone: "text-warning" },
  ];

  const columns: ColumnDef<Lead>[] = [
    { id: "name", label: "Name", render: (lead) => (
      <div className="flex items-center gap-2 py-1">
        <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">
          {lead.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm leading-tight">{lead.name}</span>
          <span className="text-[11px] text-muted-foreground">{lead.id}</span>
        </div>
        {lead.dndStatus === "dnd_registered" && <Badge variant="destructive" className="text-[9px] ml-1 px-1">DND</Badge>}
      </div>
    )},
    { id: "mobile", label: "Mobile", render: (lead) => <span className="text-muted-foreground text-sm tabular-nums">{lead.mobile}</span> },
    ...(role !== "agent" ? [{ id: "source", label: "Source", render: (lead: Lead) => <span className="text-xs text-muted-foreground">{lead.leadSource}</span> } as ColumnDef<Lead>] : []),
    { id: "product", label: "Product", render: (lead) => <Badge variant="outline" className="text-xs font-normal">{getProductLabel(lead.productType)}</Badge> },
    { id: "stage", label: "Stage", render: (lead) => <Badge variant={stageBadgeVariant(lead.stage) as any} className="text-xs font-normal">{getStageLabel(lead.stage)}</Badge> },
    { id: "disposition", label: "Last Disposition", render: (lead) => <span className="text-sm">{getDispositionLabel(lead.disposition)}</span> },
    { id: "followUp", label: "Follow-Up", render: (lead) => {
      const hasMissed = lead.followUps.some(f => f.status === "missed");
      const nextFU = lead.followUps.find(f => f.status === "pending");
      return hasMissed ? <Badge variant="destructive" className="text-[10px]">Missed</Badge>
        : nextFU ? <span className="text-xs text-muted-foreground">{new Date(nextFU.scheduledAt).toLocaleDateString()}</span>
        : <span className="text-xs text-muted-foreground">—</span>;
    }},
    { id: "lastActivity", label: "Last Activity", render: (lead) => <span className="text-sm text-muted-foreground">{new Date(lead.lastActivityAt).toLocaleDateString()}</span> },
    { id: "days", label: "Aging", headerClassName: "text-right", render: (lead) => {
      const days = Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / 86400000);
      return <span className={`text-right text-sm font-medium ${agingColor(days)}`}>{days}d</span>;
    }},
    { id: "city", label: "City", defaultVisible: false, render: (lead) => <span className="text-xs">{lead.city}</span> },
    { id: "income", label: "Income", defaultVisible: false, render: (lead) => <span className="text-xs">₹{lead.monthlyIncome.toLocaleString()}</span> },
    { id: "loanAmount", label: "Loan Amt", defaultVisible: false, render: (lead) => <span className="text-xs">₹{lead.loanAmount.toLocaleString()}</span> },
    { id: "creditScore", label: "Credit Score", defaultVisible: false, render: (lead) => <span className="text-xs">{lead.creditScore || "—"}</span> },
    { id: "priority", label: "Priority", defaultVisible: false, render: (lead) => <Badge variant={lead.priority === "hot" ? "destructive" : lead.priority === "warm" ? "default" : "secondary"} className="text-xs">{lead.priority}</Badge> },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{role === "agent" ? "My Leads" : "All Leads"}</h1>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of {allLeads.length} leads
          </p>
        </div>
        <div className="flex gap-2">
          {role === "agent" && (
            <Button size="sm" onClick={() => setShowCreateLead(true)} className="h-9">
              <Plus className="h-4 w-4 mr-1.5" /> New Lead
            </Button>
          )}
          {role !== "agent" && (
            <Button variant="outline" size="sm" className="h-9" onClick={() => toast.success("Team summary CSV exported (non-PII)")}>
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryTiles.map(t => {
          const Icon = t.icon;
          return (
            <Card key={t.label} className="shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t.label}
                  </span>
                  <Icon className={`h-4 w-4 ${t.tone}`} />
                </div>
                <div className="text-2xl font-semibold tracking-tight leading-none">{t.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stage tabs */}
      <Tabs value={stageFilter} onValueChange={setStageFilter} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap gap-1.5 bg-transparent p-0">
          {["all","new","contacted","interested","bank_selected","stb_submitted","approved","declined","disbursed","closed_lost"].map(s => {
            const count = s === "all" ? allLeads.length : allLeads.filter(l => l.stage === s).length;
            return (
              <TabsTrigger
                key={s}
                value={s}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-card data-[state=inactive]:border data-[state=inactive]:border-border text-xs px-3.5 py-2 rounded-md"
              >
                {s === "all" ? "All" : getStageLabel(s as any)}
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0 h-4 bg-background/20">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Filter bar inside its own card for breathing room */}
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or lead ID..."
                className="pl-9 h-10 bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-44 h-10"><SelectValue placeholder="Product" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p => (
                  <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {role !== "agent" && (
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40 h-10"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
              <SelectTrigger className="w-44 h-10"><SelectValue placeholder="Follow-Up" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Follow-Ups</SelectItem>
                <SelectItem value="has_pending">Has Pending F/U</SelectItem>
                <SelectItem value="has_missed">Has Missed F/U</SelectItem>
                <SelectItem value="none">No Follow-Ups</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads table */}
      <Card className="shadow-none overflow-hidden">
        <CardContent className="p-0">
          <ConfigurableTable
            tableId="leads"
            columns={columns}
            data={filtered.slice(0, 30)}
            onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
          />
        </CardContent>
      </Card>

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
