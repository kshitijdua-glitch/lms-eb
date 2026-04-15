import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { leads, agents, teams, getLeadsForTeam, getAgentsForTeam } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  { value: "top_performer", label: "Top Performer" },
];

const GroupManagementPage = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showTargets, setShowTargets] = useState(false);

  const [agentNotes, setAgentNotes] = useState<Record<string, AgentNote[]>>({});
  const [agentFlags, setAgentFlags] = useState<Record<string, AgentFlag[]>>({});
  const [newNote, setNewNote] = useState("");
  const [newFlag, setNewFlag] = useState("");
  const [targetCalls, setTargetCalls] = useState("50");
  const [targetFUs, setTargetFUs] = useState("30");
  const [targetSTBs, setTargetSTBs] = useState("10");
  const [targetLeads, setTargetLeads] = useState("80");

  // Flat agent data across all teams
  const agentData = useMemo(() => {
    return agents.map(a => {
      const aLeads = leads.filter(l => l.assignedAgentId === a.id);
      return {
        ...a,
        leadsCount: aLeads.length,
        workedToday: aLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length,
        callsToday: aLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0),
        missedFUs: aLeads.filter(l => l.followUps.some(f => f.status === "missed")).length,
        stb: aLeads.filter(l => l.stbSubmissions.length > 0).length,
        disbursed: aLeads.filter(l => l.stage === "disbursed").length,
        loggedIn: aLeads.some(l => l.lastActivityAt.split("T")[0] === today),
        lastActivity: aLeads.length > 0
          ? new Date(Math.max(...aLeads.map(l => new Date(l.lastActivityAt).getTime()))).toLocaleDateString() : "—",
      };
    });
  }, [today]);

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
      [selectedAgent]: [...(prev[selectedAgent] || []), { type: newFlag, label, addedAt: new Date().toISOString() }],
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

  const handleSaveTargets = () => {
    toast.success(`Targets saved for ${agents.find(a => a.id === selectedAgent)?.name}`);
    setShowTargets(false);
  };

  const currentAgent = agentData.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Group Management</h1>
        <p className="text-muted-foreground text-sm">{agents.length} agents across {teams.length} teams</p>
      </div>

      {/* Agent Table */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Agent Overview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Worked Today</TableHead>
                <TableHead>Calls Today</TableHead>
                <TableHead>Missed F/U</TableHead>
                <TableHead>STB</TableHead>
                <TableHead>Disbursed</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentData.map(a => {
                const flags = agentFlags[a.id] || [];
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${a.loggedIn ? "bg-success" : "bg-destructive"}`} />
                        <div>
                          <span className="font-medium text-sm">{a.name}</span>
                        </div>
                      </div>
                      {flags.length > 0 && (
                        <div className="flex gap-1 mt-1 ml-4">
                          {flags.map(f => <Badge key={f.type} variant="outline" className="text-[9px]">{f.label}</Badge>)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.teamName}</TableCell>
                    <TableCell>
                      <Badge variant={a.loggedIn ? "default" : "secondary"} className="text-[10px]">
                        {a.loggedIn ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.leadsCount}</TableCell>
                    <TableCell>{a.workedToday}</TableCell>
                    <TableCell>{a.callsToday}</TableCell>
                    <TableCell>
                      {a.missedFUs > 0 ? <Badge variant="destructive" className="text-[10px]">{a.missedFUs}</Badge> : "0"}
                    </TableCell>
                    <TableCell>{a.stb}</TableCell>
                    <TableCell>{a.disbursed}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.lastActivity}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedAgent(a.id); setShowTargets(true); }}>
                          <Target className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedAgent(a.id); setShowProfile(true); }}>
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => navigate(`/group-leads?agent=${a.id}`)}>
                          Leads
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
          <DialogHeader>
            <DialogTitle>
              Set Agent Targets — {agents.find(a => a.id === selectedAgent)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Calls</Label><Input type="number" value={targetCalls} onChange={e => setTargetCalls(e.target.value)} /></div>
            <div><Label>Follow-Ups</Label><Input type="number" value={targetFUs} onChange={e => setTargetFUs(e.target.value)} /></div>
            <div><Label>STBs</Label><Input type="number" value={targetSTBs} onChange={e => setTargetSTBs(e.target.value)} /></div>
            <div><Label>Leads to Work</Label><Input type="number" value={targetLeads} onChange={e => setTargetLeads(e.target.value)} /></div>
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
                    <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()} · Manager</span>
                  </div>
                ))}
                {(agentNotes[selectedAgent || ""] || []).length === 0 && <p className="text-xs text-muted-foreground">No notes yet</p>}
              </div>
            </div>

            {/* Quick Stats */}
            {currentAgent && (
              <div>
                <Label className="text-sm font-medium mb-2">Agent Stats</Label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Leads", value: currentAgent.leadsCount },
                    { label: "STB", value: currentAgent.stb },
                    { label: "Disbursed", value: currentAgent.disbursed },
                    { label: "Calls Today", value: currentAgent.callsToday },
                    { label: "Worked Today", value: currentAgent.workedToday },
                    { label: "Missed F/U", value: currentAgent.missedFUs },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded border text-center">
                      <div className="font-bold">{s.value}</div>
                      <div className="text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagementPage;
