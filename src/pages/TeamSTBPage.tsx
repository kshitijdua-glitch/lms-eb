import { getLeadsForTeam, getProductLabel, agents } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const TeamSTBPage = () => {
  const navigate = useNavigate();
  const teamLeads = getLeadsForTeam("team-1");
  const stbLeads = teamLeads.filter(l => l.stbSubmissions.length > 0);
  const allSubs = stbLeads.flatMap(l => l.stbSubmissions.map(s => ({
    ...s, leadName: l.name, leadId: l.id, product: l.productType, assignedAgentId: l.assignedAgentId,
  })));

  const submitted = allSubs.filter(s => s.status === "submitted").length;
  const approved = allSubs.filter(s => s.status === "approved").length;
  const disbursed = allSubs.filter(s => s.status === "disbursed").length;
  const declined = allSubs.filter(s => s.status === "declined").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team STB Pipeline</h1>
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
        <CardHeader><CardTitle className="text-base">Team STB Submissions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sanction Amt</TableHead>
                <TableHead>Disbursed Amt</TableHead>
                <TableHead>Disb. Date</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSubs.map(s => {
                const daysSince = Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / 86400000);
                const agent = agents.find(a => a.id === s.assignedAgentId);
                const isNonApi = s.integrationType !== "api";
                return (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${s.leadId}`)}>
                    <TableCell className="font-medium text-sm">{s.leadName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{agent?.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getProductLabel(s.product)}</Badge></TableCell>
                    <TableCell className="text-sm">{s.partnerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{daysSince}d</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "disbursed" ? "default" : s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-xs">
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{s.sanctionAmount ? `₹${s.sanctionAmount.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-sm">{s.disbursedAmount ? `₹${s.disbursedAmount.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.disbursementDate ? new Date(s.disbursementDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
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

export default TeamSTBPage;
