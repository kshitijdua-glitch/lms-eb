import { leads, getLeadsForAgent, getLeadsForTeam, lendingPartners, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, XCircle, Clock } from "lucide-react";

const STBPage = () => {
  const { role } = useRole();
  const navigate = useNavigate();

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : role === "team_leader" ? getLeadsForTeam("team-1") : leads;
  const stbLeads = allLeads.filter(l => l.stbSubmissions.length > 0);
  const allSubs = stbLeads.flatMap(l => l.stbSubmissions.map(s => ({ ...s, leadName: l.name, leadId: l.id, product: l.productType })));

  const submitted = allSubs.filter(s => s.status === "submitted").length;
  const approved = allSubs.filter(s => s.status === "approved").length;
  const disbursed = allSubs.filter(s => s.status === "disbursed").length;
  const declined = allSubs.filter(s => s.status === "declined").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Send to Bank (STB)</h1>
        <p className="text-muted-foreground text-sm">{allSubs.length} total submissions</p>
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
        <CardHeader><CardTitle className="text-base">STB Submissions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSubs.map(s => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${s.leadId}`)}>
                  <TableCell className="font-medium">{s.leadName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{getProductLabel(s.product)}</Badge></TableCell>
                  <TableCell>{s.partnerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={s.status === "disbursed" ? "default" : s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {s.disbursedAmount ? `₹${s.disbursedAmount.toLocaleString()}` : s.approvedAmount ? `₹${s.approvedAmount.toLocaleString()}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default STBPage;
