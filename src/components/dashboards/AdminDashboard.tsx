import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leads, agents, teams } from "@/data/mockData";
import { Upload, Users, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function AdminDashboard() {
  const navigate = useNavigate();
  const totalLeads = leads.length;
  const unallocated = leads.filter(l => l.stage === "new").length;
  const activeAgents = agents.filter(a => a.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: totalLeads },
          { label: "Unallocated", value: unallocated },
          { label: "Active Agents", value: activeAgents },
          { label: "Teams", value: teams.length },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/admin/upload")}>
          <Upload className="h-6 w-6" />
          <span>Upload Leads</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/admin/agents")}>
          <Users className="h-6 w-6" />
          <span>Manage Agents</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/admin/config")}>
          <Settings className="h-6 w-6" />
          <span>Configuration</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/reports")}>
          <FileText className="h-6 w-6" />
          <span>MIS & Reports</span>
        </Button>
      </div>
    </div>
  );
}
