import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leads, agents, teams } from "@/data/mockData";
import { Upload, Users, Settings, FileText, Database, AlertTriangle, UserCog, BarChart3, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function AdminDashboard() {
  const navigate = useNavigate();
  const unallocated = leads.filter(l => l.stage === "new").length;
  const pendingValidation = 12; // mock
  const staleLeads = leads.filter(l => {
    const days = Math.floor((Date.now() - new Date(l.lastActivityAt).getTime()) / 86400000);
    return days > 10 && l.stage !== "disbursed" && l.stage !== "closed_lost";
  }).length;
  const activeAgents = agents.filter(a => a.status === "active").length;
  const activeTLs = 2; // mock
  const flaggedProfiles = 3; // mock

  const recentBatches = [
    { name: "Google_Ads_Apr10", date: "2026-04-10", rows: 250, valid: 238, status: "Allocated" },
    { name: "Partner_HDFC_Apr08", date: "2026-04-08", rows: 180, valid: 175, status: "Partial" },
    { name: "Website_Apr06", date: "2026-04-06", rows: 320, valid: 305, status: "Unallocated" },
    { name: "Facebook_Apr04", date: "2026-04-04", rows: 150, valid: 142, status: "Allocated" },
    { name: "IVR_Apr02", date: "2026-04-02", rows: 90, valid: 88, status: "Allocated" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Admin Dashboard</h1>
        <p className="text-muted-foreground">Data operations & system health overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Unallocated Pools", value: unallocated, color: "text-orange-600", icon: Database },
          { label: "Pending Validation", value: pendingValidation, color: "text-yellow-600", icon: AlertTriangle },
          { label: "Stale Lead Pools", value: staleLeads, color: "text-red-600", icon: AlertTriangle },
          { label: "Active Agents", value: activeAgents, color: "text-green-600", icon: Users },
          { label: "Active TLs", value: activeTLs, color: "text-blue-600", icon: UserCog },
          { label: "Flagged Profiles", value: flaggedProfiles, color: "text-red-500", icon: Shield },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <k.icon className={`h-5 w-5 mb-1 ${k.color}`} />
              <div className="text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Upload Leads", icon: Upload, path: "/admin/upload" },
          { label: "Lead Allocation", icon: Users, path: "/admin/allocation" },
          { label: "Lead Pools", icon: Database, path: "/admin/pools" },
          { label: "MIS Export", icon: BarChart3, path: "/admin/mis" },
          { label: "Staff Mgmt", icon: UserCog, path: "/admin/staff" },
          { label: "System Config", icon: Settings, path: "/system-config" },
          { label: "Audit Trail", icon: Shield, path: "/audit-trail" },
        ].map(b => (
          <Button key={b.label} variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate(b.path)}>
            <b.icon className="h-5 w-5" />
            <span className="text-xs">{b.label}</span>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Upload Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentBatches.map(b => (
              <div key={b.name} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <div>
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{b.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{b.valid}/{b.rows} valid</span>
                  <Badge variant={b.status === "Allocated" ? "default" : b.status === "Partial" ? "secondary" : "outline"} className="text-[10px]">
                    {b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
