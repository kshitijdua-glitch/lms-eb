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
import { loadConfig, saveConfig, type AppConfig } from "@/lib/configStore";
import { useEffect } from "react";

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

        <TabsContent value="call-rules" className="mt-4">
          <CallRulesTab canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="follow-up-sla" className="mt-4">
          <FollowUpSLATab canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationsTab canEdit={canEdit} />
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

// ───────── Phase 4: Configuration Center tabs ─────────

function useAppConfig() {
  const [cfg, setCfg] = useState<AppConfig>(() => loadConfig());
  useEffect(() => { saveConfig(cfg); }, [cfg]);
  return [cfg, setCfg] as const;
}

function NumberField({ label, value, onChange, suffix, disabled }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="number" value={value} onChange={e => onChange(Number(e.target.value))} disabled={disabled} className="h-9" />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function CallRulesTab({ canEdit }: { canEdit: boolean }) {
  const [cfg, setCfg] = useAppConfig();
  const r = cfg.callRules;
  const update = (patch: Partial<typeof r>) => setCfg(c => ({ ...c, callRules: { ...c.callRules, ...patch } }));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Call Rules</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Min call duration (counted as connected)" value={r.minCallDurationSec} onChange={v => update({ minCallDurationSec: v })} suffix="sec" disabled={!canEdit} />
          <NumberField label="Max retries per lead" value={r.maxRetriesPerLead} onChange={v => update({ maxRetriesPerLead: v })} disabled={!canEdit} />
          <NumberField label="Duplicate-call warning window" value={r.duplicateWindowMinutes} onChange={v => update({ duplicateWindowMinutes: v })} suffix="min" disabled={!canEdit} />
          <NumberField label="Agent backdate limit" value={r.agentBackdateHours} onChange={v => update({ agentBackdateHours: v })} suffix="hours" disabled={!canEdit} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">Enforce consent before STB</Label>
            <p className="text-[11px] text-muted-foreground">Block Send-to-Bank until customer consent is recorded.</p>
          </div>
          <Switch checked={r.enforceConsentBeforeSTB} disabled={!canEdit} onCheckedChange={v => update({ enforceConsentBeforeSTB: v })} />
        </div>
        <Button size="sm" disabled={!canEdit} onClick={() => toast.success("Call rules saved")}>Save</Button>
      </CardContent>
    </Card>
  );
}

function FollowUpSLATab({ canEdit }: { canEdit: boolean }) {
  const [cfg, setCfg] = useAppConfig();
  const r = cfg.followUpSLA;
  const update = (patch: Partial<typeof r>) => setCfg(c => ({ ...c, followUpSLA: { ...c.followUpSLA, ...patch } }));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Follow-Up SLA</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Hot lead first follow-up" value={r.hotLeadHours} onChange={v => update({ hotLeadHours: v })} suffix="hours" disabled={!canEdit} />
          <NumberField label="Warm lead first follow-up" value={r.warmLeadHours} onChange={v => update({ warmLeadHours: v })} suffix="hours" disabled={!canEdit} />
          <NumberField label="Cold lead first follow-up" value={r.coldLeadHours} onChange={v => update({ coldLeadHours: v })} suffix="hours" disabled={!canEdit} />
          <NumberField label="Overdue grace period" value={r.overdueGraceMinutes} onChange={v => update({ overdueGraceMinutes: v })} suffix="min" disabled={!canEdit} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">Notify manager on missed SLA</Label>
            <p className="text-[11px] text-muted-foreground">Auto-escalates breached follow-ups to the agent's TL/Manager.</p>
          </div>
          <Switch checked={r.notifyManagerOnMissed} disabled={!canEdit} onCheckedChange={v => update({ notifyManagerOnMissed: v })} />
        </div>
        <Button size="sm" disabled={!canEdit} onClick={() => toast.success("SLA settings saved")}>Save</Button>
      </CardContent>
    </Card>
  );
}

function NotificationsTab({ canEdit }: { canEdit: boolean }) {
  const [cfg, setCfg] = useAppConfig();
  const r = cfg.notifications;
  const update = (patch: Partial<typeof r>) => setCfg(c => ({ ...c, notifications: { ...c.notifications, ...patch } }));
  const updateChannel = (k: keyof typeof r.channels, v: boolean) => update({ channels: { ...r.channels, [k]: v } });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <NumberField label="Send follow-up reminder before due time" value={r.followUpDueLeadMinutes} onChange={v => update({ followUpDueLeadMinutes: v })} suffix="min" disabled={!canEdit} />
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">Daily digest email</Label>
            <p className="text-[11px] text-muted-foreground">Morning summary of overdue and today's follow-ups.</p>
          </div>
          <Switch checked={r.digestEnabled} disabled={!canEdit} onCheckedChange={v => update({ digestEnabled: v })} />
        </div>
        <div className="rounded-md border p-3 space-y-2">
          <Label className="text-sm">Channels</Label>
          {(["inApp", "email", "sms"] as const).map(ch => (
            <div key={ch} className="flex items-center justify-between">
              <span className="text-sm capitalize">{ch === "inApp" ? "In-app" : ch}</span>
              <Switch checked={r.channels[ch]} disabled={!canEdit} onCheckedChange={v => updateChannel(ch, v)} />
            </div>
          ))}
        </div>
        <Button size="sm" disabled={!canEdit} onClick={() => toast.success("Notification settings saved")}>Save</Button>
      </CardContent>
    </Card>
  );
}

