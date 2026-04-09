import { leads, getLeadsForAgent, getLeadsForTeam, getDispositionLabel, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertTriangle, Phone } from "lucide-react";
import { useState } from "react";

const FollowUpsPage = () => {
  const { role } = useRole();
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState("all");

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : role === "team_leader" ? getLeadsForTeam("team-1") : leads;
  const today = new Date().toISOString().split("T")[0];

  const followUpLeads = allLeads
    .filter(l => l.followUps.some(f => f.status === "pending" || f.status === "missed"))
    .filter(l => priorityFilter === "all" || l.priority === priorityFilter)
    .sort((a, b) => {
      const aM = a.followUps.some(f => f.status === "missed") ? 0 : 1;
      const bM = b.followUps.some(f => f.status === "missed") ? 0 : 1;
      return aM - bM;
    });

  const missed = followUpLeads.filter(l => l.followUps.some(f => f.status === "missed"));
  const pending = followUpLeads.filter(l => !l.followUps.some(f => f.status === "missed"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Follow-Ups</h1>
          <p className="text-muted-foreground text-sm">{followUpLeads.length} follow-ups pending</p>
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {missed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Missed Follow-Ups ({missed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missed.map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-destructive" />
                  <div>
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">{lead.mobile}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{getProductLabel(lead.productType)}</Badge>
                  <Badge variant={lead.priority === "hot" ? "destructive" : "secondary"} className="text-xs">{lead.priority}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" /> Upcoming Follow-Ups ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.map(lead => {
            const nextFU = lead.followUps.find(f => f.status === "pending");
            return (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">{lead.mobile}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {nextFU && <span className="text-xs text-muted-foreground">{new Date(nextFU.scheduledAt).toLocaleString()}</span>}
                  <Badge variant={lead.priority === "hot" ? "destructive" : "secondary"} className="text-xs">{lead.priority}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpsPage;
