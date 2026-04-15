import { useState } from "react";
import { agents, teams } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const managers = [
  { id: "mgr-1", name: "Vikram Mehta", email: "vikram@lms.com", phone: "9800000001", teams: ["team-1"], groupName: "West Zone", tlCapacity: 5, status: "active" as const },
  { id: "mgr-2", name: "Anjali Kapoor", email: "anjali@lms.com", phone: "9800000002", teams: ["team-2"], groupName: "South Zone", tlCapacity: 5, status: "active" as const },
];

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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Converted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.phone}</TableCell>
                      <TableCell className="text-xs">{a.teamName}</TableCell>
                      <TableCell className="text-xs">{a.managerName}</TableCell>
                      <TableCell className="text-right">{a.leadsAssigned}</TableCell>
                      <TableCell className="text-right">{a.leadsConverted}</TableCell>
                      <TableCell><Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success("Password reset link sent")}>
                            <Key className="h-3 w-3" />
                          </Button>
                          {a.status === "active" ? (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setDeactivateTarget(a.id)}>
                              <UserX className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-success" onClick={() => toast.success(`${a.name} reactivated`)}>
                              <UserCheck className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managers">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="text-right">TL Capacity</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.email}</TableCell>
                      <TableCell className="text-xs">{m.groupName}</TableCell>
                      <TableCell className="text-right">{m.tlCapacity}</TableCell>
                      <TableCell className="text-xs">{m.teams.map(tid => teams.find(t => t.id === tid)?.name).join(", ")}</TableCell>
                      <TableCell><Badge variant="default">{m.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success("Password reset link sent")}>
                          <Key className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Staff Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select value={createTab} onValueChange={v => setCreateTab(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Name *</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" /></div>
            <div><Label>Email *</Label><Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@lms.com" /></div>
            <div><Label>Phone</Label><Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="9876543210" /></div>
            {createTab === "agent" && (
              <div>
                <Label>Assign to Team</Label>
                <Select value={formTeam} onValueChange={setFormTeam}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Warning */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This agent may have unworked leads, open follow-ups, or active STB submissions. Deactivating will require reassigning their leads.
            </AlertDialogDescription>
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
