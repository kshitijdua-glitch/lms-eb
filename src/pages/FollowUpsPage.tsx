import { leads, getLeadsForAgent, getDispositionLabel, getProductLabel } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, UserRound, Flame, Snowflake, Sun, Clock, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { cn } from "@/lib/utils";
import { getFollowUpBucket, type FollowUpBucket } from "@/lib/followUpStatus";

type FUItem = {
  id: string; scheduledAt: string; type: string; status: string; notes: string;
  leadId: string; leadName: string; leadMobile: string; priority: string;
  productType: string; allocatedAt: string; retryCount: number; disposition: string;
};

type Bucket = FollowUpBucket;
const bucketOf = getFollowUpBucket;

const PRIORITY_TONE: Record<string, { icon: typeof Flame; cls: string; label: string }> = {
  hot: { icon: Flame, cls: "bg-rose-50 text-rose-700 border-rose-100", label: "Hot" },
  warm: { icon: Sun, cls: "bg-amber-50 text-amber-700 border-amber-100", label: "Warm" },
  cold: { icon: Snowflake, cls: "bg-cyan-50 text-cyan-700 border-cyan-100", label: "Cold" },
};

const FollowUpsPage = () => {
  const { role } = useRole();
  const navigate = useNavigate();
  const { logAudit } = useAudit();
  const actor = buildActor(role, "agent-1");

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [tab, setTab] = useState<Bucket>("overdue");
  

  const allLeads = role === "agent" ? getLeadsForAgent("agent-1") : leads;

  const allFollowUps: FUItem[] = useMemo(() => {
    return allLeads.flatMap(l =>
      l.followUps.map(f => ({
        ...f, leadId: l.id, leadName: l.name, leadMobile: l.mobile,
        priority: l.priority, productType: l.productType, allocatedAt: l.allocatedAt,
        retryCount: l.retryCount, disposition: l.disposition,
      }))
    ).filter(f => {
      if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
      if (productFilter !== "all" && f.productType !== productFilter) return false;
      return true;
    });
  }, [allLeads, priorityFilter, productFilter]);

  const buckets = useMemo(() => {
    const out: Record<Bucket, FUItem[]> = { overdue: [], today: [], upcoming: [], completed: [] };
    for (const f of allFollowUps) {
      const isCompleted = f.status === "completed" || completedLocal[f.id];
      const b = isCompleted ? "completed" : bucketOf(f.scheduledAt, f.status);
      out[b].push(f);
    }
    out.overdue.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    out.today.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    out.upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return out;
  }, [allFollowUps, completedLocal]);

  const handleCall = (f: FUItem) => {
    logAudit({ ...actor, action: "call_initiated", entityType: "follow_up", entityId: f.id, entityLabel: f.leadName, after: { mobile: f.leadMobile } });
    toast.success(`Calling ${f.leadName}…`);
  };

  const handleReschedule = (f: FUItem) => {
    logAudit({ ...actor, action: "reschedule_follow_up", entityType: "follow_up", entityId: f.id, entityLabel: f.leadName, before: { scheduledAt: f.scheduledAt } });
    toast.info(`Rescheduling for ${f.leadName} — open lead detail to set new time.`);
    navigate(`/leads/${f.leadId}`);
  };

  const handleComplete = (f: FUItem) => {
    setCompletedLocal(prev => ({ ...prev, [f.id]: true }));
    logAudit({ ...actor, action: "complete_follow_up", entityType: "follow_up", entityId: f.id, entityLabel: f.leadName, after: { status: "completed" } });
    toast.success(`Follow-up marked complete for ${f.leadName}`);
  };

  const FollowUpCard = ({ f, bucket }: { f: FUItem; bucket: Bucket }) => {
    const days = Math.floor((Date.now() - new Date(f.allocatedAt).getTime()) / 86400000);
    const sched = new Date(f.scheduledAt);
    const PriBadge = PRIORITY_TONE[f.priority] ?? PRIORITY_TONE.cold;
    const PIcon = PriBadge.icon;
    const isCompleted = bucket === "completed";

    return (
      <div className="border border-border rounded-lg bg-card p-4 hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <button className="text-left min-w-0 flex-1" onClick={() => navigate(`/leads/${f.leadId}`)}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate">{f.leadName}</span>
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", PriBadge.cls)}>
                <PIcon className="h-3 w-3" /> {PriBadge.label}
              </span>
              {bucket === "overdue" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-mono">{f.leadMobile}</span>
              <span className="opacity-50">·</span>
              <Badge variant="outline" className="text-[10px] py-0">{getProductLabel(f.productType as any)}</Badge>
              <span className="opacity-50">·</span>
              <span className="capitalize">{f.type.replace(/_/g, " ")}</span>
            </div>
          </button>

          <div className="text-right shrink-0">
            <div className="text-sm font-medium tabular-nums">{sched.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
            <div className="text-[10px] text-muted-foreground">scheduled</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {days}d since alloc</span>
            <span className="opacity-50">·</span>
            <span>Retry {f.retryCount}/5</span>
            {f.retryCount >= 5 && <Badge variant="destructive" className="text-[9px]">Manager review</Badge>}
          </div>
          {!isCompleted && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCall(f)}>
                <Phone className="h-3 w-3 mr-1" /> Call
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReschedule(f)}>
                <CalendarClock className="h-3 w-3 mr-1" /> Reschedule
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={() => handleComplete(f)}>
                <Check className="h-3 w-3 mr-1" /> Complete
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Empty = ({ label }: { label: string }) => (
    <div className="border border-dashed border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
      No {label} follow-ups
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Follow-Ups</h1>
          <p className="text-sm text-muted-foreground">
            <span className="text-rose-600 font-medium">{buckets.overdue.length} overdue</span>
            <span className="opacity-50 mx-1.5">·</span>
            <span className="text-amber-600 font-medium">{buckets.today.length} today</span>
            <span className="opacity-50 mx-1.5">·</span>
            <span>{buckets.upcoming.length} upcoming</span>
            <span className="opacity-50 mx-1.5">·</span>
            <span>{buckets.completed.length} completed</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Product" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {["personal_loan","home_loan","business_loan","credit_card","loan_against_property"].map(p => (
                <SelectItem key={p} value={p}>{getProductLabel(p as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Bucket)}>
        <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-border w-full justify-start rounded-none">
          {([
            { v: "overdue", label: "Overdue", count: buckets.overdue.length },
            { v: "today", label: "Today", count: buckets.today.length },
            { v: "upcoming", label: "Upcoming", count: buckets.upcoming.length },
            { v: "completed", label: "Completed", count: buckets.completed.length },
          ] as { v: Bucket; label: string; count: number }[]).map(t => (
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

        {(["overdue", "today", "upcoming", "completed"] as Bucket[]).map(b => (
          <TabsContent key={b} value={b} className="mt-5">
            <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
              {buckets[b].length > 0
                ? buckets[b].map(f => <FollowUpCard key={f.id} f={f} bucket={b} />)
                : <div className="lg:col-span-2"><Empty label={b} /></div>}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FollowUpsPage;
