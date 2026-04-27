import { useParams, useNavigate } from "react-router-dom";
import { leads, getLeadsForAgent, getDispositionLabel, getStageLabel, getProductLabel, dispositionGroups, lendingPartners, getAgentsForTeam, agents, teams } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { usePriorityConfig } from "@/contexts/PriorityConfigContext";
import { calculatePriorityScore, calculatePriority } from "@/utils/priorityEngine";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft, Phone, Send, Calculator, Clock, AlertTriangle,
  User, Edit2, Lock, FileText, Shield, CalendarIcon, Shuffle, Search, ChevronLeft, ChevronRight, RefreshCw,
  Building2, StickyNote, Plus, X, IndianRupee, Percent, CalendarDays, TrendingDown
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { getLeadLockState, can } from "@/lib/permissions";

// Soft pill color map — clean tinted backgrounds for status chips
const SOFT_PILL: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border border-blue-100",
  contacted: "bg-amber-50 text-amber-700 border border-amber-100",
  interested: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  bank_selected: "bg-violet-50 text-violet-700 border border-violet-100",
  stb_submitted: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  declined: "bg-rose-50 text-rose-700 border border-rose-100",
  disbursed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  closed_lost: "bg-slate-100 text-slate-600 border border-slate-200",
  hot: "bg-rose-50 text-rose-700 border border-rose-100",
  warm: "bg-amber-50 text-amber-700 border border-amber-100",
  cold: "bg-cyan-50 text-cyan-700 border border-cyan-100",
  submitted: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  missed: "bg-rose-50 text-rose-700 border border-rose-100",
};
const SoftPill = ({ tone, children, className }: { tone: string; children: React.ReactNode; className?: string }) => (
  <span className={cn(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium",
    SOFT_PILL[tone] || "bg-slate-100 text-slate-700 border border-slate-200",
    className,
  )}>
    {children}
  </span>
);

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const { config } = usePriorityConfig();
  const { logAudit } = useAudit();
  const lead = leads.find(l => l.id === id);
  const [showCallLog, setShowCallLog] = useState(false);
  const [showEMI, setShowEMI] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [reassignAgent, setReassignAgent] = useState("");
  const [reassignTL, setReassignTL] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [emiAmount, setEmiAmount] = useState("500000");
  const [emiRate, setEmiRate] = useState("12");
  const [emiTenure, setEmiTenure] = useState("36");
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editCreditScore, setEditCreditScore] = useState(lead?.creditScore?.toString() || "");
  const [selectedPairs, setSelectedPairs] = useState<Array<{partnerId: string, partnerName: string, productType: string}>>(
    lead?.selectedBanks?.map(b => ({ partnerId: b.partnerId, partnerName: b.partnerName, productType: b.productType })) || []
  );
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  // Call log form state
  const [callDate, setCallDate] = useState<Date | undefined>(new Date());
  const [callTime, setCallTime] = useState(new Date().toTimeString().slice(0, 5));
  const [callOutcome, setCallOutcome] = useState<string>("");
  const [callDuration, setCallDuration] = useState("120");
  const [callDisposition, setCallDisposition] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callNextAction, setCallNextAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [followUpTime, setFollowUpTime] = useState("");
  const [stbSubmitted, setStbSubmitted] = useState(lead?.stbSubmissions?.length ? lead.stbSubmissions.length > 0 : false);
  const [localStbSubmissions, setLocalStbSubmissions] = useState(lead?.stbSubmissions || []);
  const [localLoans, setLocalLoans] = useState(lead?.existingLoans || []);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [newLoan, setNewLoan] = useState({ bankName: "", loanType: "", outstandingAmount: "", emi: "", tenure: "" });

  const [leadSidebarOpen, setLeadSidebarOpen] = useState(true);
  const [leadListSearch, setLeadListSearch] = useState("");
  const [priorityOverride, setPriorityOverride] = useState<string | null>(null);

  if (!lead) return <div className="p-8 text-center text-muted-foreground">Lead not found</div>;

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : leads;
  const filteredLeads = allLeads
    .filter(l => l.name.toLowerCase().includes(leadListSearch.toLowerCase()))
    .slice(0, 50);

  const daysSinceAlloc = Math.floor((Date.now() - new Date(lead.allocatedAt).getTime()) / 86400000);
  const lockState = getLeadLockState({ stbSubmissions: localStbSubmissions });
  const isProfileLocked = lockState.locked;
  const actor = buildActor(role, "agent-1");

  const emiCalc = (() => {
    const p = parseFloat(emiAmount) || 0;
    const annualRate = parseFloat(emiRate) || 0;
    const r = annualRate / 12 / 100;
    const n = parseInt(emiTenure) || 0;
    if (!p || !r || !n) return { emi: 0, totalInterest: 0, totalPayment: 0, schedule: [] as { month: number; balance: number; principalPaid: number; interestPaid: number }[] };
    const emiVal = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let balance = p;
    let cumPrincipal = 0;
    let cumInterest = 0;
    const schedule = [{ month: 0, balance: p, principalPaid: 0, interestPaid: 0 }];
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      const principal = emiVal - interest;
      balance = Math.max(0, balance - principal);
      cumPrincipal += principal;
      cumInterest += interest;
      schedule.push({ month: m, balance: Math.round(balance), principalPaid: Math.round(cumPrincipal), interestPaid: Math.round(cumInterest) });
    }
    return {
      emi: Math.round(emiVal),
      totalInterest: Math.round(cumInterest),
      totalPayment: Math.round(emiVal * n),
      schedule,
    };
  })();
  const emi = emiCalc.emi;

  const handleLogCall = () => {
    if (!callOutcome || !callDisposition) {
      toast.error("Outcome and Disposition are required");
      return;
    }
    // Validate backdating per role
    if (callDate) {
      const diff = Date.now() - callDate.getTime();
      if (diff > 24 * 3600000 && !can.backdateBeyond24h(role)) {
        toast.error("Cannot backdate call more than 24 hours");
        return;
      }
    }
    if (callNextAction === "follow_up" && !followUpDate) {
      toast.error("Follow-up date is required");
      return;
    }
    logAudit({
      ...actor,
      action: "log_call",
      entityType: "lead",
      entityId: lead.id,
      entityLabel: lead.name,
      after: {
        outcome: callOutcome,
        disposition: callDisposition,
        duration: callDuration,
        nextAction: callNextAction,
        followUpAt: followUpDate ? followUpDate.toISOString() : null,
      },
      notes: callNotes || undefined,
    });
    setShowCallLog(false);
    toast.success("Call logged successfully");
    setCallOutcome(""); setCallDisposition(""); setCallNotes(""); setCallNextAction(""); setCallDuration("120"); setFollowUpDate(undefined); setFollowUpTime("");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    logAudit({
      ...actor,
      action: "add_note",
      entityType: "lead",
      entityId: lead.id,
      entityLabel: lead.name,
      notes: newNote.trim(),
    });
    toast.success("Note added");
    setNewNote("");
  };

  const handleSaveCreditScore = () => {
    logAudit({
      ...actor,
      action: "update_credit_score",
      entityType: "lead",
      entityId: lead.id,
      entityLabel: lead.name,
      before: { creditScore: lead.creditScore },
      after: { creditScore: Number(editCreditScore) || null },
    });
    toast.success("Credit score updated");
  };


  const handleAddPair = () => {
    if (isProfileLocked) {
      toast.error("STB locked — cannot modify bank selection");
      return;
    }
    if (!selectedProduct || !selectedBank) {
      toast.error("Select both product and bank");
      return;
    }
    const partner = lendingPartners.find(lp => lp.id === selectedBank);
    if (!partner) return;
    const exists = selectedPairs.some(p => p.partnerId === selectedBank && p.productType === selectedProduct);
    if (exists) {
      toast.error("This product + bank combination already added");
      return;
    }
    setSelectedPairs([...selectedPairs, { partnerId: partner.id, partnerName: partner.name, productType: selectedProduct }]);
    setSelectedProduct("");
    setSelectedBank("");
    logAudit({
      ...actor,
      action: "select_bank",
      entityType: "lead",
      entityId: lead.id,
      entityLabel: lead.name,
      after: { partner: partner.name, product: selectedProduct },
    });
    toast.success("Bank added");
  };

  const handleRemovePair = (index: number) => {
    if (isProfileLocked) {
      toast.error("STB locked — cannot remove bank");
      return;
    }
    const removed = selectedPairs[index];
    setSelectedPairs(selectedPairs.filter((_, i) => i !== index));
    logAudit({
      ...actor,
      action: "remove_bank",
      entityType: "lead",
      entityId: lead.id,
      entityLabel: lead.name,
      before: { partner: removed?.partnerName, product: removed?.productType },
    });
    toast.success("Bank removed");
  };


  const handleSendToBank = () => {
    if (isProfileLocked) {
      toast.error("STB already submitted — cannot resubmit", {
        description: lockState.reason,
      });
      return;
    }
    // Pre-STB checklist
    const checks = [];
    if (selectedPairs.length === 0) checks.push("No banks selected");

    if (checks.length > 0) {
      toast.error("Pre-STB checklist failed", { description: checks.join(", ") });
      return;
    }

    // Create STB submissions for each selected pair
    const newSubmissions = selectedPairs.map((pair, i) => ({
      id: `stb-new-${Date.now()}-${i}`,
      partnerId: pair.partnerId,
      partnerName: pair.partnerName,
      submittedAt: new Date().toISOString(),
      status: "submitted" as const,
      approvedAmount: null,
      sanctionAmount: null,
      disbursedAmount: null,
      disbursementDate: null,
      remarks: `${getProductLabel(pair.productType as any)} application`,
      integrationType: "portal" as const,
    }));

    setLocalStbSubmissions([...localStbSubmissions, ...newSubmissions]);
    setStbSubmitted(true);
    newSubmissions.forEach(s => {
      logAudit({
        ...actor,
        action: "send_to_bank",
        entityType: "stb",
        entityId: s.id,
        entityLabel: `${lead.name} → ${s.partnerName}`,
        after: { partner: s.partnerName, status: s.status },
      });
    });
    toast.success(`STB initiated for ${selectedPairs.length} bank(s)`, {
      description: selectedPairs.map(p => `${p.partnerName} (${getProductLabel(p.productType as any)})`).join(", "),
    });
  };

  // Build unified timeline
  const timelineEvents = [
    ...lead.callLogs.map(cl => ({ type: "call" as const, timestamp: cl.timestamp, data: cl })),
    ...lead.followUps.map(fu => ({ type: "followup" as const, timestamp: fu.scheduledAt, data: fu })),
    ...lead.stbSubmissions.map(s => ({ type: "stb" as const, timestamp: s.submittedAt, data: s })),
    ...(lead.notes || []).map(n => ({ type: "note" as const, timestamp: n.createdAt, data: n })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const groups = dispositionGroups();
  // Exact disposition lists per the product spec — outcome filters and orders the picker.
  const CONNECTED_TYPES = ["hot_follow_up", "warm_follow_up", "document_follow_up", "connected_interested", "connected_not_interested", "already_has_loan", "callback_requested"];
  const NOT_CONNECTED_TYPES = ["no_response", "busy", "switched_off", "invalid_number"];
  const filteredGroups = (() => {
    const allItems = groups.flatMap(g => g.items);
    if (callOutcome === "connected") {
      const items = CONNECTED_TYPES.map(t => allItems.find(i => i.type === t)).filter((i): i is NonNullable<typeof i> => !!i);
      return [{ group: "Connected dispositions", items }];
    }
    if (callOutcome === "not_connected") {
      const items = NOT_CONNECTED_TYPES.map(t => allItems.find(i => i.type === t)).filter((i): i is NonNullable<typeof i> => !!i);
      return [{ group: "Not contactable", items }];
    }
    return groups;
  })();

  return (
    <div className="flex gap-0 -m-6 min-h-screen">
      {/* Lead List Sidebar */}
      <div className={cn(
        "border-r border-border bg-card shrink-0 flex flex-col transition-all duration-200",
        leadSidebarOpen ? "w-80" : "w-12"
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {leadSidebarOpen && <span className="text-sm font-semibold">Leads</span>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLeadSidebarOpen(!leadSidebarOpen)}>
            {leadSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        {leadSidebarOpen && (
          <>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={leadListSearch}
                  onChange={e => setLeadListSearch(e.target.value)}
                  className="h-9 text-xs pl-8 bg-background"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border">
                {filteredLeads.map(l => {
                  const daysSince = Math.floor((Date.now() - new Date(l.lastActivityAt || l.allocatedAt).getTime()) / 86400000);
                  const isCurrent = l.id === id;
                  return (
                    <button
                      key={l.id}
                      className={cn(
                        "w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors relative",
                        isCurrent && "bg-primary/5"
                      )}
                      onClick={() => navigate(`/leads/${l.id}`)}
                    >
                      {isCurrent && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-foreground truncate">{l.name}</span>
                        <SoftPill tone={l.stage}>{getStageLabel(l.stage)}</SoftPill>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{getProductLabel(l.productType)}</span>
                        <span>{daysSince}d</span>
                      </div>
                    </button>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <div className="p-6 text-xs text-muted-foreground text-center">No leads found</div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-8 overflow-auto space-y-6">
      {/* Action Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Leads
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setShowCallLog(true)} className="h-9"><Phone className="h-4 w-4 mr-1.5" /> Log Call</Button>
        <Button size="sm" variant="outline" onClick={handleSendToBank} disabled={isProfileLocked} className="h-9"><Send className="h-4 w-4 mr-1.5" /> Send to Bank</Button>
        <Button size="sm" variant="outline" onClick={() => setShowEMI(true)} className="h-9"><Calculator className="h-4 w-4 mr-1.5" /> EMI Calculator</Button>
        {(role === "manager" || role === "cluster_head") && (
          <Button size="sm" variant="outline" onClick={() => setShowReassign(true)} className="h-9">
            <Shuffle className="h-4 w-4 mr-1.5" /> Reassign
          </Button>
        )}
        {(role === "manager" || role === "cluster_head") && (lead.stage === "closed_lost" || lead.stage === "declined") && (
          <Button size="sm" variant="secondary" onClick={() => setShowOverride(true)} className="h-9">
            Override
          </Button>
        )}
      </div>

      {/* STB Lock Banner */}
      {isProfileLocked && lockState.submission && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-4 py-3 flex items-start gap-3">
          <div className="h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-indigo-900">STB Locked</span>
              <SoftPill tone={lockState.submission.status === "approved" || lockState.submission.status === "disbursed" ? "completed" : lockState.submission.status === "declined" ? "missed" : "submitted"}>
                {lockState.submission.status.charAt(0).toUpperCase() + lockState.submission.status.slice(1)}
              </SoftPill>
            </div>
            <p className="text-xs text-indigo-900/80 mt-1">
              Submitted to <strong>{lockState.submission.partnerName}</strong> on {new Date(lockState.submission.submittedAt).toLocaleDateString()}.
              Profile, obligations, bank selection and resubmission are locked.
            </p>
            <p className="text-[11px] text-indigo-700 mt-1">Next: {lockState.allowedNextAction}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
            {isProfileLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            {lead.dndStatus === "dnd_registered" && <SoftPill tone="missed">DND</SoftPill>}
            {role !== "agent" && (
              <span className="text-xs text-muted-foreground">
                <span className="opacity-60">·</span> Source: <span className="font-medium text-foreground">{lead.leadSource}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SoftPill tone={lead.stage}>{getStageLabel(lead.stage)}</SoftPill>
            {(() => {
              const currentPriority = (priorityOverride || lead.priority) as "hot" | "warm" | "cold";
              const { reasons } = calculatePriorityScore(lead, config);
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="cursor-help">
                      <SoftPill tone={currentPriority}>
                        {currentPriority.charAt(0).toUpperCase() + currentPriority.slice(1)}
                        {priorityOverride && <span className="ml-1 text-[9px] opacity-70">(manual)</span>}
                      </SoftPill>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold text-xs mb-1">Priority Scoring Breakdown</p>
                    {reasons.length > 0 ? reasons.map((r, i) => (
                      <p key={i} className="text-[11px]">{r}</p>
                    )) : <p className="text-[11px] text-muted-foreground">No scoring factors matched</p>}
                  </TooltipContent>
                </Tooltip>
              );
            })()}
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => {
              const newP = calculatePriority(lead, config);
              setPriorityOverride(null);
              toast.success(`Priority recalculated: ${newP.toUpperCase()}`);
            }}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            {(role === "manager" || role === "cluster_head" || role === "data_admin") && (
              <Select value={priorityOverride || ""} onValueChange={v => { setPriorityOverride(v); toast.success(`Priority overridden to ${v.toUpperCase()}`); }}>
                <SelectTrigger className="h-7 w-24 text-[11px]">
                  <SelectValue placeholder="Override" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            )}
            <span className="text-xs text-muted-foreground ml-1">Lead ID: <span className="font-mono">{lead.id}</span></span>
          </div>
        </div>
        {(role === "agent" || role === "manager" || role === "cluster_head") && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={isProfileLocked} className="h-9">
            <Edit2 className="h-4 w-4 mr-1.5" /> {isEditing ? "Done" : "Edit"}
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <Card className="shadow-none">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-4 w-4" />
              </span>
              Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-sm">
            {(() => {
              const fields: [string, string, boolean][] = [
                ["Mobile", lead.mobile, true],
                ["PAN", lead.pan, false],
                ["DOB", new Date(lead.dob).toLocaleDateString(), true],
                ["City", lead.city, true],
                ["State", lead.state, true],
                ["PIN Code", lead.pinCode, true],
                ["Company", lead.companyName, true],
                ["Employment", lead.employmentType.replace(/_/g, " "), true],
                ["Monthly Income", `₹${lead.monthlyIncome.toLocaleString()}`, true],
                ["Obligation", `₹${lead.existingObligations.toLocaleString()}`, true],
                ["FOIR", `${lead.foir}%`, true],
                ["Product", getProductLabel(lead.productType), true],
                ["Loan Amount", `₹${lead.loanAmount.toLocaleString()}`, true],
                ["Days Since Alloc", `${daysSinceAlloc} days`, false],
              ];
              return (
                <div className="divide-y divide-border/60">
                  {fields.map(([label, value, editable]) => (
                    <div key={label} className="flex justify-between items-center px-5 py-3">
                      <span className="text-muted-foreground text-sm">{label}</span>
                      {isEditing && editable ? (
                        <Input className="w-36 h-8 text-sm" defaultValue={value} />
                      ) : (
                        <span className="font-medium text-sm text-foreground capitalize">{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
            {isEditing && (
              <div className="p-4 border-t">
                <Button className="w-full h-10" onClick={() => {
                  setIsEditing(false);
                  logAudit({ ...actor, action: "edit_profile", entityType: "lead", entityId: lead.id, entityLabel: lead.name, notes: "Profile fields edited" });
                  toast.success("Profile saved");
                }}>
                  Save
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit & Obligations + Bank Selection */}
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </span>
                Credit &amp; Obligations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Credit Score</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24 h-9 text-sm"
                      value={editCreditScore}
                      onChange={e => setEditCreditScore(e.target.value)}
                      placeholder="—"
                    />
                    <Button size="sm" className="h-9" onClick={handleSaveCreditScore}>Save</Button>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Existing Loans</div>
                {localLoans.length > 0 ? (
                  <div className="space-y-2">
                    {localLoans.map(loan => (
                      <div key={loan.id} className="p-3 rounded-lg border border-border bg-muted/30 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{loan.bankName} — {loan.loanType}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Outstanding: ₹{loan.outstandingAmount.toLocaleString()} · EMI: ₹{loan.emi.toLocaleString()} · {loan.tenure}mo
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => {
                            setLocalLoans(localLoans.filter(l => l.id !== loan.id));
                            toast.success("Loan removed");
                          }}
                          aria-label="Remove loan"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No existing loans recorded</p>
                )}
              </div>
              <Button variant="outline" className="w-full h-10 border-dashed" disabled={isProfileLocked} onClick={() => setShowAddLoan(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Existing Loan
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </span>
                Bank / NBFC Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Product Type</Label>
                  <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedBank(""); }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set(lendingPartners.filter(lp => lp.status === "active").flatMap(lp => lp.products))].map(p => (
                        <SelectItem key={p} value={p}>{getProductLabel(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bank / NBFC</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank} disabled={!selectedProduct}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={selectedProduct ? "Pick bank…" : "Pick product first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {lendingPartners
                        .filter(lp => lp.status === "active" && lp.products.includes(selectedProduct as any))
                        .map(lp => (
                          <SelectItem key={lp.id} value={lp.id}>{lp.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full h-10" onClick={handleAddPair}>
                  <Plus className="h-4 w-4 mr-1.5" /> Add
                </Button>
              </div>
              {selectedPairs.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedPairs.map((pair, i) => (
                    <span
                      key={`${pair.partnerId}-${pair.productType}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      {getProductLabel(pair.productType as any)} → {pair.partnerName}
                      <button
                        onClick={() => handleRemovePair(i)}
                        className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No banks selected yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* STB + Notes + Retry */}
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </span>
                STB Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {localStbSubmissions.length > 0 ? (
                <div className="divide-y divide-border/60 -my-1">
                  {localStbSubmissions.map(s => (
                    <div key={s.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{s.partnerName}</span>
                        <SoftPill tone={s.status === "disbursed" || s.status === "approved" ? "completed" : s.status === "declined" ? "missed" : "submitted"}>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </SoftPill>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{s.remarks || "—"}</span>
                        <span>{new Date(s.submittedAt).toLocaleDateString()}</span>
                      </div>
                      {s.sanctionAmount && <div className="text-xs">Sanction: ₹{s.sanctionAmount.toLocaleString()}</div>}
                      {s.disbursedAmount && <div className="text-xs text-success">Disbursed: ₹{s.disbursedAmount.toLocaleString()}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No STB submissions yet</p>
              )}
            </CardContent>
          </Card>

          {/* Notes (immutable timestamped) */}
          <Card className="shadow-none">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <StickyNote className="h-4 w-4" />
                </span>
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <Textarea
                placeholder="Add a note…"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="text-sm min-h-[80px] resize-none"
              />
              <Button className="w-full h-10" onClick={handleAddNote}>
                <Plus className="h-4 w-4 mr-1.5" /> Add
              </Button>
              <div className="space-y-3 max-h-64 overflow-y-auto pt-1">
                {(lead.notes || []).map(n => (
                  <div key={n.id} className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{n.text}</p>
                    <p className="text-xs text-muted-foreground">{n.agentName} · {new Date(n.createdAt).toLocaleString()}</p>
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
                {lead.retryCount >= 5 && <Badge variant="destructive" className="mt-1 text-[10px]">Escalated to Manager</Badge>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Unified History Timeline */}
      <Card className="shadow-none">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </span>
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all">
            <div className="px-5 pt-4">
              <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-border w-full justify-start rounded-none">
                {[
                  { v: "all", label: "All", count: timelineEvents.length },
                  { v: "calls", label: "Call", count: lead.callLogs.length },
                  { v: "followups", label: "Follow-up", count: lead.followUps.length },
                  { v: "stb", label: "STB", count: lead.stbSubmissions.length },
                ].map(t => (
                  <TabsTrigger
                    key={t.v}
                    value={t.v}
                    className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 -mb-px text-sm font-medium text-muted-foreground"
                  >
                    {t.label}
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground tabular-nums">
                      {String(t.count).padStart(2, "0")}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="all" className="mt-0">
              <div className="divide-y divide-border/60">
                {timelineEvents.map((ev, idx) => {
                  const iconBg = ev.type === "call" ? "bg-blue-50 text-blue-600"
                    : ev.type === "stb" ? "bg-indigo-50 text-indigo-600"
                    : ev.type === "note" ? "bg-slate-100 text-slate-600"
                    : "bg-amber-50 text-amber-600";
                  const Icon = ev.type === "call" ? Phone : ev.type === "stb" ? Send : ev.type === "note" ? StickyNote : Clock;
                  const typeLabel = ev.type === "call" ? "Call" : ev.type === "stb" ? "STB" : ev.type === "note" ? "Note" : "Follow-up";
                  const typeTone = ev.type === "call" ? "tone=\"new\"" : ev.type === "stb" ? "tone=\"submitted\"" : ev.type === "note" ? "tone=\"closed_lost\"" : "tone=\"pending\"";
                  return (
                    <div key={idx} className="flex items-start gap-4 px-5 py-4">
                      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", iconBg)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {ev.type === "call" && (() => {
                          const cl = ev.data as typeof lead.callLogs[0];
                          return <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <SoftPill tone="new">Call</SoftPill>
                              <span className="text-sm font-semibold text-foreground">{cl.outcome === "connected" ? "Connected" : "Not Connected"}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{cl.notes || getDispositionLabel(cl.disposition)}</p>
                          </>;
                        })()}
                        {ev.type === "followup" && (() => {
                          const fu = ev.data as typeof lead.followUps[0];
                          return <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <SoftPill tone="pending">Follow-up</SoftPill>
                              <span className="text-sm font-semibold text-foreground capitalize">{fu.type.replace(/_/g, " ")}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Scheduled for {new Date(fu.scheduledAt).toLocaleString()}</p>
                          </>;
                        })()}
                        {ev.type === "stb" && (() => {
                          const s = ev.data as typeof lead.stbSubmissions[0];
                          return <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <SoftPill tone="submitted">STB</SoftPill>
                              <span className="text-sm font-semibold text-foreground">{s.partnerName}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{s.remarks || "Submission update"}</p>
                          </>;
                        })()}
                        {ev.type === "note" && (() => {
                          const n = ev.data as typeof lead.notes[0];
                          return <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <SoftPill tone="closed_lost">Note</SoftPill>
                              <span className="text-sm font-semibold text-foreground">{n.text}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{n.agentName}</p>
                          </>;
                        })()}
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        {ev.type === "followup" && (() => {
                          const fu = ev.data as typeof lead.followUps[0];
                          return <SoftPill tone={fu.status === "completed" ? "completed" : fu.status === "missed" ? "missed" : "pending"}>
                            {fu.status.charAt(0).toUpperCase() + fu.status.slice(1)}
                          </SoftPill>;
                        })()}
                        {ev.type === "stb" && (() => {
                          const s = ev.data as typeof lead.stbSubmissions[0];
                          return <SoftPill tone={s.status === "approved" || s.status === "disbursed" ? "completed" : s.status === "declined" ? "missed" : "submitted"}>
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                          </SoftPill>;
                        })()}
                        {ev.type === "note" && <SoftPill tone="completed">Completed</SoftPill>}
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {new Date(ev.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {timelineEvents.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">No activity yet</div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="calls" className="mt-0">
              <div className="divide-y divide-border/60">
                {lead.callLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(cl => (
                  <div key={cl.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SoftPill tone="new">Call</SoftPill>
                        <span className="text-sm font-semibold">{cl.outcome === "connected" ? "Connected" : "Not Connected"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{cl.notes || getDispositionLabel(cl.disposition)}</p>
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums shrink-0">{new Date(cl.timestamp).toLocaleString()}</div>
                  </div>
                ))}
                {lead.callLogs.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">No calls logged</div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="followups" className="mt-0">
              <div className="divide-y divide-border/60">
                {lead.followUps.map(fu => (
                  <div key={fu.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="h-9 w-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SoftPill tone="pending">Follow-up</SoftPill>
                        <span className="text-sm font-semibold capitalize">{fu.type.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{new Date(fu.scheduledAt).toLocaleString()}</p>
                    </div>
                    <SoftPill tone={fu.status === "completed" ? "completed" : fu.status === "missed" ? "missed" : "pending"}>
                      {fu.status.charAt(0).toUpperCase() + fu.status.slice(1)}
                    </SoftPill>
                  </div>
                ))}
                {lead.followUps.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">No follow-ups</div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="stb" className="mt-0">
              <div className="divide-y divide-border/60">
                {lead.stbSubmissions.map(s => (
                  <div key={s.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Send className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SoftPill tone="submitted">STB</SoftPill>
                        <span className="text-sm font-semibold">{s.partnerName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Submitted {new Date(s.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <SoftPill tone={s.status === "approved" || s.status === "disbursed" ? "completed" : s.status === "declined" ? "missed" : "submitted"}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </SoftPill>
                  </div>
                ))}
                {lead.stbSubmissions.length === 0 && (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">No STB submissions</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Existing Loan Dialog */}
      <Dialog open={showAddLoan} onOpenChange={setShowAddLoan}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Add Existing Loan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Bank / NBFC</Label>
                <Input
                  placeholder="e.g. HDFC Bank"
                  value={newLoan.bankName}
                  onChange={e => setNewLoan({ ...newLoan, bankName: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Loan Type</Label>
                <Select value={newLoan.loanType} onValueChange={v => setNewLoan({ ...newLoan, loanType: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                    <SelectItem value="Home Loan">Home Loan</SelectItem>
                    <SelectItem value="Auto Loan">Auto Loan</SelectItem>
                    <SelectItem value="Business Loan">Business Loan</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Education Loan">Education Loan</SelectItem>
                    <SelectItem value="Gold Loan">Gold Loan</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Outstanding (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newLoan.outstandingAmount}
                  onChange={e => setNewLoan({ ...newLoan, outstandingAmount: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">EMI (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newLoan.emi}
                  onChange={e => setNewLoan({ ...newLoan, emi: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Tenure Remaining (months)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newLoan.tenure}
                  onChange={e => setNewLoan({ ...newLoan, tenure: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLoan(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!newLoan.bankName.trim() || !newLoan.loanType) {
                toast.error("Bank name and loan type are required");
                return;
              }
              const loan = {
                id: `loan-${Date.now()}`,
                bankName: newLoan.bankName.trim(),
                loanType: newLoan.loanType,
                outstandingAmount: Number(newLoan.outstandingAmount) || 0,
                emi: Number(newLoan.emi) || 0,
                tenure: Number(newLoan.tenure) || 0,
              };
              setLocalLoans([...localLoans, loan]);
              setNewLoan({ bankName: "", loanType: "", outstandingAmount: "", emi: "", tenure: "" });
              setShowAddLoan(false);
              toast.success("Loan added");
            }}>Add Loan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Select value={callOutcome} onValueChange={(v) => {
                  setCallOutcome(v);
                  setCallDisposition("");
                  if (v === "not_connected") setCallDuration("0");
                }}>
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
              <Select value={callDisposition} onValueChange={setCallDisposition} disabled={!callOutcome}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={callOutcome ? "Select disposition" : "Select outcome first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map(g => (
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
              <>
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
                <div>
                  <Label className="text-xs">Follow-Up Time (optional)</Label>
                  <Input
                    type="time"
                    value={followUpTime}
                    onChange={e => setFollowUpTime(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </>
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
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">EMI Calculator</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Estimate monthly payments and outstanding balance</p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            {/* Inputs */}
            <div className="md:col-span-2 p-6 space-y-5 border-r border-border bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5 text-muted-foreground"><IndianRupee className="h-3 w-3" /> Loan Amount</Label>
                  <span className="text-sm font-semibold tabular-nums">₹{(parseFloat(emiAmount) || 0).toLocaleString()}</span>
                </div>
                <Input type="number" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} className="h-9 text-sm" />
                <Slider value={[parseFloat(emiAmount) || 0]} min={50000} max={10000000} step={10000} onValueChange={(v) => setEmiAmount(String(v[0]))} />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>₹50K</span><span>₹1Cr</span></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5 text-muted-foreground"><Percent className="h-3 w-3" /> Interest Rate</Label>
                  <span className="text-sm font-semibold tabular-nums">{emiRate || 0}% p.a.</span>
                </div>
                <Input type="number" step="0.1" value={emiRate} onChange={e => setEmiRate(e.target.value)} className="h-9 text-sm" />
                <Slider value={[parseFloat(emiRate) || 0]} min={5} max={30} step={0.1} onValueChange={(v) => setEmiRate(String(v[0]))} />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>5%</span><span>30%</span></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-3 w-3" /> Tenure</Label>
                  <span className="text-sm font-semibold tabular-nums">{emiTenure || 0} mo</span>
                </div>
                <Input type="number" value={emiTenure} onChange={e => setEmiTenure(e.target.value)} className="h-9 text-sm" />
                <Slider value={[parseInt(emiTenure) || 0]} min={6} max={360} step={6} onValueChange={(v) => setEmiTenure(String(v[0]))} />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>6 mo</span><span>30 yr</span></div>
              </div>
            </div>

            {/* Results */}
            <div className="md:col-span-3 p-6 space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Monthly EMI</div>
                <div className="text-3xl font-bold text-primary tabular-nums mt-1">₹{emiCalc.emi.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Principal</div>
                  <div className="text-sm font-semibold tabular-nums mt-0.5">₹{(parseFloat(emiAmount) || 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Interest</div>
                  <div className="text-sm font-semibold tabular-nums mt-0.5 text-amber-600">₹{emiCalc.totalInterest.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-border p-3 col-span-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Payment</div>
                  <div className="text-sm font-semibold tabular-nums mt-0.5">₹{emiCalc.totalPayment.toLocaleString()}</div>
                </div>
              </div>

              {/* Trend chart */}
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">Outstanding Balance Over Time</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{emiCalc.schedule.length - 1} months</span>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={emiCalc.schedule} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`} width={50} />
                      <RTooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                        formatter={(val: number, name: string) => [`₹${val.toLocaleString()}`, name === "balance" ? "Balance" : name]}
                        labelFormatter={(l) => `Month ${l}`}
                      />
                      <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#balanceGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog (Manager: cross-team) */}
      <Dialog open={showReassign} onOpenChange={setShowReassign}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reassign Lead — {lead.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {lead.stbSubmissions.length > 0 && (
              <div className="p-2 rounded border border-destructive/30 text-xs text-destructive">
                ⚠ This lead has active STB submissions. Reassignment is blocked.
              </div>
            )}
            {(role === "manager" || role === "cluster_head") && (
              <div>
                <Label>Target Team</Label>
                <Select value={reassignTL} onValueChange={v => { setReassignTL(v); setReassignAgent(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select team (for cross-team)" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Assign to Agent *</Label>
              <Select value={reassignAgent} onValueChange={setReassignAgent}>
                <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  {((role === "manager" || role === "cluster_head") && reassignTL
                    ? getAgentsForTeam(reassignTL).filter(a => a.id !== lead.assignedAgentId)
                    : getAgentsForTeam(lead.assignedTeamId).filter(a => a.id !== lead.assignedAgentId)
                  ).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea placeholder="Reason for reassignment..." value={reassignReason} onChange={e => setReassignReason(e.target.value)} />
            </div>
            <div className="text-xs text-muted-foreground">
              Current Agent: {agents.find(a => a.id === lead.assignedAgentId)?.name} · Team: {teams.find(t => t.id === lead.assignedTeamId)?.name}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassign(false)}>Cancel</Button>
            <Button
              disabled={!reassignAgent || lead.stbSubmissions.length > 0}
              onClick={() => {
                toast.success(`Lead reassigned to ${agents.find(a => a.id === reassignAgent)?.name}`);
                setShowReassign(false);
                setReassignAgent(""); setReassignTL(""); setReassignReason("");
              }}
            >
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Override Dialog */}
      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent>
          <DialogHeader><DialogTitle>Override Disposition — {lead.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-2 rounded border text-xs">
              <span className="text-muted-foreground">Current Stage:</span> <strong>{getStageLabel(lead.stage)}</strong>
              <br />
              <span className="text-muted-foreground">Current Disposition:</span> <strong>{getDispositionLabel(lead.disposition)}</strong>
            </div>
            <p className="text-xs text-muted-foreground">
              Overriding will reset the lead to its previous active stage, notify the agent, and log this action in the history.
            </p>
            <div>
              <Label>Reason *</Label>
              <Textarea placeholder="Why are you overriding this disposition?" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverride(false)}>Cancel</Button>
            <Button
              disabled={!overrideReason.trim()}
              onClick={() => {
                toast.success(`Disposition overridden. Lead moved back to active stage.`);
                setShowOverride(false);
                setOverrideReason("");
              }}
            >
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
};

export default LeadDetailPage;
