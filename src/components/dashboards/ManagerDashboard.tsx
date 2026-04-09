import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leads, lendingPartners, getStageLabel } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Send, CheckCircle } from "lucide-react";

export function ManagerDashboard() {
  const totalLeads = leads.length;
  const contacted = leads.filter(l => l.stage !== "new").length;
  const stbCount = leads.filter(l => l.stbSubmissions.length > 0).length;
  const approvedCount = leads.filter(l => l.stage === "approved" || l.stage === "disbursed").length;
  const disbursedCount = leads.filter(l => l.stage === "disbursed").length;

  const funnelData = [
    { name: "Allocated", value: totalLeads, fill: "hsl(221, 83%, 25%)" },
    { name: "Contacted", value: contacted, fill: "hsl(199, 89%, 48%)" },
    { name: "STB", value: stbCount, fill: "hsl(38, 92%, 50%)" },
    { name: "Approved", value: approvedCount, fill: "hsl(142, 76%, 36%)" },
    { name: "Disbursed", value: disbursedCount, fill: "hsl(142, 76%, 28%)" },
  ];

  const bankPipeline = lendingPartners.map(lp => {
    const subs = leads.flatMap(l => l.stbSubmissions).filter(s => s.partnerId === lp.id);
    return {
      partner: lp.name,
      submitted: subs.filter(s => s.status === "submitted").length,
      approved: subs.filter(s => s.status === "approved").length,
      disbursed: subs.filter(s => s.status === "disbursed").length,
      total: subs.length,
    };
  }).filter(b => b.total > 0);

  const approvalByPartner = lendingPartners.map(lp => {
    const subs = leads.flatMap(l => l.stbSubmissions).filter(s => s.partnerId === lp.id);
    const approved = subs.filter(s => s.status === "approved" || s.status === "disbursed").length;
    return { name: lp.name, rate: subs.length > 0 ? Math.round((approved / subs.length) * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Overall portfolio performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Leads", value: totalLeads, icon: Users },
          { label: "Contacted", value: contacted, icon: TrendingUp },
          { label: "STB Submitted", value: stbCount, icon: Send },
          { label: "Approved", value: approvedCount, icon: CheckCircle },
          { label: "Disbursed", value: disbursedCount, icon: CheckCircle },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <k.icon className="h-4 w-4 text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">{item.name}</div>
                  <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-3"
                      style={{ width: `${(item.value / totalLeads) * 100}%`, backgroundColor: item.fill }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">{item.value}</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {Math.round((item.value / totalLeads) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Approval Rate by Partner</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={approvalByPartner} layout="vertical">
                <XAxis type="number" domain={[0, 100]} fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={11} width={100} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="rate" fill="hsl(221, 83%, 25%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Bank-wise STB Pipeline</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Disbursed</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankPipeline.map(b => (
                <TableRow key={b.partner}>
                  <TableCell className="font-medium">{b.partner}</TableCell>
                  <TableCell className="text-right"><Badge variant="secondary">{b.submitted}</Badge></TableCell>
                  <TableCell className="text-right"><Badge className="bg-success text-success-foreground">{b.approved}</Badge></TableCell>
                  <TableCell className="text-right"><Badge className="bg-info text-info-foreground">{b.disbursed}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{b.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
