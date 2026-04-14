import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeadsForTeam, getAgentsForTeam, agents, getDispositionLabel } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Target, Flag, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

type AgentFlag = { type: string; label: string; addedAt: string };
type AgentNote = { id: string; text: string; createdAt: string };

const FLAG_TYPES = [
  { value: "on_leave", label: "On Leave" },
  { value: "performance_watch", label: "Performance Watch" },
  { value: "disposition_quality", label: "Disposition Quality Issue" },
  { value: "training_required", label: "Training Required" },
  { value: "dnd_violation_risk", label: "DND Violation Risk" },
];

const TeamManagementPage = () => {
  const navigate = useNavigate();
  const teamLeads = getLeadsForTeam("team-1");
  const teamAgents = getAgentsForTeam("team-1").filter(a => a.id !== "agent-9");
  const today = new Date().toISOString().split("T")[0];

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showTargets, setShowTargets] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Mock targets & notes per agent
  const [agentTargets, setAgentTargets] = useState<Record<string, { calls: number; fus: number; stbs: number; leads: number }>>({});
  const [agentNotes, setAgentNotes] = useState<Record<string, AgentNote[]>>({});
  const [agentFlags, setAgentFlags] = useState<Record<string, AgentFlag[]>>({});
  const [newNote, setNewNote] = useState("");
  const [newFlag, setNewFlag] = useState("");
  const [targetCalls, setTargetCalls] = useState("15");
  const [targetFUs, setTargetFUs] = useState("10");
  const [targetSTBs, setTargetSTBs] = useState("3");
  const [targetLeads, setTargetLeads] = useState("20");

  const agentData = teamAgents.map(a => {
    const aLeads = teamLeads.filter(l => l.assignedAgentId === a.id);
    const workedToday = aLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
    const callsToday = aLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0);
    const missedFUs = aLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
    const fuCompliance = aLeads.length > 0
      ? Math.round((aLeads.filter(l => !l.followUps.some(f => f.status === "missed")).length / aLeads.length) * 100) : 100;
    const stb = aLeads.filter(l => l.stbSubmissions.length > 0).length;
    const disbursed = aLeads.filter(l => l.stage === "disbursed").length;
    const lastActivity = aLeads.length > 0
      ? new Date(Math.max(...aLeads.map(l => new Date(l.lastActivityAt).getTime()))).toLocaleDateString() : "—";
    const loggedIn = workedToday > 0 || callsToday > 0;
    const overdueLeads = aLeads.filter(l => {
      const d = Math.floor((Date.now() - new Date(l.lastActivityAt).getTime()) / 86400000);
      return d > 3 && l.stage !== "disbursed" && l.stage !== "closed_lost";
    }).length;

    return {
      ...a, leadsCount: aLeads.length, workedToday, callsToday, missedFUs,
      fuCompliance, stb, disbursed, lastActivity, loggedIn, overdueLeads,
    };
  });

  const currentAgent = agentData.find(a => a.id === selectedAgent);

  const handleSaveTargets = () => {
    if (!selectedAgent) return;
    setAgentTargets(prev => ({
      ...prev,
      [selectedAgent]: { calls: +targetCalls, fus: +targetFUs, stbs: +targetSTBs, leads: +targetLeads },
    }));
    setShowTargets(false);
    toast.success(`Targets set for ${currentAgent?.name}`);
  };

  const handleAddNote = () => {
    if (!selectedAgent || !newNote.trim()) return;
    setAgentNotes(prev => ({
      ...prev,
      [selectedAgent]: [
        { id: `note-${Date.now()}`, text: newNote, createdAt: new Date().toISOString() },
        ...(prev[selectedAgent] || []),
      ],
    }));
    setNewNote("");
    toast.success("Note added");
  };

  const handleAddFlag = () => {
    if (!selectedAgent || !newFlag) return;
    const label = FLAG_TYPES.find(f => f.value === newFlag)?.label || newFlag;
    setAgentFlags(prev => ({
      ...prev,
      [selectedAgent]: [
        ...(prev[selectedAgent] || []),
        { type: newFlag, label, addedAt: new Date().toISOString() },
      ],
    }));
    setNewFlag("");
    toast.success(`Flag "${label}" added`);
  };

  const handleRemoveFlag = (flagType: string) => {
    if (!selectedAgent) return;
    setAgentFlags(prev => ({
      ...prev,
      [selectedAgent]: (prev[selectedAgent] || []).filter(f => f.type !== flagType),
    }));
    toast.info("Flag removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="text-muted-foreground text-sm">Alpha Squad — {teamAgents.length} agents</p>
      </div>

      {/* Agent Overview Table */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Agent Overview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Worked Today</TableHead>
                <TableHead>Calls Today</TableHead>
                <TableHead>Missed F/U</TableHead>
                <TableHead>F/U Compliance</TableHead>
                <TableHead>STB</TableHead>
                <TableHead>Disbursed</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentData.map(a => {
                const flags = agentFlags[a.id] || [];
                const targets = agentTargets[a.id];
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${a.loggedIn ? "bg-success" : "bg-destructive"}`} />
                        <span className="font-medium text-sm">{a.name}</span>
                      </div>
                      {flags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {flags.map(f => (
                            <Badge key={f.type} variant="outline" className="text-[9px]">{f.label}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.loggedIn ? "default" : "secondary"} className="text-[10px]">
                        {a.loggedIn ? "Online" : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.leadsCount}</TableCell>
                    <TableCell>
                      {a.workedToday}
                      {targets && <span className="text-[10px] text-muted-foreground ml-1">/{targets.leads}</span>}
                    </TableCell>
                    <TableCell>
                      {a.callsToday}
                      {targets && <span className="text-[10px] text-muted-foreground ml-1">/{targets.calls}</span>}
                    </TableCell>
                    <TableCell>
                      {a.missedFUs > 0 ? <Badge variant="destructive" className="text-[10px]">{a.missedFUs}</Badge> : "0"}
                    </TableCell>
                    <TableCell>
                      <span className={a.fuCompliance >= 90 ? "text-success" : a.fuCompliance >= 70 ? "text-warning" : "text-destructive"}>
                        {a.fuCompliance}%
                      </span>
                    </TableCell>
                    <TableCell>{a.stb}</TableCell>
                    <TableCell>{a.disbursed}</TableCell>
                    <TableCell>
                      {a.overdueLeads > 0 ? <Badge variant="secondary" className="text-[10px]">{a.overdueLeads}</Badge> : "0"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.lastActivity}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedAgent(a.id); setShowTargets(true); }}>
                          <Target className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedAgent(a.id); setShowProfile(true); }}>
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => navigate(`/team-leads?agent=${a.id}`)}>
                          View Leads
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Set Targets Dialog */}
      <Dialog open={showTargets} onOpenChange={setShowTargets}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Daily Targets — {currentAgent?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Calls</Label><Input type="number" value={targetCalls} onChange={e => setTargetCalls(e.target.value)} /></div>
              <div><Label>Follow-Ups</Label><Input type="number" value={targetFUs} onChange={e => setTargetFUs(e.target.value)} /></div>
              <div><Label>STBs</Label><Input type="number" value={targetSTBs} onChange={e => setTargetSTBs(e.target.value)} /></div>
              <div><Label>Leads to Work</Label><Input type="number" value={targetLeads} onChange={e => setTargetLeads(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTargets(false)}>Cancel</Button>
            <Button onClick={handleSaveTargets}>Save Targets</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Profile / Notes / Flags Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Agent Profile — {currentAgent?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Flags */}
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-1"><Flag className="h-3 w-3" /> Flags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(agentFlags[selectedAgent || ""] || []).map(f => (
                  <Badge key={f.type} variant="outline" className="text-xs flex items-center gap-1">
                    {f.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFlag(f.type)} />
                  </Badge>
                ))}
                {(agentFlags[selectedAgent || ""] || []).length === 0 && <span className="text-xs text-muted-foreground">No flags</span>}
              </div>
              <div className="flex gap-2">
                <Select value={newFlag} onValueChange={setNewFlag}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Add flag" /></SelectTrigger>
                  <SelectContent>
                    {FLAG_TYPES.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs" onClick={handleAddFlag}>Add</Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Notes</Label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)} className="text-xs h-8" />
                <Button size="sm" className="h-8 text-xs" onClick={handleAddNote}>Add</Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(agentNotes[selectedAgent || ""] || []).map(n => (
                  <div key={n.id} className="p-2 rounded border text-xs">
                    <p>{n.text}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()} · TL: Priya Sharma</span>
                  </div>
                ))}
                {(agentNotes[selectedAgent || ""] || []).length === 0 && <p className="text-xs text-muted-foreground">No notes yet</p>}
              </div>
            </div>

            {/* Quick Stats */}
            {currentAgent && (
              <div>
                <Label className="text-sm font-medium mb-2">Quick Stats</Label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded border text-center">
                    <div className="font-bold">{currentAgent.leadsCount}</div>
                    <div className="text-muted-foreground">Leads</div>
                  </div>
                  <div className="p-2 rounded border text-center">
                    <div className="font-bold">{currentAgent.stb}</div>
                    <div className="text-muted-foreground">STB</div>
                  </div>
                  <div className="p-2 rounded border text-center">
                    <div className="font-bold">{currentAgent.fuCompliance}%</div>
                    <div className="text-muted-foreground">F/U Compliance</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagementPage;
