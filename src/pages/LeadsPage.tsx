import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { leads, getLeadsForAgent, getLeadsForTeam, getDispositionLabel, getStageLabel, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [showCreateLead, setShowCreateLead] = useState(false);

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1")
    : role === "team_leader" ? getLeadsForTeam("team-1")
    : leads;

  const filtered = allLeads.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.id.includes(search)) return false;
    if (stageFilter !== "all" && l.stage !== stageFilter) return false;
    if (productFilter !== "all" && l.productType !== productFilter) return false;
    return true;
  });

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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {["new","contacted","interested","bre_done","stb_submitted","approved","declined","disbursed","closed_lost"].map(s => (
              <SelectItem key={s} value={s}>{getStageLabel(s as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p => (
              <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Last Disposition</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 30).map(lead => {
                const daysSinceAlloc = Math.floor((Date.now() - new Date(lead.allocatedAt).getTime()) / 86400000);
                const daysSinceActivity = Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / 86400000);
                return (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.mobile}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getProductLabel(lead.productType)}</Badge></TableCell>
                    <TableCell><Badge variant={stageBadgeVariant(lead.stage)} className="text-xs">{getStageLabel(lead.stage)}</Badge></TableCell>
                    <TableCell className="text-sm">{getDispositionLabel(lead.disposition)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(lead.lastActivityAt).toLocaleDateString()}</TableCell>
                    <TableCell className={`text-right text-sm font-medium ${agingColor(daysSinceActivity)}`}>{daysSinceActivity}d</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCreateLead} onOpenChange={setShowCreateLead}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input placeholder="Customer name" /></div>
            <div><Label>Mobile Number</Label><Input placeholder="10-digit mobile" /></div>
            <div>
              <Label>Product Type</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p => (
                    <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLead(false)}>Cancel</Button>
            <Button onClick={() => { setShowCreateLead(false); toast.success("Lead created and assigned to you"); }}>Create Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsPage;
