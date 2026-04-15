import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Settings } from "lucide-react";
import { toast } from "sonner";

const SystemConfigPage = () => {
  const [leadSources, setLeadSources] = useState([
    { name: "Website", active: true }, { name: "Google Ads", active: true }, { name: "Facebook", active: true },
    { name: "Referral", active: true }, { name: "Partner", active: true }, { name: "Walk-in", active: true },
    { name: "IVR", active: true }, { name: "WhatsApp", active: true },
  ]);
  const [newSource, setNewSource] = useState("");
  const [allocMode, setAllocMode] = useState("round_robin");
  const [leadsPerDay, setLeadsPerDay] = useState("25");
  const [maxNC, setMaxNC] = useState("5");
  const [expiryDays, setExpiryDays] = useState("90");
  const [agingAlertDays, setAgingAlertDays] = useState("7");
  const [bureauWindow, setBureauWindow] = useState("30");
  const [consentExpiry, setConsentExpiry] = useState("7");

  const addSource = () => {
    if (!newSource.trim()) return;
    setLeadSources([...leadSources, { name: newSource, active: true }]);
    setNewSource("");
    toast.success(`Lead source "${newSource}" added. Change logged.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Configuration</h1>
          <p className="text-muted-foreground text-sm">Configure system-wide rules and settings. All changes are audit-logged.</p>
        </div>
        <Settings className="h-5 w-5 text-muted-foreground" />
      </div>

      <Tabs defaultValue="sources">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="allocation">Allocation Rules</TabsTrigger>
          <TabsTrigger value="retry">Retry Logic</TabsTrigger>
          <TabsTrigger value="aging">Aging & Expiry</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Lead Sources</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input placeholder="New source name" value={newSource} onChange={e => setNewSource(e.target.value)} className="max-w-xs" />
                <Button onClick={addSource}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {leadSources.map((s, i) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell>
                        <Switch checked={s.active} onCheckedChange={v => {
                          const updated = [...leadSources];
                          updated[i].active = v;
                          setLeadSources(updated);
                          toast.success(`Source "${s.name}" ${v ? "activated" : "deactivated"}. Change logged.`);
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Allocation Rules</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Allocation Mode</Label>
                  <Select value={allocMode} onValueChange={setAllocMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="weighted">Weighted (by capacity)</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Leads per Agent per Day</Label>
                  <Input type="number" value={leadsPerDay} onChange={e => setLeadsPerDay(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Switch defaultChecked /><Label className="text-sm">Product matching enabled</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch defaultChecked /><Label className="text-sm">Active agent only (logged in within 24h)</Label>
                </div>
              </div>
              <Button onClick={() => toast.success("Allocation rules saved. Change logged.")}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retry" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Retry Logic</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Max Consecutive NC before Escalation</Label><Input type="number" value={maxNC} onChange={e => setMaxNC(e.target.value)} /></div>
                <div><Label>Default Retry Interval (hours)</Label><Input type="number" defaultValue="4" /></div>
              </div>
              <div className="text-xs text-muted-foreground">NC sub-type specific intervals can be configured per disposition in the Dispositions tab (coming soon).</div>
              <Button onClick={() => toast.success("Retry logic saved. Change logged.")}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Lead Aging & Expiry</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Inactivity Alert (days)</Label><Input type="number" value={agingAlertDays} onChange={e => setAgingAlertDays(e.target.value)} /></div>
                <div><Label>Lead Expiry Threshold (days)</Label><Input type="number" value={expiryDays} onChange={e => setExpiryDays(e.target.value)} /></div>
              </div>
              <div className="text-xs text-muted-foreground">Per-product expiry thresholds can be configured in a future update.</div>
              <Button onClick={() => toast.success("Aging rules saved. Change logged.")}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification Settings</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Notification Type</TableHead><TableHead>Real-time</TableHead><TableHead>Summary</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {["Follow-Up Due", "Follow-Up Missed", "Lead Expiry", "NC Escalation", "STB Status Update", "New Allocation", "Agent Not Logged In", "DND Violation"].map(n => (
                    <TableRow key={n}>
                      <TableCell className="font-medium text-sm">{n}</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Switch /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="mt-4" onClick={() => toast.success("Notification settings saved. Change logged.")}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfigPage;
