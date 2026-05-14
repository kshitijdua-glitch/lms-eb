import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { leads, agents, teams, getLeadsForTeam, getAgentsForTeam } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Target, Flag, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";

type AgentFlag = { type: string; label: string; addedAt: string };
type AgentNote = { id: string; text: string; createdAt: string };

const FLAG_TYPES = [
  { value: "on_leave", label: "On Leave" },
  { value: "performance_watch", label: "Performance Watch" },
  { value: "disposition_quality", label: "Disposition Quality Issue" },
  { value: "training_required", label: "Training Required" },
  { value: "top_performer", label: "Top Performer" },
];

type AgentRow = {
  id: string; name: string; teamName: string; leadsCount: number;
  workedToday: number; callsToday: number; missedFUs: number;
  stb: number; disbursed: number; loggedIn: boolean; lastActivity: string;
};

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
  const [targetSLPs, setTargetSLPs] = useState("10");
  const [targetLeads, setTargetLeads] = useState("80");

  const agentData: AgentRow[] = useMemo(() => {
    return agents.map(a => {
      const aLeads = leads.filter(l => l.assignedAgentId === a.id);
      return {
        id: a.id, name: a.name, teamName: a.teamName,
        leadsCount: aLeads.length,
        workedToday: aLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length,
        callsToday: aLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0),
        missedFUs: aLeads.filter(l => l.followUps.some(f => f.status === "missed")).length,
        stb: aLeads.filter(l => l.stbSubmissions.length > 0).length,
        disbursed: aLeads.filter(l => l.stage === "disbursed").length,
        loggedIn: aLeads.some(l => l.lastActivityAt.split("T")[0] === today),
        lastActivity: aLeads.length > 0 ? new Date(Math.max(...aLeads.map(l => new Date(l.lastActivityAt).getTime()))).toLocaleDateString() : "—",
      };
    });
  }, [today]);

  const handleAddNote = () => {
    if (!selectedAgent || !newNote.trim()) return;
    setAgentNotes(prev => ({ ...prev, [selectedAgent]: [{ id: `note-${Date.now()}`, text: newNote, createdAt: new Date().toISOString() }, ...(prev[selectedAgent] || [])] }));
    setNewNote("");
    toast.success("Note added");
  };

  const handleAddFlag = () => {
    if (!selectedAgent || !newFlag) return;
    const label = FLAG_TYPES.find(f => f.value === newFlag)?.label || newFlag;
    setAgentFlags(prev => ({ ...prev, [selectedAgent]: [...(prev[selectedAgent] || []), { type: newFlag, label, addedAt: new Date().toISOString() }] }));
    setNewFlag("");
    toast.success(`Flag "${label}" added`);
  };

  const handleRemoveFlag = (flagType: string) => {
    if (!selectedAgent) return;
    setAgentFlags(prev => ({ ...prev, [selectedAgent]: (prev[selectedAgent] || []).filter(f => f.type !== flagType) }));
    toast.info("Flag removed");
  };

  const handleSaveTargets = () => {
    toast.success(`Targets saved for ${agents.find(a => a.id === selectedAgent)?.name}`);
    setShowTargets(false);
  };

  const currentAgent = agentData.find(a => a.id === selectedAgent);

  const columns: ColumnDef<AgentRow>[] = [
    { id: "agent", label: "Agent", render: (a) => (
      <div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${a.loggedIn ? "bg-success" : "bg-destructive"}`} />
          <span className="font-medium text-sm">{a.name}</span>
        </div>
        {(agentFlags[a.id] || []).length > 0 && (
          <div className="flex gap-1 mt-1 ml-4">
            {(agentFlags[a.id] || []).map(f => <Badge key={f.type} variant="outline" className="text-[9px]">{f.label}</Badge>)}
          </div>
        )}
      </div>
    )},
    { id: "team", label: "Team", hidden: true, render: (a) => <span className="text-xs text-muted-foreground">{a.teamName}</span> },
    { id: "status", label: "Status", render: (a) => <Badge variant={a.loggedIn ? "default" : "secondary"} className="text-[10px]">{a.loggedIn ? "Active" : "Inactive"}</Badge> },
    { id: "leads", label: "Leads", render: (a) => <span>{a.leadsCount}</span> },
    { id: "workedToday", label: "Worked Today", render: (a) => <span>{a.workedToday}</span> },
    { id: "callsToday", label: "Calls Today", render: (a) => <span>{a.callsToday}</span> },
    { id: "missedFU", label: "Missed F/U", render: (a) => a.missedFUs > 0 ? <Badge variant="destructive" className="text-[10px]">{a.missedFUs}</Badge> : <span>0</span> },
    { id: "stb", label: "SLP", render: (a) => <span>{a.stb}</span> },
    { id: "disbursed", label: "Disbursed", render: (a) => <span>{a.disbursed}</span> },
    { id: "lastActivity", label: "Last Activity", render: (a) => <span className="text-xs text-muted-foreground">{a.lastActivity}</span> },
    { id: "actions", label: "Actions", locked: "end", render: (a) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedAgent(a.id); setShowTargets(true); }}><Target className="h-3 w-3" /></Button>
        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedAgent(a.id); setShowProfile(true); }}><MessageSquare className="h-3 w-3" /></Button>
        <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => navigate(`/group-leads?agent=${a.id}`)}>Leads</Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Group Management</h1>
        <p className="text-muted-foreground text-sm">{agents.length} agents across {teams.length} teams</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Agent Overview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ConfigurableTable tableId="group-mgmt" columns={columns} data={agentData} />
        </CardContent>
      </Card>

      <Dialog open={showTargets} onOpenChange={setShowTargets}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Agent Targets — {agents.find(a => a.id === selectedAgent)?.name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Calls</Label><Input type="number" value={targetCalls} onChange={e => setTargetCalls(e.target.value)} /></div>
            <div><Label>Follow-Ups</Label><Input type="number" value={targetFUs} onChange={e => setTargetFUs(e.target.value)} /></div>
            <div><Label>SLPs</Label><Input type="number" value={targetSLPs} onChange={e => setTargetSLPs(e.target.value)} /></div>
            <div><Label>Leads to Work</Label><Input type="number" value={targetLeads} onChange={e => setTargetLeads(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTargets(false)}>Cancel</Button>
            <Button onClick={handleSaveTargets}>Save Targets</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Agent Profile — {currentAgent?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-1"><Flag className="h-3 w-3" /> Flags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(agentFlags[selectedAgent || ""] || []).map(f => (
                  <Badge key={f.type} variant="outline" className="text-xs flex items-center gap-1">
                    {f.label}<X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFlag(f.type)} />
                  </Badge>
                ))}
                {(agentFlags[selectedAgent || ""] || []).length === 0 && <span className="text-xs text-muted-foreground">No flags</span>}
              </div>
              <div className="flex gap-2">
                <Select value={newFlag} onValueChange={setNewFlag}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Add flag" /></SelectTrigger>
                  <SelectContent>{FLAG_TYPES.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs" onClick={handleAddFlag}>Add</Button>
              </div>
            </div>
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
            {currentAgent && (
              <div>
                <Label className="text-sm font-medium mb-2">Agent Stats</Label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Leads", value: currentAgent.leadsCount },
                    { label: "SLP", value: currentAgent.stb },
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
