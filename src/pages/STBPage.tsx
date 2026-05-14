import { useState } from "react";
import { leads, getLeadsForAgent, lendingPartners, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, XCircle } from "lucide-react";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import { SLPStatusUpdateDialog } from "@/components/SLPStatusUpdateDialog";
import { SLP_STATUS_LABELS } from "@/lib/slp";
import { can } from "@/lib/permissions";
import type { ColumnDef } from "@/types/table";
import type { STBSubmission } from "@/types/lms";

type STBItem = STBSubmission & { leadName: string; leadId: string; product: string };

const STBPage = () => {
  const { role } = useRole();
  const navigate = useNavigate();

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : leads;
  const stbLeads = allLeads.filter(l => l.stbSubmissions.length > 0);
  const allSubs: STBItem[] = stbLeads.flatMap(l => l.stbSubmissions.map(s => ({ ...s, leadName: l.name, leadId: l.id, product: l.productType })));

  const submitted = allSubs.filter(s => s.status === "submitted").length;
  const approved = allSubs.filter(s => s.status === "approved").length;
  const disbursed = allSubs.filter(s => s.status === "disbursed").length;
  const declined = allSubs.filter(s => s.status === "declined").length;

  const [updateTarget, setUpdateTarget] = useState<STBItem | null>(null);
  const [localSubs, setLocalSubs] = useState<STBItem[]>(allSubs);

  const canUpdate = can.updateSlpStatus(role);
  const TERMINAL = ["disbursed", "declined", "cancelled", "expired"];

  const columns: ColumnDef<STBItem>[] = [
    { id: "lead", label: "Lead", render: (s) => <span className="font-medium text-sm">{s.leadName}</span> },
    { id: "product", label: "Product", render: (s) => <Badge variant="outline" className="text-xs">{getProductLabel(s.product as any)}</Badge> },
    { id: "partner", label: "Partner", render: (s) => <span className="text-sm">{s.partnerName}</span> },
    { id: "submitted", label: "Submitted", render: (s) => <span className="text-sm text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</span> },
    { id: "days", label: "Days", render: (s) => <span className="text-sm">{Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / 86400000)}d</span> },
    { id: "status", label: "Status", render: (s) => (
      <Badge variant={s.status === "disbursed" ? "default" : s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-xs">
        {SLP_STATUS_LABELS[s.status] ?? s.status}
      </Badge>
    )},
    { id: "sanction", label: "Sanction Amt", render: (s) => <span className="text-sm">{s.sanctionAmount ? `₹${s.sanctionAmount.toLocaleString()}` : "—"}</span> },
    { id: "disbursedAmt", label: "Disbursed Amt", render: (s) => <span className="text-sm">{s.disbursedAmount ? `₹${s.disbursedAmount.toLocaleString()}` : "—"}</span> },
    { id: "disbDate", label: "Disb. Date", render: (s) => <span className="text-sm text-muted-foreground">{s.disbursementDate ? new Date(s.disbursementDate).toLocaleDateString() : "—"}</span> },
    { id: "integration", label: "Integration", defaultVisible: false, render: (s) => <Badge variant="outline" className="text-[10px]">{s.integrationType}</Badge> },
    ...(canUpdate ? [{
      id: "update", label: "Update", locked: "end" as const,
      render: (s: STBItem) => {
        const terminal = TERMINAL.includes(s.status);
        return (
          <div onClick={e => e.stopPropagation()}>
            {terminal ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              <Button size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => setUpdateTarget(s)}>
                Update
              </Button>
            )}
          </div>
        );
      }
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Send to Lending Partner (SLP)</h1>
        <p className="text-muted-foreground text-sm">{allSubs.length} total submissions to lending partners</p>
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
        <CardHeader><CardTitle className="text-base">SLP Submissions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ConfigurableTable
            tableId="stb"
            columns={columns}
            data={localSubs}
            onRowClick={(s) => navigate(`/leads/${s.leadId}`)}
          />
        </CardContent>
      </Card>

      {updateTarget && (
        <SLPStatusUpdateDialog
          open={!!updateTarget}
          onOpenChange={(o) => !o && setUpdateTarget(null)}
          lead={{ id: updateTarget.leadId, name: updateTarget.leadName }}
          submission={updateTarget}
          onUpdated={(next) => {
            setLocalSubs(prev => prev.map(s => s.id === next.id ? { ...s, ...next } : s));
            setUpdateTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default STBPage;
