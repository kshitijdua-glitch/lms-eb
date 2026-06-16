import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { LendingPartner } from "@/types/lms";
import { usePartners } from "@/contexts/PartnersContext";
import { useRole } from "@/contexts/RoleContext";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { can } from "@/lib/permissions";
import { AccessRestricted } from "@/components/AccessRestricted";

const partnerSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(80),
  integrationType: z.enum(["api", "portal", "email"]),
  products: z.array(z.string()).min(1, "Select at least 1 product"),
  minCreditScore: z.number().min(300).max(900),
  maxFoir: z.number().min(0).max(100),
  minIncome: z.number().min(0),
  status: z.enum(["active", "inactive"]),
});

type FormState = z.infer<typeof partnerSchema>;

const emptyForm: FormState = {
  name: "",
  integrationType: "api",
  products: [],
  minCreditScore: 700,
  maxFoir: 55,
  minIncome: 20000,
  status: "active",
};

const PartnersPage = () => {
  const { partners, products, addPartner, updatePartner, togglePartnerStatus, removePartner, getProductLabel } = usePartners();
  const { role, currentAgentId } = useRole();
  const { logAudit } = useAudit();
  const canEdit = can.configureSystem(role);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeProducts = products.filter(p => p.status === "active");

  if (!canEdit && role === "agent") {
    return <AccessRestricted />;
  }

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (lp: LendingPartner) => {
    setEditingId(lp.id);
    setForm({
      name: lp.name,
      integrationType: lp.integrationType,
      products: lp.products,
      minCreditScore: lp.minCreditScore,
      maxFoir: lp.maxFoir,
      minIncome: lp.minIncome,
      status: lp.status,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const submit = () => {
    const result = partnerSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    const actor = buildActor(role, currentAgentId);
    if (editingId) {
      const before = partners.find(p => p.id === editingId);
      updatePartner(editingId, result.data as Partial<LendingPartner>);
      logAudit({ ...actor, action: "partner_updated", entityType: "config", entityId: editingId, entityLabel: result.data.name, before: before as unknown as Record<string, unknown>, after: result.data as unknown as Record<string, unknown> });
      toast.success(`Updated ${result.data.name}`);
    } else {
      const created = addPartner(result.data as Omit<LendingPartner, "id">);
      logAudit({ ...actor, action: "partner_created", entityType: "config", entityId: created.id, entityLabel: created.name, after: created as unknown as Record<string, unknown> });
      toast.success(`Added ${created.name}`);
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const partner = partners.find(p => p.id === deleteId);
    removePartner(deleteId);
    const actor = buildActor(role, currentAgentId);
    logAudit({ ...actor, action: "partner_deleted", entityType: "config", entityId: deleteId, entityLabel: partner?.name, before: partner as unknown as Record<string, unknown> });
    toast.success(`Removed ${partner?.name ?? "partner"}`);
    setDeleteId(null);
  };

  const toggleProduct = (productId: string) => {
    setForm(f => ({
      ...f,
      products: f.products.includes(productId) ? f.products.filter(p => p !== productId) : [...f.products, productId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lending Partners</h1>
          <p className="text-muted-foreground text-sm">{partners.length} partners configured · {partners.filter(p => p.status === "active").length} active</p>
        </div>
        {canEdit ? (
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Partner</Button>
        ) : (
          <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Read-only</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Integration</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Min Score</TableHead>
                <TableHead>Max FOIR</TableHead>
                <TableHead>Min Income</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map(lp => (
                <TableRow key={lp.id}>
                  <TableCell className="font-medium">{lp.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs uppercase">{lp.integrationType}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {lp.products.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{getProductLabel(p)}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{lp.minCreditScore}</TableCell>
                  <TableCell>{lp.maxFoir}%</TableCell>
                  <TableCell>₹{lp.minIncome.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={lp.status === "active"}
                        disabled={!canEdit}
                        onCheckedChange={() => {
                          togglePartnerStatus(lp.id);
                          const actor = buildActor(role, currentAgentId);
                          logAudit({ ...actor, action: "partner_status_toggled", entityType: "config", entityId: lp.id, entityLabel: lp.name, after: { status: lp.status === "active" ? "inactive" : "active" } });
                        }}
                      />
                      <Badge variant={lp.status === "active" ? "default" : "secondary"} className="text-xs">{lp.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" disabled={!canEdit} onClick={() => openEdit(lp)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={!canEdit} onClick={() => setDeleteId(lp.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {partners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    No partners configured. Click "Add Partner" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Partner" : "Add Lending Partner"}</DialogTitle>
            <DialogDescription>Configure bank, BRE thresholds, and offered products.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Partner Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={80} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Integration Type</Label>
                <Select value={form.integrationType} onValueChange={v => setForm(f => ({ ...f, integrationType: v as FormState["integrationType"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="portal">Portal</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as "active" | "inactive" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Min Credit Score</Label>
                <Input type="number" value={form.minCreditScore} onChange={e => setForm(f => ({ ...f, minCreditScore: Number(e.target.value) }))} />
                {errors.minCreditScore && <p className="text-xs text-destructive mt-1">{errors.minCreditScore}</p>}
              </div>
              <div>
                <Label>Max FOIR (%)</Label>
                <Input type="number" value={form.maxFoir} onChange={e => setForm(f => ({ ...f, maxFoir: Number(e.target.value) }))} />
                {errors.maxFoir && <p className="text-xs text-destructive mt-1">{errors.maxFoir}</p>}
              </div>
              <div>
                <Label>Min Income (₹)</Label>
                <Input type="number" value={form.minIncome} onChange={e => setForm(f => ({ ...f, minIncome: Number(e.target.value) }))} />
                {errors.minIncome && <p className="text-xs text-destructive mt-1">{errors.minIncome}</p>}
              </div>
            </div>
            <div>
              <Label>Offered Products *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                {activeProducts.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-2">No active products. Add products in Configuration.</p>
                )}
                {activeProducts.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.products.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                    {p.label}
                  </label>
                ))}
              </div>
              {errors.products && <p className="text-xs text-destructive mt-1">{errors.products}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editingId ? "Save Changes" : "Add Partner"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this partner?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer appear in bank selection or STB workflows. Existing leads keep their history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PartnersPage;
