import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, AlertTriangle, FileText, Users, Send, BarChart3, UserCog, Database } from "lucide-react";
import { toast } from "sonner";

const exportTypes = [
  { id: "full_lead", label: "Full Lead Export", icon: Database, description: "All lead data including PII fields", pii: true },
  { id: "disposition", label: "Disposition Summary", icon: BarChart3, description: "Disposition counts by category, agent, and date" },
  { id: "stb_pipeline", label: "STB Pipeline", icon: Send, description: "All STB submissions with bank status and timelines" },
  { id: "source_attribution", label: "Source Attribution", icon: FileText, description: "Lead source performance and conversion metrics" },
  { id: "agent_activity", label: "Agent Activity", icon: Users, description: "Agent-wise call logs, dispositions, and follow-up compliance" },
  { id: "staff_profile", label: "Staff Profile", icon: UserCog, description: "All staff profiles with hierarchy and status" },
];

const managers = [
  { id: "all", name: "All Managers" },
  { id: "mgr-1", name: "Vikram Mehta" },
  { id: "mgr-2", name: "Anjali Kapoor" },
];

const MISExportPage = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("2026-04-01");
  const [dateTo, setDateTo] = useState("2026-04-14");
  const [manager, setManager] = useState("all");

  const handleExport = (type: string) => {
    const exp = exportTypes.find(e => e.id === type);
    if (exp?.pii) {
      toast.warning("PII Export: This export contains sensitive personal data. Action logged in audit trail.", { duration: 5000 });
    }
    toast.success(`${exp?.label} CSV generated and ready for download.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MIS & Data Export</h1>
        <p className="text-muted-foreground text-sm">Generate filtered CSV exports for reporting and analysis</p>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-xs">From Date *</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs">To Date *</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs">Manager</Label>
          <Select value={manager} onValueChange={setManager}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportTypes.map(exp => (
          <Card key={exp.id} className={`cursor-pointer transition-colors ${selectedType === exp.id ? "border-primary" : ""}`}
            onClick={() => setSelectedType(exp.id)}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <exp.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">{exp.label}</h3>
                </div>
                {exp.pii && (
                  <Badge variant="destructive" className="text-[9px] flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> PII
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{exp.description}</p>
              <Button size="sm" className="w-full" onClick={e => { e.stopPropagation(); handleExport(exp.id); }}>
                <Download className="h-3 w-3 mr-1" /> Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Scheduled Reports</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Configure automated non-PII report delivery. PII exports cannot be scheduled.</p>
          <div className="space-y-3">
            {[
              { name: "Daily Disposition Summary", freq: "Daily", time: "08:00 AM", recipients: "ops@company.com", active: true },
              { name: "Weekly Source Attribution", freq: "Weekly (Mon)", time: "09:00 AM", recipients: "analytics@company.com", active: true },
              { name: "Weekly Agent Activity", freq: "Weekly (Fri)", time: "06:00 PM", recipients: "hr@company.com", active: false },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.freq} at {s.time} → {s.recipients}</div>
                </div>
                <Switch checked={s.active} onCheckedChange={() => toast.info(`Schedule ${s.active ? "disabled" : "enabled"}: ${s.name}`)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MISExportPage;
