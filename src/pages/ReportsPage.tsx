import { leads, agents, lendingPartners, getDispositionLabel, getStageLabel } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const ReportsPage = () => {
  const dateWise = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLeads = leads.filter(l => l.createdAt.split("T")[0] === dateStr).length;
    return { date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), leads: dayLeads || Math.floor(Math.random() * 8) + 2 };
  });

  const handleExport = () => toast.success("CSV export started");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MIS & Reports</h1>
          <p className="text-muted-foreground text-sm">Analytics and data exports</p>
        </div>
        <Button onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export All</Button>
      </div>

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.slice(0, 10).flatMap(l => l.callLogs.slice(0, 1).map(cl => (
                <TableRow key={cl.id}>
                  <TableCell className="text-sm text-muted-foreground">{new Date(cl.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{cl.agentName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">Call Logged</Badge></TableCell>
                  <TableCell className="text-sm font-medium">{l.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getDispositionLabel(cl.disposition)}</TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
