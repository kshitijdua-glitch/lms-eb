import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertTriangle, UserCheck, UserX, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import { useDirectory, useInviteUser, useUpdateProfile, type DirectoryUser } from "@/hooks/useDirectory";
import type { UserRole } from "@/types/lms";

const ROLE_LABEL: Record<UserRole, string> = {
  agent: "Agent",
  manager: "Manager",
  cluster_head: "Cluster Head",
  data_admin: "Data Admin",
};

const AdminStaffPage = () => {
  const { data: directory = [], isLoading } = useDirectory();
  const invite = useInviteUser();
  const updateProfile = useUpdateProfile();

  const [tab, setTab] = useState<UserRole>("agent");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState<DirectoryUser | null>(null);
  const [tempPwd, setTempPwd] = useState<{ email: string; password: string } | null>(null);

  // form state
  const [fRole, setFRole] = useState<UserRole>("agent");
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fManager, setFManager] = useState<string>("");

  const managers = useMemo(() => directory.filter(u => u.role === "manager" && u.status === "active"), [directory]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return directory.filter(u => u.role === tab && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  }, [directory, tab, search]);

  const resetForm = () => { setFRole("agent"); setFName(""); setFEmail(""); setFPhone(""); setFManager(""); };

  const handleCreate = async () => {
    if (!fName.trim() || !fEmail.trim()) { toast.error("Name and email are required"); return; }
    try {
      const result = await invite.mutateAsync({
        name: fName.trim(), email: fEmail.trim(), phone: fPhone || undefined, role: fRole,
        manager_id: fRole === "agent" && fManager ? fManager : null,
      });
      setShowCreate(false); resetForm();
      if (result.temporary_password) {
        setTempPwd({ email: result.email, password: result.temporary_password });
      } else {
        toast.success(`${fName} added`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleToggleStatus = async (u: DirectoryUser) => {
    const next = u.status === "active" ? "inactive" : "active";
    try {
      await updateProfile.mutateAsync({ id: u.id, patch: { status: next } });
      toast.success(`${u.name} ${next === "active" ? "activated" : "deactivated"}`);
      setShowDeactivate(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  const cols: ColumnDef<DirectoryUser>[] = [
    { id: "name", label: "Name", render: (u) => <span className="font-medium">{u.name}</span> },
    { id: "email", label: "Email", render: (u) => <span className="text-sm text-muted-foreground">{u.email}</span> },
    { id: "phone", label: "Phone", render: (u) => <span className="text-sm">{u.phone ?? "—"}</span> },
    { id: "manager", label: "Manager", render: (u) => <span className="text-sm">{directory.find(d => d.id === u.manager_id)?.name ?? "—"}</span> },
    { id: "status", label: "Status", render: (u) => <Badge variant={u.status === "active" ? "default" : "secondary"} className="text-xs">{u.status}</Badge> },
    { id: "joined", label: "Joined", render: (u) => <span className="text-xs text-muted-foreground">{new Date(u.joined_at).toLocaleDateString()}</span> },
    { id: "actions", label: "", locked: "end", render: (u) => (
      <div className="flex gap-1">
        {u.status === "active" ? (
          <Button variant="ghost" size="icon" onClick={() => setShowDeactivate(u)} title="Deactivate">
            <UserX className="h-3.5 w-3.5 text-destructive" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(u)} title="Reactivate">
            <UserCheck className="h-3.5 w-3.5 text-success" />
          </Button>
        )}
      </div>
    )},
  ];

  const counts = useMemo(() => ({
    agent: directory.filter(u => u.role === "agent").length,
    manager: directory.filter(u => u.role === "manager").length,
    cluster_head: directory.filter(u => u.role === "cluster_head").length,
    data_admin: directory.filter(u => u.role === "data_admin").length,
  }), [directory]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground text-sm">Invite, edit, deactivate, and manage all staff profiles</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Invite User</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as UserRole)}>
        <TabsList>
          <TabsTrigger value="agent">Agents ({counts.agent})</TabsTrigger>
          <TabsTrigger value="manager">Managers ({counts.manager})</TabsTrigger>
          <TabsTrigger value="cluster_head">Cluster Heads ({counts.cluster_head})</TabsTrigger>
          <TabsTrigger value="data_admin">Data Admins ({counts.data_admin})</TabsTrigger>
        </TabsList>
        {(["agent","manager","cluster_head","data_admin"] as UserRole[]).map(r => (
          <TabsContent key={r} value={r}>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <ConfigurableTable tableId={`admin-staff-${r}`} columns={cols} data={filtered} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role *</Label>
              <Select value={fRole} onValueChange={(v) => setFRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cluster_head">Cluster Head</SelectItem>
                  <SelectItem value="data_admin">Data Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Full Name *</Label><Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Jane Doe" /></div>
            <div><Label>Email *</Label><Input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="jane@company.com" /></div>
            <div><Label>Phone</Label><Input value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="10-digit mobile" /></div>
            {fRole === "agent" && (
              <div>
                <Label>Manager</Label>
                <Select value={fManager} onValueChange={setFManager}>
                  <SelectTrigger><SelectValue placeholder="Select manager (optional)" /></SelectTrigger>
                  <SelectContent>
                    {managers.length === 0 && <div className="p-2 text-xs text-muted-foreground">No managers yet</div>}
                    {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={invite.isPending}>
              {invite.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeactivate} onOpenChange={() => setShowDeactivate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Deactivate {showDeactivate?.name}?
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            They will be marked inactive. Any leads assigned to them will need to be reassigned.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivate(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDeactivate && handleToggleStatus(showDeactivate)} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tempPwd} onOpenChange={(o) => !o && setTempPwd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User created — share credentials</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Share this temporary password with <strong>{tempPwd?.email}</strong>. They should change it after first login.</p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="flex-1 font-mono text-sm">{tempPwd?.password}</code>
              <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(tempPwd?.password ?? ""); toast.success("Password copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPwd(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffPage;
