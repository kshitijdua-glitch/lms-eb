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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Target, Flag, MessageSquare, X, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type TLFlag = { type: string; label: string; addedAt: string };
type TLNote = { id: string; text: string; createdAt: string };

const FLAG_TYPES = [
  { value: "on_leave", label: "On Leave" },
  { value: "performance_watch", label: "Performance Watch" },
  { value: "disposition_quality", label: "Disposition Quality Issue" },
  { value: "management_quality", label: "Management Quality Issue" },
  { value: "training_required", label: "Training Required" },
];

const GroupManagementPage = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [expandedTL, setExpandedTL] = useState<string | null>(null);
  const [selectedTL, setSelectedTL] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [targetScope, setTargetScope] = useState<"tl" | "agent">("tl");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const [tlNotes, setTlNotes] = useState<Record<string, TLNote[]>>({});
  const [tlFlags, setTlFlags] = useState<Record<string, TLFlag[]>>({});
  const [newNote, setNewNote] = useState("");
  const [newFlag, setNewFlag] = useState("");
  const [targetCalls, setTargetCalls] = useState("50");
  const [targetFUs, setTargetFUs] = useState("30");
  const [targetSTBs, setTargetSTBs] = useState("10");
  const [targetLeads, setTargetLeads] = useState("80");

  const tlData = teams.map(t => {
    const tl = agents.find(a => a.id === t.tlId);
    const tLeads = getLeadsForTeam(t.id);
    const teamAgentsArr = getAgentsForTeam(t.id).filter(a => a.id !== t.tlId);
    const workedToday = tLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length;
    const missedFUs = tLeads.filter(l => l.followUps.some(f => f.status === "missed")).length;
    const fuCompliance = tLeads.length > 0
      ? Math.round(((tLeads.length - missedFUs) / tLeads.length) * 100) : 100;
    const stb = tLeads.filter(l => l.stbSubmissions.length > 0).length;
    const disbursed = tLeads.filter(l => l.stage === "disbursed").length;
    const loggedIn = workedToday > 0;
    const lastActivity = tLeads.length > 0
      ? new Date(Math.max(...tLeads.map(l => new Date(l.lastActivityAt).getTime()))).toLocaleDateString() : "—";

    const agentBreakdown = teamAgentsArr.map(a => {
      const aLeads = tLeads.filter(l => l.assignedAgentId === a.id);
      return {
        ...a,
        leadsCount: aLeads.length,
        workedToday: aLeads.filter(l => l.lastActivityAt.split("T")[0] === today).length,
        callsToday: aLeads.reduce((s, l) => s + l.callLogs.filter(c => c.timestamp.split("T")[0] === today).length, 0),
        missedFUs: aLeads.filter(l => l.followUps.some(f => f.status === "missed")).length,
        stb: aLeads.filter(l => l.stbSubmissions.length > 0).length,
        disbursed: aLeads.filter(l => l.stage === "disbursed").length,
        loggedIn: aLeads.some(l => l.lastActivityAt.split("T")[0] === today),
      };
    });

    return {
      id: t.id, name: t.name, tlId: t.tlId, tlName: tl?.name || "—",
      agentCount: teamAgentsArr.length, leadsCount: tLeads.length,
      workedToday, loggedIn, missedFUs, fuCompliance, stb, disbursed, lastActivity,
      agents: agentBreakdown,
    };
  });

  const handleAddNote = () => {
    if (!selectedTL || !newNote.trim()) return;
    setTlNotes(prev => ({
      ...prev,
      [selectedTL]: [
        { id: `note-${Date.now()}`, text: newNote, createdAt: new Date().toISOString() },
        ...(prev[selectedTL] || []),
      ],
    }));
    setNewNote("");
    toast.success("Note added");
  };

  const handleAddFlag = () => {
    if (!selectedTL || !newFlag) return;
    const label = FLAG_TYPES.find(f => f.value === newFlag)?.label || newFlag;
    setTlFlags(prev => ({
      ...prev,
      [selectedTL]: [...(prev[selectedTL] || []), { type: newFlag, label, addedAt: new Date().toISOString() }],
    }));
    setNewFlag("");
    toast.success(`Flag "${label}" added`);
  };

  const handleRemoveFlag = (flagType: string) => {
    if (!selectedTL) return;
    setTlFlags(prev => ({
      ...prev,
      [selectedTL]: (prev[selectedTL] || []).filter(f => f.type !== flagType),
    }));
    toast.info("Flag removed");
  };

  const handleSaveTargets = () => {
    toast.success(`Targets saved`);
    setShowTargets(false);
  };

  const currentTLData = tlData.find(t => t.tlId === selectedTL);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Group Management</h1>
        <p className="text-muted-foreground text-sm">{teams.length} teams · {agents.filter(a => a.tlId).length} agents</p>
      </div>

      {/* Team Overview Table */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Team Overview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Worked Today</TableHead>
                <TableHead>Missed F/U</TableHead>
                <TableHead>F/U Compliance</TableHead>
                <TableHead>STB</TableHead>
                <TableHead>Disbursed</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tlData.map(tl => {
                const flags = tlFlags[tl.tlId] || [];
                const isExpanded = expandedTL === tl.id;
                return (
                  <>
                    <TableRow key={tl.id}>
                      <TableCell className="cursor-pointer" onClick={() => setExpandedTL(isExpanded ? null : tl.id)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${tl.loggedIn ? "bg-success" : "bg-destructive"}`} />
                          <div>
                            <span className="font-medium text-sm">{tl.tlName}</span>
                            <span className="text-xs text-muted-foreground ml-1">({tl.name})</span>
                          </div>
                        </div>
                        {flags.length > 0 && (
                          <div className="flex gap-1 mt-1 ml-4">
                            {flags.map(f => <Badge key={f.type} variant="outline" className="text-[9px]">{f.label}</Badge>)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tl.loggedIn ? "default" : "secondary"} className="text-[10px]">
                          {tl.loggedIn ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{tl.agentCount}</TableCell>
                      <TableCell>{tl.leadsCount}</TableCell>
                      <TableCell>{tl.workedToday}</TableCell>
                      <TableCell>
                        {tl.missedFUs > 0 ? <Badge variant="destructive" className="text-[10px]">{tl.missedFUs}</Badge> : "0"}
                      </TableCell>
                      <TableCell>
                        <span className={tl.fuCompliance >= 90 ? "text-success" : tl.fuCompliance >= 70 ? "text-warning" : "text-destructive"}>
                          {tl.fuCompliance}%
                        </span>
                      </TableCell>
                      <TableCell>{tl.stb}</TableCell>
                      <TableCell>{tl.disbursed}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tl.lastActivity}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedTL(tl.tlId); setTargetScope("tl"); setShowTargets(true); }}>
                            <Target className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedTL(tl.tlId); setShowProfile(true); }}>
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => navigate(`/group-leads?tl=${tl.tlId}`)}>
                            Leads
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Agent Breakdown */}
                    {isExpanded && tl.agents.map(a => (
                      <TableRow key={a.id} className="bg-muted/30">
                        <TableCell></TableCell>
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${a.loggedIn ? "bg-success" : "bg-muted-foreground"}`} />
                            <span className="text-sm">{a.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.loggedIn ? "default" : "secondary"} className="text-[10px]">
                            {a.loggedIn ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{a.leadsCount}</TableCell>
                        <TableCell>{a.workedToday}</TableCell>
                        <TableCell>
                          {a.missedFUs > 0 ? <Badge variant="destructive" className="text-[10px]">{a.missedFUs}</Badge> : "0"}
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{a.stb}</TableCell>
                        <TableCell>{a.disbursed}</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => { setSelectedAgent(a.id); setTargetScope("agent"); setShowTargets(true); }}>
                            <Target className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
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
              Set {targetScope === "tl" ? "Team" : "Agent"} Targets — {
                targetScope === "tl" ? currentTLData?.tlName : agents.find(a => a.id === selectedAgent)?.name
              }
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

      {/* TL Profile / Notes / Flags Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>TL Profile — {currentTLData?.tlName}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Flags */}
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-1"><Flag className="h-3 w-3" /> Flags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(tlFlags[selectedTL || ""] || []).map(f => (
                  <Badge key={f.type} variant="outline" className="text-xs flex items-center gap-1">
                    {f.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFlag(f.type)} />
                  </Badge>
                ))}
                {(tlFlags[selectedTL || ""] || []).length === 0 && <span className="text-xs text-muted-foreground">No flags</span>}
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
                {(tlNotes[selectedTL || ""] || []).map(n => (
                  <div key={n.id} className="p-2 rounded border text-xs">
                    <p>{n.text}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()} · Manager</span>
                  </div>
                ))}
                {(tlNotes[selectedTL || ""] || []).length === 0 && <p className="text-xs text-muted-foreground">No notes yet</p>}
              </div>
            </div>

            {/* Quick Stats */}
            {currentTLData && (
              <div>
                <Label className="text-sm font-medium mb-2">Team Stats</Label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Leads", value: currentTLData.leadsCount },
                    { label: "STB", value: currentTLData.stb },
                    { label: "Disbursed", value: currentTLData.disbursed },
                    { label: "Agents", value: currentTLData.agentCount },
                    { label: "F/U Compliance", value: `${currentTLData.fuCompliance}%` },
                    { label: "Missed F/U", value: currentTLData.missedFUs },
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
