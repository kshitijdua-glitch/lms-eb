import { leads, getLeadsForAgent, getLeadsForTeam, getDispositionLabel, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertTriangle, Phone } from "lucide-react";
import { useState } from "react";

function getFollowUpStatus(scheduledAt: string, status: string): { label: string; variant: "destructive" | "default" | "secondary" } {
  if (status === "missed") return { label: "Overdue", variant: "destructive" };
  if (status === "completed") return { label: "Completed", variant: "default" };
  const now = Date.now();
  const scheduled = new Date(scheduledAt).getTime();
  const diff = scheduled - now;
  if (diff < 0) return { label: "Overdue", variant: "destructive" };
  if (diff < 3600000) return { label: "Due Now", variant: "default" };
  return { label: "Upcoming", variant: "secondary" };
}

const FollowUpsPage = () => {
  const { role } = useRole();
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : role === "team_leader" ? getLeadsForTeam("team-1") : leads;

  // Flatten follow-ups with lead info
  const allFollowUps = allLeads.flatMap(l =>
    l.followUps
      .filter(f => f.status !== "completed")
      .map(f => ({
        ...f,
        leadId: l.id,
        leadName: l.name,
        leadMobile: l.mobile,
        priority: l.priority,
        productType: l.productType,
        allocatedAt: l.allocatedAt,
        retryCount: l.retryCount,
        disposition: l.disposition,
      }))
  ).filter(f => {
    if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
    if (productFilter !== "all" && f.productType !== productFilter) return false;
    return true;
  }).sort((a, b) => {
    // Overdue first, then Due Now, then Upcoming
    const aStatus = getFollowUpStatus(a.scheduledAt, a.status);
    const bStatus = getFollowUpStatus(b.scheduledAt, b.status);
    const order = { "Overdue": 0, "Due Now": 1, "Upcoming": 2, "Completed": 3 };
    return (order[aStatus.label] ?? 3) - (order[bStatus.label] ?? 3);
  });

  const overdue = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Overdue");
  const dueNow = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Due Now");
  const upcoming = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Upcoming");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Follow-Ups</h1>
          <p className="text-muted-foreground text-sm">
            {allFollowUps.length} total · <span className="text-destructive">{overdue.length} overdue</span> · <span className="text-warning">{dueNow.length} due now</span> · {upcoming.length} upcoming
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Product" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p => (
                <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Days Since Alloc</TableHead>
                <TableHead>Retry Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFollowUps.map(f => {
                const status = getFollowUpStatus(f.scheduledAt, f.status);
                const daysSinceAlloc = Math.floor((Date.now() - new Date(f.allocatedAt).getTime()) / 86400000);
                return (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${f.leadId}`)}>
                    <TableCell className="text-xs text-muted-foreground">{f.leadId}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {f.leadName}
                      <span className="text-muted-foreground text-xs ml-1">{f.leadMobile}</span>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{f.type.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(f.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.priority === "hot" ? "destructive" : f.priority === "warm" ? "default" : "secondary"} className="text-xs">{f.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{daysSinceAlloc}d</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {f.retryCount > 0 ? (
                        <span>{f.retryCount}/5 retries {f.retryCount >= 5 && <Badge variant="destructive" className="text-[9px] ml-1">TL Review</Badge>}</span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpsPage;
