import { leads, getLeadsForAgent, getDispositionLabel, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";

type FUItem = {
  id: string; scheduledAt: string; type: string; status: string; notes: string;
  leadId: string; leadName: string; leadMobile: string; priority: string;
  productType: string; allocatedAt: string; retryCount: number; disposition: string;
};

function getFollowUpStatus(scheduledAt: string, status: string): { label: string; variant: "destructive" | "default" | "secondary" } {
  if (status === "missed") return { label: "Overdue", variant: "destructive" };
  if (status === "completed") return { label: "Completed", variant: "default" };
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff < 0) return { label: "Overdue", variant: "destructive" };
  if (diff < 3600000) return { label: "Due Now", variant: "default" };
  return { label: "Upcoming", variant: "secondary" };
}

const FollowUpsPage = () => {
  const { role } = useRole();
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : leads;

  const allFollowUps = useMemo(() => {
    return allLeads.flatMap(l =>
      l.followUps.filter(f => f.status !== "completed").map(f => ({
        ...f, leadId: l.id, leadName: l.name, leadMobile: l.mobile,
        priority: l.priority, productType: l.productType, allocatedAt: l.allocatedAt,
        retryCount: l.retryCount, disposition: l.disposition,
      }))
    ).filter(f => {
      if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
      if (productFilter !== "all" && f.productType !== productFilter) return false;
      return true;
    }).sort((a, b) => {
      const order = { "Overdue": 0, "Due Now": 1, "Upcoming": 2, "Completed": 3 };
      return (order[getFollowUpStatus(a.scheduledAt, a.status).label as keyof typeof order] ?? 3) - (order[getFollowUpStatus(b.scheduledAt, b.status).label as keyof typeof order] ?? 3);
    });
  }, [allLeads, priorityFilter, productFilter]);

  const overdue = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Overdue");
  const dueNow = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Due Now");
  const upcoming = allFollowUps.filter(f => getFollowUpStatus(f.scheduledAt, f.status).label === "Upcoming");

  const columns: ColumnDef<FUItem>[] = [
    { id: "leadId", label: "Lead ID", render: (f) => <span className="text-xs text-muted-foreground">{f.leadId}</span> },
    { id: "name", label: "Name", render: (f) => (
      <span className="font-medium text-sm">{f.leadName}<span className="text-muted-foreground text-xs ml-1">{f.leadMobile}</span></span>
    )},
    { id: "type", label: "Type", render: (f) => <span className="text-sm capitalize">{f.type.replace(/_/g, " ")}</span> },
    { id: "scheduled", label: "Scheduled Time", render: (f) => <span className="text-sm text-muted-foreground">{new Date(f.scheduledAt).toLocaleString()}</span> },
    { id: "status", label: "Status", render: (f) => { const s = getFollowUpStatus(f.scheduledAt, f.status); return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>; }},
    { id: "priority", label: "Priority", render: (f) => <Badge variant={f.priority === "hot" ? "destructive" : f.priority === "warm" ? "default" : "secondary"} className="text-xs">{f.priority}</Badge> },
    { id: "daysSinceAlloc", label: "Days Since Alloc", render: (f) => <span className="text-sm">{Math.floor((Date.now() - new Date(f.allocatedAt).getTime()) / 86400000)}d</span> },
    { id: "retry", label: "Retry Info", render: (f) => (
      <span className="text-xs text-muted-foreground">
        {f.retryCount > 0 ? <span>{f.retryCount}/5 retries {f.retryCount >= 5 && <Badge variant="destructive" className="text-[9px] ml-1">Manager Review</Badge>}</span> : "—"}
      </span>
    )},
    { id: "disposition", label: "Disposition", defaultVisible: false, render: (f) => <span className="text-xs">{getDispositionLabel(f.disposition as any)}</span> },
    { id: "product", label: "Product", defaultVisible: false, render: (f) => <Badge variant="outline" className="text-xs">{getProductLabel(f.productType as any)}</Badge> },
  ];

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
          <ConfigurableTable
            tableId="follow-ups"
            columns={columns}
            data={allFollowUps}
            onRowClick={(f) => navigate(`/leads/${f.leadId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpsPage;
