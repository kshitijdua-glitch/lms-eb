import { agents, teams } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import type { Agent } from "@/types/lms";

const AgentManagementPage = () => {
  const [showCreate, setShowCreate] = useState(false);

  const columns: ColumnDef<Agent>[] = [
    { id: "name", label: "Name", render: (a) => <span className="font-medium">{a.name}</span> },
    { id: "email", label: "Email", render: (a) => <span className="text-sm text-muted-foreground">{a.email}</span> },
    { id: "team", label: "Team", defaultVisible: false, render: (a) => <Badge variant="outline" className="text-xs">{a.teamName}</Badge> },
    { id: "manager", label: "Manager", render: (a) => <span className="text-sm">{a.managerName || "—"}</span> },
    { id: "status", label: "Status", render: (a) => <Badge variant={a.status === "active" ? "default" : "secondary"} className="text-xs">{a.status}</Badge> },
    { id: "leads", label: "Leads", headerClassName: "text-right", render: (a) => <span className="text-right block">{a.leadsAssigned}</span> },
    { id: "converted", label: "Converted", headerClassName: "text-right", render: (a) => <span className="text-right block">{a.leadsConverted}</span> },
    { id: "rate", label: "Rate", headerClassName: "text-right", render: (a) => <span className="text-right block">{a.leadsAssigned > 0 ? `${Math.round((a.leadsConverted / a.leadsAssigned) * 100)}%` : "—"}</span> },
    { id: "actions", label: "", locked: "end", render: (a) => (
      <Button variant="ghost" size="icon" onClick={() => toast.info("Edit agent: " + a.name)}><Edit className="h-3 w-3" /></Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground text-sm">{agents.length} agents across {teams.length} teams</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Add Agent</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ConfigurableTable tableId="agent-mgmt" columns={columns} data={agents} />
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Agent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input placeholder="Agent name" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="agent@lms.com" /></div>
            <div><Label>Phone</Label><Input placeholder="10-digit mobile" /></div>
            <div><Label>Team</Label><Select><SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { setShowCreate(false); toast.success("Agent created"); }}>Create Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentManagementPage;
