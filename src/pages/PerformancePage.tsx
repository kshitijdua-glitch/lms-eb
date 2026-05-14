import { performanceData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Send, CheckCircle, Phone, Target } from "lucide-react";

const metrics = [
  { key: "contactRate", label: "Contact Rate %", color: "hsl(var(--primary))" },
  { key: "stbRate", label: "SLP Rate %", color: "hsl(var(--info))" },
  { key: "followUpCompliance", label: "Follow-Up Compliance %", color: "hsl(var(--success))" },
  { key: "allocated", label: "Allocated", color: "hsl(var(--warning))" },
  { key: "stbCount", label: "SLP Count", color: "hsl(var(--primary))" },
  { key: "disbursedCount", label: "Disbursed Count", color: "hsl(var(--success))" },
];

const PerformancePage = () => {
  const [selectedMetric, setSelectedMetric] = useState("contactRate");
  const current = performanceData[performanceData.length - 1];
  const prev = performanceData[performanceData.length - 2];

  const kpis = [
    { label: "Allocated", value: current.allocated, prev: prev.allocated, icon: Users },
    { label: "Contacted", value: current.contacted, prev: prev.contacted, icon: Phone },
    { label: "Contact Rate", value: `${current.contactRate}%`, prev: prev.contactRate, icon: Target },
    { label: "SLP Count", value: current.stbCount, prev: prev.stbCount, icon: Send },
    { label: "Approved", value: current.approved, prev: prev.approved, icon: CheckCircle },
    { label: "Disbursed Amt", value: `₹${(current.disbursedAmount / 100000).toFixed(1)}L`, prev: prev.disbursedAmount, icon: TrendingUp },
  ];

  const metricConfig = metrics.find(m => m.key === selectedMetric)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance History</h1>
        <p className="text-muted-foreground text-sm">Your monthly performance summary</p>
      </div>

      {/* Current Month KPIs */}
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

      {/* Trend Chart */}
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

      {/* Monthly Breakdown Table */}
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
                  <th className="text-right p-2 font-medium">SLP</th>
                  <th className="text-right p-2 font-medium">SLP %</th>
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
    </div>
  );
};

export default PerformancePage;
