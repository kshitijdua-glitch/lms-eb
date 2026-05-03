import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { dispositionConfigs } from "@/data/mockData";
import { Edit, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { usePartners } from "@/contexts/PartnersContext";
import { useRole } from "@/contexts/RoleContext";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { can } from "@/lib/permissions";

const ConfigPage = () => {
  const { products, partners, addProduct, updateProduct, toggleProductStatus, removeProduct, getProductLabel } = usePartners();
  const { role, currentAgentId } = useRole();
  const { logAudit } = useAudit();
  const canEdit = can.configureSystem(role);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productLabel, setProductLabel] = useState("");

  const openAddProduct = () => {
    setEditingProductId(null);
    setProductLabel("");
    setProductDialogOpen(true);
  };

  const openEditProduct = (id: string, label: string) => {
    setEditingProductId(id);
    setProductLabel(label);
    setProductDialogOpen(true);
  };

  const submitProduct = () => {
    const trimmed = productLabel.trim();
    if (trimmed.length < 2) {
      toast.error("Product name must be at least 2 characters");
      return;
    }
    const actor = buildActor(role, currentAgentId);
    if (editingProductId) {
      updateProduct(editingProductId, { label: trimmed });
      logAudit({ ...actor, action: "product_updated", entityType: "config", entityId: editingProductId, after: { label: trimmed } });
      toast.success(`Updated ${trimmed}`);
    } else {
      const created = addProduct(trimmed);
      logAudit({ ...actor, action: "product_created", entityType: "config", entityId: created.id, entityLabel: created.label, after: { label: created.label } });
      toast.success(`Added ${created.label}`);
    }
    setProductDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuration</h1>
          <p className="text-muted-foreground text-sm">System settings and rules management</p>
        </div>
        {!canEdit && <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Read-only</Badge>}
      </div>

      <Tabs defaultValue="dispositions">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dispositions">Dispositions</TabsTrigger>
          <TabsTrigger value="bre">BRE Rules</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="call-rules">Call Rules</TabsTrigger>
          <TabsTrigger value="follow-up-sla">Follow-Up SLA</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dispositions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Disposition Categories</CardTitle>
                <Button size="sm" variant="outline" disabled={!canEdit}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disposition</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Requires Follow-Up</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispositionConfigs.map(d => (
                    <TableRow key={d.type}>
                      <TableCell className="font-medium">{d.label}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{d.category.replace("_", " ")}</Badge></TableCell>
                      <TableCell><Switch checked={d.requiresFollowUp} disabled={!canEdit} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" disabled={!canEdit}><Edit className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bre" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">BRE Rules by Partner</CardTitle>
                <a href="/admin/partners" className="text-xs text-primary hover:underline">Manage partners →</a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Min Credit Score</TableHead>
                    <TableHead>Max FOIR</TableHead>
                    <TableHead>Min Income</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map(lp => (
                    <TableRow key={lp.id}>
                      <TableCell className="font-medium">{lp.name}</TableCell>
                      <TableCell>{lp.minCreditScore}</TableCell>
                      <TableCell>{lp.maxFoir}%</TableCell>
                      <TableCell>₹{lp.minIncome.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {lp.products.map(p => <Badge key={p} variant="outline" className="text-[10px]">{getProductLabel(p)}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={lp.status === "active" ? "default" : "secondary"} className="text-xs">{lp.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Product Types</CardTitle>
                <Button size="sm" variant="outline" onClick={openAddProduct} disabled={!canEdit}>
                  <Plus className="h-3 w-3 mr-1" /> Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {products.map(p => {
                  const usedBy = partners.filter(lp => (lp.products as string[]).includes(p.id)).length;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{p.label}</span>
                        {p.isCustom && <Badge variant="outline" className="text-[10px]">Custom</Badge>}
                        <span className="text-xs text-muted-foreground">used by {usedBy} partner{usedBy === 1 ? "" : "s"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.status === "active"}
                          disabled={!canEdit}
                          onCheckedChange={() => {
                            toggleProductStatus(p.id);
                            const actor = buildActor(role, currentAgentId);
                            logAudit({ ...actor, action: "product_status_toggled", entityType: "config", entityId: p.id, entityLabel: p.label });
                          }}
                        />
                        <Button variant="ghost" size="icon" disabled={!canEdit} onClick={() => openEditProduct(p.id, p.label)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!canEdit || !p.isCustom}
                          title={p.isCustom ? "Remove custom product" : "Built-in products cannot be removed"}
                          onClick={() => {
                            if (usedBy > 0) { toast.error(`In use by ${usedBy} partner(s). Remove from partners first.`); return; }
                            removeProduct(p.id);
                            const actor = buildActor(role, currentAgentId);
                            logAudit({ ...actor, action: "product_deleted", entityType: "config", entityId: p.id, entityLabel: p.label });
                            toast.success(`Removed ${p.label}`);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No products configured.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProductId ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>Products appear when configuring lending partners and lead intake.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Product Name</Label>
              <Input
                value={productLabel}
                onChange={e => setProductLabel(e.target.value)}
                placeholder="e.g. Gold Loan"
                maxLength={60}
                onKeyDown={e => { if (e.key === "Enter") submitProduct(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitProduct}>{editingProductId ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigPage;
