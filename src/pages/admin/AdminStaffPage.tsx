import { useState, useMemo } from "react";
import { agents, teams } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Search, AlertTriangle, Key } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import type { Agent } from "@/types/lms";

const mockManagers = [
  { id: "mgr-1", name: "Priya Sharma", email: "priya@lms.com", phone: "9876543218", groupName: "North Zone", agentCapacity: 10, agentCount: 5, status: "active" },
  { id: "mgr-2", name: "Ravi Kumar", email: "ravi@lms.com", phone: "9876543219", groupName: "South Zone", agentCapacity: 10, agentCount: 5, status: "active" },
  { id: "mgr-3", name: "Vikram Mehta", email: "vikram@lms.com", phone: "9876543220", groupName: "West Zone", agentCapacity: 15, agentCount: 8, status: "active" },
  { id: "mgr-4", name: "Anjali Kapoor", email: "anjali@lms.com", phone: "9876543221", groupName: "East Zone", agentCapacity: 15, agentCount: 0, status: "active" },
];

type ManagerRow = typeof mockManagers[0];

const mockCHs = [
  { id: "ch-1", name: "CH Admin", email: "ch@lms.com", phone: "9876543222", orgScope: "All India", status: "active" },
];

type CHRow = typeof mockCHs[0];

const AdminStaffPage = () => {
  const [tab, setTab] = useState("agents");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState<string | null>(null);

  const filteredAgents = useMemo(() => agents.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  const agentCols: ColumnDef<Agent>[] = [
    { id: "name", label: "Name", render: (a) => <span className="font-medium">{a.name}</span> },
    { id: "email", label: "Email", render: (a) => <span className="text-sm text-muted-foreground">{a.email}</span> },
    { id: "team", label: "Team", render: (a) => <Badge variant="outline" className="text-xs">{a.teamName}</Badge> },
    { id: "manager", label: "Manager", render: (a) => <span className="text-sm">{a.managerName || "—"}</span> },
    { id: "status", label: "Status", render: (a) => <Badge variant={a.status === "active" ? "default" : "secondary"} className="text-xs">{a.status}</Badge> },
    { id: "leads", label: "Leads", headerClassName: "text-right", render: (a) => <span className="text-right block">{a.leadsAssigned}</span> },
    { id: "actions", label: "", locked: "end", render: (a) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit: " + a.name)}><Edit className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" onClick={() => toast.info("Password reset sent to " + a.email)}><Key className="h-3 w-3" /></Button>
        {a.status === "active" && <Button variant="ghost" size="icon" onClick={() => setShowDeactivate(a.name)}><AlertTriangle className="h-3 w-3 text-red-500" /></Button>}
      </div>
    )},
  ];

  const mgrCols: ColumnDef<ManagerRow>[] = [
    { id: "name", label: "Name", render: (m) => <span className="font-medium">{m.name}</span> },
    { id: "email", label: "Email", render: (m) => <span className="text-sm text-muted-foreground">{m.email}</span> },
    { id: "group", label: "Group", render: (m) => <Badge variant="outline" className="text-xs">{m.groupName}</Badge> },
    { id: "capacity", label: "Agent Capacity", render: (m) => <span className="text-center block">{m.agentCapacity}</span> },
    { id: "agentCount", label: "Agents", render: (m) => <span className="text-center block">{m.agentCount}</span> },
    { id: "status", label: "Status", render: (m) => <Badge variant="default" className="text-xs">{m.status}</Badge> },
    { id: "actions", label: "", locked: "end", render: (m) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit Manager: " + m.name)}><Edit className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" onClick={() => toast.info("Password reset sent")}><Key className="h-3 w-3" /></Button>
      </div>
    )},
  ];

  const chCols: ColumnDef<CHRow>[] = [
    { id: "name", label: "Name", render: (c) => <span className="font-medium">{c.name}</span> },
    { id: "email", label: "Email", render: (c) => <span className="text-sm text-muted-foreground">{c.email}</span> },
    { id: "scope", label: "Org Scope", render: (c) => <span>{c.orgScope}</span> },
    { id: "status", label: "Status", render: (c) => <Badge variant="default" className="text-xs">{c.status}</Badge> },
    { id: "actions", label: "", locked: "end", render: (c) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit CH: " + c.name)}><Edit className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" onClick={() => toast.info("Password reset sent")}><Key className="h-3 w-3" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground text-sm">Create, edit, deactivate, and manage all staff profiles</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="agents">Agents ({agents.length})</TabsTrigger>
          <TabsTrigger value="managers">Managers ({mockManagers.length})</TabsTrigger>
          <TabsTrigger value="chs">Cluster Heads ({mockCHs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="agents">
          <Card><CardContent className="p-0"><ConfigurableTable tableId="admin-agents" columns={agentCols} data={filteredAgents} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="managers">
          <Card><CardContent className="p-0"><ConfigurableTable tableId="admin-managers" columns={mgrCols} data={mockManagers} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="chs">
          <Card><CardContent className="p-0"><ConfigurableTable tableId="admin-chs" columns={chCols} data={mockCHs} /></CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Role</Label><Select defaultValue="agent"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="agent">Agent</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="ch">Cluster Head</SelectItem></SelectContent></Select></div>
            <div><Label>Full Name</Label><Input placeholder="Full name" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="email@lms.com" /></div>
            <div><Label>Phone</Label><Input placeholder="10-digit mobile" /></div>
            <div><Label>Manager</Label><Select><SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger><SelectContent>{mockManagers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { setShowCreate(false); toast.success("Staff member created. Audit logged."); }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeactivate} onOpenChange={() => setShowDeactivate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Deactivate {showDeactivate}?</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Pre-deactivation check:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Active leads: <span className="font-medium text-foreground">12</span></li>
              <li>Open follow-ups: <span className="font-medium text-foreground">3</span></li>
              <li>Pending STBs: <span className="font-medium text-foreground">1</span></li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivate(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setShowDeactivate(null); toast.success("Staff deactivated."); }}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffPage;
