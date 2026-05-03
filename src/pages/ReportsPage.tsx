import { leads, agents, lendingPartners, getDispositionLabel, getStageLabel, performanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, Send, CheckCircle, Phone, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { ColumnDef } from "@/types/table";
import { ExportConfirmationDialog } from "@/components/ExportConfirmationDialog";
import { LastUpdated } from "@/components/LastUpdated";
import { ScopeChip } from "@/components/ScopeChip";

type AuditRow = { id: string; timestamp: string; agentName: string; leadName: string; disposition: string };

const metrics = [
  { key: "contactRate", label: "Contact Rate %", color: "hsl(var(--primary))" },
  { key: "stbRate", label: "STB Rate %", color: "hsl(var(--info))" },
  { key: "followUpCompliance", label: "Follow-Up Compliance %", color: "hsl(var(--success))" },
  { key: "allocated", label: "Allocated", color: "hsl(var(--warning))" },
  { key: "stbCount", label: "STB Count", color: "hsl(var(--primary))" },
  { key: "disbursedCount", label: "Disbursed Count", color: "hsl(var(--success))" },
];

const ReportsPage = () => {
  const [selectedMetric, setSelectedMetric] = useState("contactRate");
  const [exportOpen, setExportOpen] = useState(false);

  const dateWise = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLeads = leads.filter(l => l.createdAt.split("T")[0] === dateStr).length;
    return { date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), leads: dayLeads || Math.floor(Math.random() * 8) + 2 };
  });

  const handleExport = () => setExportOpen(true);

  const auditData: AuditRow[] = leads.slice(0, 10).flatMap(l => l.callLogs.slice(0, 1).map(cl => ({
    id: cl.id, timestamp: cl.timestamp, agentName: cl.agentName, leadName: l.name, disposition: getDispositionLabel(cl.disposition),
  })));

  const columns: ColumnDef<AuditRow>[] = [
    { id: "timestamp", label: "Timestamp", render: (r) => <span className="text-sm text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</span> },
    { id: "agent", label: "Agent", render: (r) => <span className="text-sm">{r.agentName}</span> },
    { id: "action", label: "Action", render: () => <Badge variant="outline" className="text-xs">Call Logged</Badge> },
    { id: "lead", label: "Lead", render: (r) => <span className="text-sm font-medium">{r.leadName}</span> },
    { id: "details", label: "Details", render: (r) => <span className="text-sm text-muted-foreground">{r.disposition}</span> },
  ];

  const current = performanceData[performanceData.length - 1];
  const prev = performanceData[performanceData.length - 2];
  const metricConfig = metrics.find(m => m.key === selectedMetric)!;

  const kpis = [
    { label: "Allocated", value: current.allocated, icon: Users },
    { label: "Contacted", value: current.contacted, icon: Phone },
    { label: "Contact Rate", value: `${current.contactRate}%`, icon: Target },
    { label: "STB Count", value: current.stbCount, icon: Send },
    { label: "Approved", value: current.approved, icon: CheckCircle },
    { label: "Disbursed Amt", value: `₹${(current.disbursedAmount / 100000).toFixed(1)}L`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MIS & Reports</h1>
          <p className="text-muted-foreground text-sm">Analytics, data exports & team performance</p>
          <div className="flex items-center gap-3 mt-1.5"><ScopeChip /><LastUpdated /></div>
          <p className="text-[11px] text-muted-foreground italic mt-1">Manual call activity is self-reported by users.</p>
        </div>
        <Button onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export Report</Button>
      </div>

      <ExportConfirmationDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        reportName="MIS — Call Activity"
        scope="My Team"
        fields={["Customer Name", "Phone", "Disposition", "Notes", "Date"]}
        onExport={() => {}}
      />

      <Tabs defaultValue="mis">
        <TabsList>
          <TabsTrigger value="mis">MIS Reports</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="mis" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Lead Count (Last 14 Days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dateWise}>
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(221, 83%, 25%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Audit Trail (Recent Actions)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ConfigurableTable tableId="reports-audit" columns={columns} data={auditData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map(k => (
              <Card key={k.label}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <k.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{k.label}</span>
                  </div>
                  <div className="text-xl font-bold">{k.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Monthly Trend</CardTitle>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {metrics.map(m => <SelectItem key={m.key} value={m.key} className="text-xs">{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px dashed hsl(var(--border))" }} />
                  <Line type="monotone" dataKey={selectedMetric} stroke={metricConfig.color} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Month</th>
                      <th className="text-right p-2 font-medium">Allocated</th>
                      <th className="text-right p-2 font-medium">Contacted</th>
                      <th className="text-right p-2 font-medium">Contact %</th>
                      <th className="text-right p-2 font-medium">STB</th>
                      <th className="text-right p-2 font-medium">STB %</th>
                      <th className="text-right p-2 font-medium">Approved</th>
                      <th className="text-right p-2 font-medium">Disbursed</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                      <th className="text-right p-2 font-medium">F/U Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map(m => (
                      <tr key={m.month} className="border-b hover:bg-accent/50">
                        <td className="p-2 font-medium">{m.month}</td>
                        <td className="p-2 text-right">{m.allocated}</td>
                        <td className="p-2 text-right">{m.contacted}</td>
                        <td className="p-2 text-right">{m.contactRate}%</td>
                        <td className="p-2 text-right">{m.stbCount}</td>
                        <td className="p-2 text-right">{m.stbRate}%</td>
                        <td className="p-2 text-right">{m.approved}</td>
                        <td className="p-2 text-right">{m.disbursedCount}</td>
                        <td className="p-2 text-right">₹{(m.disbursedAmount / 100000).toFixed(1)}L</td>
                        <td className="p-2 text-right">{m.followUpCompliance}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
