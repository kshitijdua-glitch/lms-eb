import { useState } from "react";
import { agents, teams } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Key, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import type { Agent } from "@/types/lms";

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", email: "vikram@lms.com", phone: "9800000001", teams: ["team-1"], groupName: "West Zone", tlCapacity: 5, status: "active" as const },
  { id: "mgr-2", name: "Anjali Kapoor", email: "anjali@lms.com", phone: "9800000002", teams: ["team-2"], groupName: "South Zone", tlCapacity: 5, status: "active" as const },
];

type ManagerRow = typeof managers[0];

const StaffManagementPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [createTab, setCreateTab] = useState<"agent" | "manager">("agent");
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTeam, setFormTeam] = useState("");

  const handleCreate = () => {
    if (!formName || !formEmail) { toast.error("Name and email required"); return; }
    toast.success(`${createTab === "agent" ? "Agent" : "Manager"} "${formName}" created`);
    setShowCreate(false);
    setFormName(""); setFormEmail(""); setFormPhone(""); setFormTeam("");
  };

  const handleDeactivate = () => {
    toast.success(`Staff member deactivated. Leads will need reassignment.`);
    setDeactivateTarget(null);
  };

  const agentColumns: ColumnDef<Agent>[] = [
    { id: "name", label: "Name", render: (a) => <span className="font-medium">{a.name}</span> },
    { id: "email", label: "Email", render: (a) => <span className="text-xs text-muted-foreground">{a.email}</span> },
    { id: "phone", label: "Phone", render: (a) => <span className="text-xs text-muted-foreground">{a.phone}</span> },
    { id: "team", label: "Team", render: (a) => <span className="text-xs">{a.teamName}</span> },
    { id: "manager", label: "Manager", render: (a) => <span className="text-xs">{a.managerName}</span> },
    { id: "leads", label: "Leads", render: (a) => <span className="text-right block">{a.leadsAssigned}</span> },
    { id: "converted", label: "Converted", render: (a) => <span className="text-right block">{a.leadsConverted}</span> },
    { id: "status", label: "Status", render: (a) => <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge> },
    { id: "actions", label: "Actions", locked: "end", render: (a) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success("Password reset link sent")}><Key className="h-3 w-3" /></Button>
        {a.status === "active" ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setDeactivateTarget(a.id)}><UserX className="h-3 w-3" /></Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-success" onClick={() => toast.success(`${a.name} reactivated`)}><UserCheck className="h-3 w-3" /></Button>
        )}
      </div>
    )},
  ];

  const managerColumns: ColumnDef<ManagerRow>[] = [
    { id: "name", label: "Name", render: (m) => <span className="font-medium">{m.name}</span> },
    { id: "email", label: "Email", render: (m) => <span className="text-xs text-muted-foreground">{m.email}</span> },
    { id: "group", label: "Group", render: (m) => <span className="text-xs">{m.groupName}</span> },
    { id: "capacity", label: "Agent Capacity", headerClassName: "text-right", render: (m) => <span className="text-right block">{m.tlCapacity}</span> },
    { id: "teams", label: "Teams", render: (m) => <span className="text-xs">{m.teams.map(tid => teams.find(t => t.id === tid)?.name).join(", ")}</span> },
    { id: "status", label: "Status", render: (m) => <Badge variant="default">{m.status}</Badge> },
    { id: "actions", label: "Actions", locked: "end", render: (m) => (
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success("Password reset link sent")}><Key className="h-3 w-3" /></Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground text-sm">Create, edit, and manage agents and managers</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Create Staff</Button>
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agents ({agents.length})</TabsTrigger>
          <TabsTrigger value="managers">Managers ({managers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="agents">
          <Card><CardContent className="p-0">
            <ConfigurableTable tableId="staff-agents" columns={agentColumns} data={agents} />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="managers">
          <Card><CardContent className="p-0">
            <ConfigurableTable tableId="staff-managers" columns={managerColumns} data={managers} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Role</Label><Select value={createTab} onValueChange={v => setCreateTab(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="agent">Agent</SelectItem><SelectItem value="manager">Manager</SelectItem></SelectContent></Select></div>
            <div><Label>Name *</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" /></div>
            <div><Label>Email *</Label><Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@lms.com" /></div>
            <div><Label>Phone</Label><Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="9876543210" /></div>
            {createTab === "agent" && (
              <div><Label>Assign to Team</Label><Select value={formTeam} onValueChange={setFormTeam}><SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>This agent may have unworked leads, open follow-ups, or active SLP submissions. Deactivating will require reassigning their leads.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagementPage;
