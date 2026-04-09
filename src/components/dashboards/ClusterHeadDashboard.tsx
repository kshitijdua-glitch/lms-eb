import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leads, agents, lendingPartners } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Brain, TrendingDown, TrendingUp, BarChart3 } from "lucide-react";

export function ClusterHeadDashboard() {
  const [period, setPeriod] = useState("monthly");

  const sourceQuality = ["Website", "Google Ads", "Facebook", "Referral", "Partner", "Walk-in"].map(src => {
    const srcLeads = leads.filter(l => l.source === src);
    const converted = srcLeads.filter(l => ["approved", "disbursed"].includes(l.stage)).length;
    return { source: src, total: srcLeads.length, converted, rate: srcLeads.length > 0 ? Math.round((converted / srcLeads.length) * 100) : 0 };
  });

  const agentProductivity = agents.filter(a => a.status === "active" && a.leadsAssigned > 0).map(a => ({
    name: a.name.split(" ")[0],
    assigned: a.leadsAssigned,
    converted: a.leadsConverted,
    rate: Math.round((a.leadsConverted / a.leadsAssigned) * 100),
  })).sort((a, b) => b.rate - a.rate);

  const partnerDisbursal = lendingPartners.map(lp => {
    const subs = leads.flatMap(l => l.stbSubmissions).filter(s => s.partnerId === lp.id);
    const disbursed = subs.filter(s => s.status === "disbursed");
    const amount = disbursed.reduce((s, d) => s + (d.disbursedAmount || 0), 0);
    return { partner: lp.name, count: disbursed.length, amount: Math.round(amount / 100000) };
  });

  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    leads: Math.floor(Math.random() * 20) + 10,
    stb: Math.floor(Math.random() * 8) + 2,
    disbursed: Math.floor(Math.random() * 4) + 1,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cluster Head Dashboard</h1>
          <p className="text-muted-foreground">Strategic overview & analytics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg Lead Score", value: "72/100", icon: Brain, desc: "Based on conversion probability" },
          { label: "Drop-off Rate", value: "34%", icon: TrendingDown, desc: "Contacted → STB stage" },
          { label: "Disbursal Forecast", value: "₹1.2Cr", icon: TrendingUp, desc: "Next 30 days predicted" },
          { label: "Portfolio Health", value: "Good", icon: BarChart3, desc: "Based on aging & conversion" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <k.icon className="h-4 w-4 text-primary mb-1" />
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1">{k.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Source-wise Lead Quality</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sourceQuality}>
                <XAxis dataKey="source" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(214, 32%, 91%)" name="Total" />
                <Bar dataKey="converted" fill="hsl(142, 76%, 36%)" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Trend Analysis</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="hsl(221, 83%, 25%)" name="Leads" strokeWidth={2} />
                <Line type="monotone" dataKey="stb" stroke="hsl(38, 92%, 50%)" name="STB" strokeWidth={2} />
                <Line type="monotone" dataKey="disbursed" stroke="hsl(142, 76%, 36%)" name="Disbursed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Agent Productivity Ranking</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Converted</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentProductivity.map((a, i) => (
                  <TableRow key={a.name}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-right">{a.assigned}</TableCell>
                    <TableCell className="text-right">{a.converted}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={a.rate > 25 ? "default" : "secondary"}>{a.rate}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Partner-wise Disbursal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={partnerDisbursal} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="partner" fontSize={11} width={90} />
                <Tooltip formatter={(v: number) => `₹${v}L`} />
                <Bar dataKey="amount" fill="hsl(221, 83%, 25%)" radius={[0, 4, 4, 0]} name="Amount (₹L)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
