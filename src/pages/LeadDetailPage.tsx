import { useParams, useNavigate } from "react-router-dom";
import { leads, getDispositionLabel, getStageLabel, getProductLabel, dispositionGroups, lendingPartners, getAgentsForTeam, agents } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft, Phone, Send, Calculator, Clock, CheckCircle, XCircle, AlertTriangle,
  User, Edit2, Lock, FileText, Shield, CalendarIcon, Search as SearchIcon, Shuffle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const lead = leads.find(l => l.id === id);
  const [showCallLog, setShowCallLog] = useState(false);
  const [showEMI, setShowEMI] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignAgent, setReassignAgent] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [showEMI, setShowEMI] = useState(false);
  const [emiAmount, setEmiAmount] = useState("");
  const [emiRate, setEmiRate] = useState("");
  const [emiTenure, setEmiTenure] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [breMode, setBreMode] = useState<"basic" | "bureau">("basic");

  // Call log form state
  const [callDate, setCallDate] = useState<Date | undefined>(new Date());
  const [callTime, setCallTime] = useState(new Date().toTimeString().slice(0, 5));
  const [callOutcome, setCallOutcome] = useState<string>("");
  const [callDuration, setCallDuration] = useState("120");
  const [callDisposition, setCallDisposition] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callNextAction, setCallNextAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();

  if (!lead) return <div className="p-8 text-center text-muted-foreground">Lead not found</div>;

  const daysSinceAlloc = Math.floor((Date.now() - new Date(lead.allocatedAt).getTime()) / 86400000);
  const isProfileLocked = lead.stbSubmissions.length > 0;
  const bureauFreshness = lead.bureauPulledAt
    ? (Date.now() - new Date(lead.bureauPulledAt).getTime()) / 86400000 < 30 ? "Fresh" : "Stale"
    : "Not Pulled";

  const emi = emiAmount && emiRate && emiTenure ? (() => {
    const p = parseFloat(emiAmount);
    const r = parseFloat(emiRate) / 12 / 100;
    const n = parseInt(emiTenure);
    if (!p || !r || !n) return 0;
    return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  })() : 0;

  const handleLogCall = () => {
    if (!callOutcome || !callDisposition) {
      toast.error("Outcome and Disposition are required");
      return;
    }
    // Validate backdating
    if (callDate) {
      const diff = Date.now() - callDate.getTime();
      if (diff > 24 * 3600000) {
        toast.error("Cannot backdate call more than 24 hours");
        return;
      }
    }
    setShowCallLog(false);
    toast.success("Call logged successfully");
    // Reset
    setCallOutcome(""); setCallDisposition(""); setCallNotes(""); setCallNextAction(""); setCallDuration("120");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    toast.success("Note added");
    setNewNote("");
  };

  const handleCheckEligibility = () => {
    toast.success(`BRE check triggered (${breMode} mode)`);
  };

  const handleSendToBank = () => {
    // Pre-STB checklist
    const checks = [];
    if (!lead.creditScore) checks.push("Bureau report not pulled");
    if (!lead.breResult) checks.push("BRE not run");
    if (lead.consentStatus !== "received") checks.push("Customer consent not received");
    if (!lead.pan || lead.pan.includes("XXXX")) checks.push("PAN verification pending");

    if (checks.length > 0) {
      toast.error("Pre-STB checklist failed", { description: checks.join(", ") });
      return;
    }
    toast.success("STB initiated for " + lead.name);
  };

  // Build unified timeline
  const timelineEvents = [
    ...lead.callLogs.map(cl => ({ type: "call" as const, timestamp: cl.timestamp, data: cl })),
    ...lead.followUps.map(fu => ({ type: "followup" as const, timestamp: fu.scheduledAt, data: fu })),
    ...lead.stbSubmissions.map(s => ({ type: "stb" as const, timestamp: s.submittedAt, data: s })),
    ...(lead.notes || []).map(n => ({ type: "note" as const, timestamp: n.createdAt, data: n })),
    ...(lead.bureauPulledAt ? [{ type: "bureau" as const, timestamp: lead.bureauPulledAt, data: { score: lead.creditScore } }] : []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const groups = dispositionGroups();

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leads
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setShowCallLog(true)}><Phone className="h-4 w-4 mr-1" /> Log Call</Button>
        <Button size="sm" variant="outline" onClick={handleCheckEligibility}><SearchIcon className="h-4 w-4 mr-1" /> Check Eligibility</Button>
        <Button size="sm" variant="outline" onClick={handleSendToBank}><Send className="h-4 w-4 mr-1" /> Send to Bank</Button>
        <Button size="sm" variant="outline" onClick={() => setShowEMI(true)}><Calculator className="h-4 w-4 mr-1" /> EMI Calc</Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{lead.name}</h1>
            {isProfileLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            {lead.dndStatus === "dnd_registered" && <Badge variant="destructive" className="text-[10px]">DND</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{lead.id}</Badge>
            <Badge>{getStageLabel(lead.stage)}</Badge>
            <Badge variant={lead.priority === "hot" ? "destructive" : lead.priority === "warm" ? "default" : "secondary"}>
              {lead.priority.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">Source: {lead.leadSource}</span>
          </div>
        </div>
        {!isProfileLocked && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="h-4 w-4 mr-1" /> {isEditing ? "Done" : "Edit"}
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Customer Profile */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Customer Profile {isProfileLocked && <Lock className="h-3 w-3 text-muted-foreground" />}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Mobile", lead.mobile, false],
              ["PAN", lead.pan, false],
              ["DOB", new Date(lead.dob).toLocaleDateString(), true],
              ["City", lead.city, true],
              ["State", lead.state, false],
              ["PIN Code", lead.pinCode, true],
              ["Company", lead.companyName, true],
              ["Employment", lead.employmentType.replace(/_/g, " "), true],
              ["Monthly Income", `₹${lead.monthlyIncome.toLocaleString()}`, true],
              ["Obligations", `₹${lead.existingObligations.toLocaleString()}`, true],
              ["FOIR", `${lead.foir}%`, false],
              ["Product", getProductLabel(lead.productType), true],
              ["Loan Amount", `₹${lead.loanAmount.toLocaleString()}`, true],
              ["Days Since Alloc", `${daysSinceAlloc} days`, false],
            ].map(([label, value, editable]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">{label as string}{editable && !isProfileLocked ? " *" : ""}</span>
                {isEditing && editable && !isProfileLocked ? (
                  <Input className="w-28 h-6 text-xs" defaultValue={value as string} />
                ) : (
                  <span className="font-medium text-xs">{value as string}</span>
                )}
              </div>
            ))}
            {isEditing && <Button size="sm" className="w-full mt-2" onClick={() => { setIsEditing(false); toast.success("Profile saved"); }}>Save</Button>}
          </CardContent>
        </Card>

        {/* Bureau + BRE */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Bureau Report</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">Credit Score</span>
                <span className={`text-2xl font-bold ${(lead.creditScore || 0) >= 700 ? "text-success" : (lead.creditScore || 0) >= 650 ? "text-warning" : "text-destructive"}`}>
                  {lead.creditScore || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={bureauFreshness === "Fresh" ? "default" : bureauFreshness === "Stale" ? "secondary" : "destructive"} className="text-[10px]">
                  {bureauFreshness}
                </Badge>
                {lead.bureauPulledAt && <span className="text-[10px] text-muted-foreground">Pulled: {new Date(lead.bureauPulledAt).toLocaleDateString()}</span>}
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Consent SMS</span>
                <Badge variant={lead.consentStatus === "received" ? "default" : "secondary"} className="text-[10px]">
                  {lead.consentStatus.replace("_", " ")}
                </Badge>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => toast.success("Bureau pull initiated / Consent SMS sent")}>
                {lead.bureauStatus === "not_pulled" ? "Send Consent & Pull Bureau" : "Re-Pull Bureau"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">BRE Eligibility</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant={breMode === "basic" ? "default" : "outline"} className="h-6 text-[10px] px-2" onClick={() => setBreMode("basic")}>Basic</Button>
                  <Button size="sm" variant={breMode === "bureau" ? "default" : "outline"} className="h-6 text-[10px] px-2" onClick={() => setBreMode("bureau")}>Bureau</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lead.breResult ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-success flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Eligible ({lead.breResult.eligiblePartners.length})
                  </div>
                  {lead.breResult.eligiblePartners.map(p => (
                    <div key={p.partnerId} className="p-2 rounded border text-xs">
                      <div className="font-medium">{p.partnerName}</div>
                      <div className="text-muted-foreground">Up to ₹{(p.maxAmount / 100000).toFixed(1)}L @ {p.minRate}% for {p.tenure}mo</div>
                    </div>
                  ))}
                  {lead.breResult.ineligiblePartners.length > 0 && (
                    <>
                      <div className="text-xs font-medium text-destructive flex items-center gap-1 mt-2">
                        <XCircle className="h-3 w-3" /> Ineligible ({lead.breResult.ineligiblePartners.length})
                      </div>
                      {lead.breResult.ineligiblePartners.map(p => (
                        <div key={p.partnerId} className="p-2 rounded border border-destructive/20 text-xs">
                          <div className="font-medium">{p.partnerName}</div>
                          <div className="text-destructive text-[10px]">{p.reason}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-2">BRE not yet run</p>
                  <Button size="sm" onClick={handleCheckEligibility}>Run BRE Check</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* STB + Notes + Retry */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">STB Status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {lead.stbSubmissions.length > 0 ? (
                lead.stbSubmissions.map(s => (
                  <div key={s.id} className="p-2 rounded border space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-xs">{s.partnerName}</span>
                      <Badge variant={s.status === "disbursed" ? "default" : s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-[10px]">
                        {s.status}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Submitted: {new Date(s.submittedAt).toLocaleDateString()}</div>
                    {s.sanctionAmount && <div className="text-[10px]">Sanction: ₹{s.sanctionAmount.toLocaleString()}</div>}
                    {s.disbursedAmount && <div className="text-[10px] text-success">Disbursed: ₹{s.disbursedAmount.toLocaleString()}</div>}
                    {s.disbursementDate && <div className="text-[10px] text-muted-foreground">Disbursed on: {new Date(s.disbursementDate).toLocaleDateString()}</div>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No STB submissions yet</p>
              )}
            </CardContent>
          </Card>

          {/* Notes (immutable timestamped) */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Notes</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)} className="text-xs h-8" />
                <Button size="sm" className="h-8 text-xs" onClick={handleAddNote}>Add</Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(lead.notes || []).map(n => (
                  <div key={n.id} className="p-2 rounded border text-xs">
                    <p>{n.text}</p>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{n.agentName}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {lead.retryCount > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Retry Status</CardTitle></CardHeader>
              <CardContent>
                <div className="text-xs">Retry Count: <strong>{lead.retryCount}</strong>/5</div>
                {lead.retryCount >= 5 && <Badge variant="destructive" className="mt-1 text-[10px]">Escalated to TL</Badge>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Unified History Timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Activity History</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all" className="text-xs">All ({timelineEvents.length})</TabsTrigger>
              <TabsTrigger value="calls" className="text-xs">Calls ({lead.callLogs.length})</TabsTrigger>
              <TabsTrigger value="followups" className="text-xs">Follow-Ups ({lead.followUps.length})</TabsTrigger>
              <TabsTrigger value="stb" className="text-xs">STB ({lead.stbSubmissions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-3">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {timelineEvents.map((ev, idx) => (
                  <div key={idx} className="flex gap-3 p-2 rounded border text-xs">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                      ev.type === "call" ? ((ev.data as any).outcome === "connected" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")
                      : ev.type === "stb" ? "bg-primary/10 text-primary"
                      : ev.type === "bureau" ? "bg-info/10 text-info"
                      : ev.type === "note" ? "bg-muted text-muted-foreground"
                      : "bg-warning/10 text-warning"
                    }`}>
                      {ev.type === "call" ? <Phone className="h-3 w-3" /> : ev.type === "stb" ? <Send className="h-3 w-3" /> : ev.type === "bureau" ? <Shield className="h-3 w-3" /> : ev.type === "note" ? <FileText className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {ev.type === "call" && (() => {
                        const cl = ev.data as typeof lead.callLogs[0];
                        return <>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px]">Call</Badge>
                            <span className="font-medium">{cl.outcome === "connected" ? "Connected" : "Not Connected"}</span>
                            <Badge variant="outline" className="text-[9px]">{getDispositionLabel(cl.disposition)}</Badge>
                            <span className="text-muted-foreground">{Math.floor(cl.duration / 60)}m {cl.duration % 60}s</span>
                          </div>
                          <p className="text-muted-foreground mt-0.5">{cl.notes}</p>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(cl.timestamp).toLocaleString()} · {cl.agentName}</div>
                        </>;
                      })()}
                      {ev.type === "followup" && (() => {
                        const fu = ev.data as typeof lead.followUps[0];
                        return <>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[9px]">Follow-Up</Badge>
                            <span className="font-medium capitalize">{fu.type.replace(/_/g, " ")}</span>
                            <Badge variant={fu.status === "completed" ? "default" : fu.status === "missed" ? "destructive" : "secondary"} className="text-[9px]">{fu.status}</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(fu.scheduledAt).toLocaleString()}</div>
                        </>;
                      })()}
                      {ev.type === "stb" && (() => {
                        const s = ev.data as typeof lead.stbSubmissions[0];
                        return <>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[9px]">STB</Badge>
                            <span className="font-medium">{s.partnerName}</span>
                            <Badge variant={s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-[9px]">{s.status}</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(s.submittedAt).toLocaleString()}</div>
                        </>;
                      })()}
                      {ev.type === "bureau" && (
                        <>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[9px]">Bureau</Badge>
                            <span className="font-medium">Bureau Report Pulled</span>
                            <span>Score: {(ev.data as any).score}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(ev.timestamp).toLocaleString()}</div>
                        </>
                      )}
                      {ev.type === "note" && (() => {
                        const n = ev.data as typeof lead.notes[0];
                        return <>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[9px]">Note</Badge>
                            <span>{n.text}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString()} · {n.agentName}</div>
                        </>;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="calls" className="mt-3">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {lead.callLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(cl => (
                  <div key={cl.id} className="flex gap-3 p-2 rounded border text-xs">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${cl.outcome === "connected" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      <Phone className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium">{cl.outcome === "connected" ? "Connected" : "Not Connected"}</span>
                        <Badge variant="outline" className="text-[9px]">{getDispositionLabel(cl.disposition)}</Badge>
                        <span className="text-muted-foreground">{Math.floor(cl.duration / 60)}m {cl.duration % 60}s</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{cl.notes}</p>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(cl.timestamp).toLocaleString()} · {cl.agentName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="followups" className="mt-3">
              <div className="space-y-2">
                {lead.followUps.map(fu => (
                  <div key={fu.id} className="flex gap-3 p-2 rounded border text-xs">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${fu.status === "completed" ? "bg-success/10 text-success" : fu.status === "missed" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      <Clock className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium capitalize">{fu.type.replace(/_/g, " ")}</span>
                        <Badge variant={fu.status === "completed" ? "default" : fu.status === "missed" ? "destructive" : "secondary"} className="text-[9px]">{fu.status}</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(fu.scheduledAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="stb" className="mt-3">
              <div className="space-y-2">
                {lead.stbSubmissions.map(s => (
                  <div key={s.id} className="p-2 rounded border text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{s.partnerName}</span>
                      <Badge variant={s.status === "disbursed" ? "default" : s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-[9px]">{s.status}</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Submitted: {new Date(s.submittedAt).toLocaleDateString()}</div>
                    {s.sanctionAmount && <div className="text-[10px]">Sanction: ₹{s.sanctionAmount.toLocaleString()}</div>}
                    {s.disbursedAmount && <div className="text-[10px] text-success">Disbursed: ₹{s.disbursedAmount.toLocaleString()} on {s.disbursementDate ? new Date(s.disbursementDate).toLocaleDateString() : "—"}</div>}
                  </div>
                ))}
                {lead.stbSubmissions.length === 0 && <p className="text-xs text-muted-foreground">No STB submissions</p>}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Revamped Call Log Dialog */}
      <Dialog open={showCallLog} onOpenChange={setShowCallLog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Log Call — {lead.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date (max 24hr back)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-8 text-xs", !callDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {callDate ? format(callDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={callDate}
                      onSelect={setCallDate}
                      disabled={(d) => d > new Date() || d < new Date(Date.now() - 86400000)}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input type="time" value={callTime} onChange={e => setCallTime(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Outcome *</Label>
                <Select value={callOutcome} onValueChange={(v) => { setCallOutcome(v); if (v === "not_connected") setCallDuration("0"); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="not_connected">Not Connected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Duration (sec)</Label>
                <Input type="number" value={callDuration} onChange={e => setCallDuration(e.target.value)} disabled={callOutcome === "not_connected"} className="h-8 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Disposition *</Label>
              <Select value={callDisposition} onValueChange={setCallDisposition}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select disposition" /></SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectGroup key={g.group}>
                      <SelectLabel className="text-[10px] font-bold">{g.group}</SelectLabel>
                      {g.items.map(d => (
                        <SelectItem key={d.type} value={d.type} className="text-xs">{d.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea placeholder="Call notes..." value={callNotes} onChange={e => setCallNotes(e.target.value)} className="text-xs min-h-[60px]" /></div>
            <div>
              <Label className="text-xs">Next Action</Label>
              <Select value={callNextAction} onValueChange={setCallNextAction}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Schedule Follow-Up</SelectItem>
                  <SelectItem value="stb">Initiate STB</SelectItem>
                  <SelectItem value="close">Close Lead</SelectItem>
                  <SelectItem value="none">No Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {callNextAction === "follow_up" && (
              <div>
                <Label className="text-xs">Follow-Up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-8 text-xs", !followUpDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {followUpDate ? format(followUpDate, "PPP") : "Pick follow-up date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      disabled={(d) => d < new Date()}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCallLog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleLogCall}>Save Call Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMI Calculator */}
      <Dialog open={showEMI} onOpenChange={setShowEMI}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">EMI Calculator</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Loan Amount (₹)</Label><Input type="number" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} placeholder="500000" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Interest Rate (% p.a.)</Label><Input type="number" value={emiRate} onChange={e => setEmiRate(e.target.value)} placeholder="12" className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Tenure (months)</Label><Input type="number" value={emiTenure} onChange={e => setEmiTenure(e.target.value)} placeholder="36" className="h-8 text-xs" /></div>
            {emi > 0 && (
              <div className="p-3 rounded bg-primary/5 text-center">
                <div className="text-xs text-muted-foreground">Monthly EMI</div>
                <div className="text-2xl font-bold text-primary">₹{emi.toLocaleString()}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadDetailPage;
