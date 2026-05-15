import { leads, agents, teams, getProductLabel } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", teams: ["team-1"] },
  { id: "mgr-2", name: "Anjali Kapoor", teams: ["team-2"] },
];

type OSTBItem = {
  id: string; partnerId: string; partnerName: string; submittedAt: string;
  status: "submitted" | "documents_pending" | "under_review" | "approved" | "declined" | "disbursed" | "cancelled" | "expired";
  sanctionAmount: number | null; disbursedAmount: number | null;
  disbursementDate: string | null; integrationType: "api" | "portal" | "email";
  leadName: string; leadId: string; product: string;
  assignedAgentId: string; assignedTeamId: string;
  approvedAmount: number | null; remarks: string;
};

const OrgSTBPage = () => {
  const navigate = useNavigate();
  const [managerFilter, setManagerFilter] = useState("all");

  const stbLeads = leads.filter(l => l.stbSubmissions.length > 0);
  const allSubs = useMemo(() => {
    return stbLeads.flatMap(l => l.stbSubmissions.map(s => ({
      ...s, leadName: l.name, leadId: l.id, product: l.productType,
      assignedAgentId: l.assignedAgentId, assignedTeamId: l.assignedTeamId,
    }))).filter(s => {
      if (managerFilter !== "all") {
        const mgr = managers.find(m => m.id === managerFilter);
        if (!mgr || !mgr.teams.includes(s.assignedTeamId)) return false;
      }
      return true;
    });
  }, [stbLeads, managerFilter]);

  const submitted = allSubs.filter(s => s.status === "submitted").length;
  const approved = allSubs.filter(s => s.status === "approved").length;
  const disbursed = allSubs.filter(s => s.status === "disbursed").length;
  const declined = allSubs.filter(s => s.status === "declined").length;
  const getManagerForTeam = (teamId: string) => managers.find(m => m.teams.includes(teamId))?.name || "—";

  const columns: ColumnDef<OSTBItem>[] = [
    { id: "lead", label: "Lead", render: (s) => <span className="font-medium text-sm">{s.leadName}</span> },
    { id: "manager", label: "Manager", render: (s) => <span className="text-xs text-muted-foreground">{getManagerForTeam(s.assignedTeamId)}</span> },
    { id: "agent", label: "Agent", render: (s) => <span className="text-xs text-muted-foreground">{agents.find(a => a.id === s.assignedAgentId)?.name}</span> },
    { id: "team", label: "Team", render: (s) => <span className="text-xs text-muted-foreground">{teams.find(t => t.id === s.assignedTeamId)?.name || "—"}</span> },
    { id: "product", label: "Product", render: (s) => <Badge variant="outline" className="text-xs">{getProductLabel(s.product as any)}</Badge> },
    { id: "partner", label: "Partner", render: (s) => <span className="text-sm">{s.partnerName}</span> },
    { id: "submitted", label: "Submitted", render: (s) => <span className="text-sm text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</span> },
    { id: "days", label: "Days", render: (s) => <span className="text-sm">{Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / 86400000)}d</span> },
    { id: "status", label: "Status", render: (s) => (
      <Badge variant={s.status === "disbursed" ? "default" : s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-xs">{s.status}</Badge>
    )},
    { id: "sanction", label: "Sanction", render: (s) => <span className="text-sm">{s.sanctionAmount ? `₹${s.sanctionAmount.toLocaleString()}` : "—"}</span> },
    { id: "disbursedAmt", label: "Disbursed", render: (s) => <span className="text-sm">{s.disbursedAmount ? `₹${s.disbursedAmount.toLocaleString()}` : "—"}</span> },
    { id: "update", label: "Update", locked: "end", render: (s) => {
      const isNonApi = s.integrationType !== "api";
      return (
        <div onClick={e => e.stopPropagation()}>
          {isNonApi && s.status !== "disbursed" ? (
            <Select onValueChange={(v) => toast.success(`Status updated to ${v}`)}>
              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Update" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
              </SelectContent>
            </Select>
          ) : <span className="text-xs text-muted-foreground">{s.integrationType === "api" ? "Auto" : "—"}</span>}
        </div>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Organisation Send to Lending Partner</h1>
          <p className="text-muted-foreground text-sm">{allSubs.length} total submissions</p>
        </div>
        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Manager" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Submitted", value: submitted, icon: Send, color: "text-info" },
          { label: "Approved", value: approved, icon: CheckCircle, color: "text-success" },
          { label: "Disbursed", value: disbursed, icon: CheckCircle, color: "text-success" },
          { label: "Declined", value: declined, icon: XCircle, color: "text-destructive" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <k.icon className={`h-4 w-4 ${k.color} mb-1`} />
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Organisation SLP Submissions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ConfigurableTable tableId="org-stb" columns={columns} data={allSubs} onRowClick={(s) => navigate(`/leads/${s.leadId}`)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgSTBPage;
