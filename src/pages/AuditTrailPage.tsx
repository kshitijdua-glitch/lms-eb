import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, Download } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  actionType: string;
  target: string;
  before: string;
  after: string;
  reason: string;
};

const mockAuditLog: AuditEntry[] = [
  { id: "a1", timestamp: "2026-04-14T10:30:00Z", actor: "CH Admin", actorRole: "cluster_head", actionType: "disposition_override", target: "Lead: Rajesh Khanna", before: "Closed Lost", after: "Contacted", reason: "Customer called back, interested" },
  { id: "a2", timestamp: "2026-04-14T09:15:00Z", actor: "CH Admin", actorRole: "cluster_head", actionType: "config_change", target: "Allocation Rules", before: "Manual", after: "Round Robin", reason: "Efficiency improvement" },
  { id: "a3", timestamp: "2026-04-13T16:00:00Z", actor: "CH Admin", actorRole: "cluster_head", actionType: "staff_deactivate", target: "Agent: Karan Singh", before: "Active", after: "Inactive", reason: "Resigned" },
  { id: "a4", timestamp: "2026-04-13T14:20:00Z", actor: "Vikram Mehta", actorRole: "manager", actionType: "disposition_override", target: "Lead: Arjun Rao", before: "Declined", after: "Interested", reason: "Wrong bank selected, retry with ICICI" },
  { id: "a5", timestamp: "2026-04-13T11:00:00Z", actor: "Priya Sharma", actorRole: "team_leader", actionType: "reassignment", target: "Lead: Sunita Devi", before: "Agent: Amit Verma", after: "Agent: Sneha Gupta", reason: "Agent on leave" },
  { id: "a6", timestamp: "2026-04-12T17:30:00Z", actor: "CH Admin", actorRole: "cluster_head", actionType: "staff_create", target: "Agent: New Agent", before: "—", after: "Active", reason: "New hire" },
  { id: "a7", timestamp: "2026-04-12T10:00:00Z", actor: "Ravi Kumar", actorRole: "team_leader", actionType: "disposition", target: "Lead: Mohd Irfan", before: "New", after: "Hot Follow-Up", reason: "" },
  { id: "a8", timestamp: "2026-04-11T15:00:00Z", actor: "CH Admin", actorRole: "cluster_head", actionType: "config_change", target: "Lead Sources", before: "—", after: "Added: TeleCall", reason: "New vendor onboarded" },
  { id: "a9", timestamp: "2026-04-11T09:30:00Z", actor: "System", actorRole: "system", actionType: "login", target: "Vikram Mehta", before: "—", after: "Logged in", reason: "" },
  { id: "a10", timestamp: "2026-04-10T14:00:00Z", actor: "Anjali Kapoor", actorRole: "manager", actionType: "reassignment", target: "Lead: Kavita Mishra", before: "TL: Priya Sharma", after: "TL: Ravi Kumar", reason: "Cross-team balance" },
];

const actionTypes = ["All", "disposition_override", "config_change", "staff_deactivate", "staff_create", "reassignment", "disposition", "login"];
const roles = ["All", "cluster_head", "manager", "team_leader", "system"];

const AuditTrailPage = () => {
  const { role } = useRole();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = useMemo(() => {
    return mockAuditLog.filter(e => {
      if (actionFilter !== "All" && e.actionType !== actionFilter) return false;
      if (roleFilter !== "All" && e.actorRole !== roleFilter) return false;
      if (search && !e.target.toLowerCase().includes(search.toLowerCase()) && !e.actor.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, actionFilter, roleFilter]);

  const actionLabel = (a: string) => a.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Audit Trail</h1>
          <p className="text-muted-foreground text-sm">
            Immutable log of all system actions.{role !== "data_admin" && " No export available."}
          </p>
        </div>
        {role === "data_admin" && (
          <Button variant="outline" onClick={() => { toast.success("Audit trail CSV exported. Action logged."); }}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search actor or target..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Action Type" /></SelectTrigger>
          <SelectContent>
            {actionTypes.map(a => <SelectItem key={a} value={a}>{a === "All" ? "All Actions" : actionLabel(a)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            {roles.map(r => <SelectItem key={r} value={r}>{r === "All" ? "All Roles" : actionLabel(r)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Before</TableHead>
                <TableHead>After</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-sm">{e.actor}</TableCell>
                  <TableCell>
                    <Badge variant={e.actorRole === "cluster_head" ? "default" : e.actorRole === "manager" ? "default" : "secondary"} className="text-[10px]">
                      {actionLabel(e.actorRole)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{actionLabel(e.actionType)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{e.target}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.before}</TableCell>
                  <TableCell className="text-xs font-medium">{e.after}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{e.reason || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {mockAuditLog.length} entries{role !== "data_admin" && " · Export disabled per policy"}
      </div>
    </div>
  );
};

export default AuditTrailPage;
