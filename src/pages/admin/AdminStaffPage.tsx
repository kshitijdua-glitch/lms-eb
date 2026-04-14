import { useState, useMemo } from "react";
import { agents, teams } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Search, AlertTriangle, Key } from "lucide-react";
import { toast } from "sonner";

const mockTLs = [
  { id: "tl-1", name: "Priya Sharma", email: "priya@lms.com", phone: "9876543218", team: "Alpha Squad", teamSizeLimit: 8, managerId: "mgr-1", managerName: "Vikram Mehta", agentCount: 5, status: "active" },
  { id: "tl-2", name: "Ravi Kumar", email: "ravi@lms.com", phone: "9876543219", team: "Beta Force", teamSizeLimit: 8, managerId: "mgr-1", managerName: "Vikram Mehta", agentCount: 5, status: "active" },
];

const mockManagers = [
  { id: "mgr-1", name: "Vikram Mehta", email: "vikram@lms.com", phone: "9876543220", groupName: "North Zone", tlCapacity: 5, tlCount: 2, status: "active" },
  { id: "mgr-2", name: "Anjali Kapoor", email: "anjali@lms.com", phone: "9876543221", groupName: "South Zone", tlCapacity: 5, tlCount: 0, status: "active" },
];

const mockCHs = [
  { id: "ch-1", name: "CH Admin", email: "ch@lms.com", phone: "9876543222", orgScope: "All India", status: "active" },
];

const AdminStaffPage = () => {
  const [tab, setTab] = useState("agents");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState<string | null>(null);

  const filteredAgents = useMemo(() => agents.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  ), [search]);

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
          <TabsTrigger value="tls">Team Leaders ({mockTLs.length})</TabsTrigger>
          <TabsTrigger value="managers">Managers ({mockManagers.length})</TabsTrigger>
          <TabsTrigger value="chs">Cluster Heads ({mockCHs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>TL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.teamName}</Badge></TableCell>
                    <TableCell className="text-sm">{a.tlName || "—"}</TableCell>
                    <TableCell><Badge variant={a.status === "active" ? "default" : "secondary"} className="text-xs">{a.status}</Badge></TableCell>
                    <TableCell className="text-right">{a.leadsAssigned}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit: " + a.name)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Password reset sent to " + a.email)}><Key className="h-3 w-3" /></Button>
                        {a.status === "active" && (
                          <Button variant="ghost" size="icon" onClick={() => setShowDeactivate(a.name)}>
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tls">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Size Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTLs.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{t.team}</Badge></TableCell>
                    <TableCell className="text-sm">{t.managerName}</TableCell>
                    <TableCell className="text-center">{t.agentCount}</TableCell>
                    <TableCell className="text-center">{t.teamSizeLimit}</TableCell>
                    <TableCell><Badge variant="default" className="text-xs">{t.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit TL: " + t.name)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Password reset sent")}><Key className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="managers">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>TL Capacity</TableHead>
                  <TableHead>TLs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockManagers.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.groupName}</Badge></TableCell>
                    <TableCell className="text-center">{m.tlCapacity}</TableCell>
                    <TableCell className="text-center">{m.tlCount}</TableCell>
                    <TableCell><Badge variant="default" className="text-xs">{m.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit Manager: " + m.name)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Password reset sent")}><Key className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="chs">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Org Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCHs.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.orgScope}</TableCell>
                    <TableCell><Badge variant="default" className="text-xs">{c.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Edit CH: " + c.name)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Password reset sent")}><Key className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select defaultValue="agent">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="tl">Team Leader</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="ch">Cluster Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Full Name</Label><Input placeholder="Full name" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="email@lms.com" /></div>
            <div><Label>Phone</Label><Input placeholder="10-digit mobile" /></div>
            <div>
              <Label>Manager</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  {mockManagers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team Leader</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select TL" /></SelectTrigger>
                <SelectContent>
                  {mockTLs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { setShowCreate(false); toast.success("Staff member created. Audit logged."); }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Warning Dialog */}
      <Dialog open={!!showDeactivate} onOpenChange={() => setShowDeactivate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Deactivate {showDeactivate}?</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Pre-deactivation check:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Active leads: <span className="font-medium text-foreground">12</span> (will need reassignment)</li>
              <li>Open follow-ups: <span className="font-medium text-foreground">3</span></li>
              <li>Pending STBs: <span className="font-medium text-foreground">1</span></li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">Deactivation will be logged in the audit trail.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivate(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setShowDeactivate(null); toast.success("Staff deactivated. Leads flagged for reassignment."); }}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffPage;
