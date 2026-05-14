import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CallOutcome,
  OUTCOME_LABELS,
  OUTCOME_RULES,
  DISPOSITION_BY_OUTCOME,
  DISPOSITION_NOTES_REQUIRED,
  DISPOSITION_FOLLOWUP_REQUIRED,
} from "@/lib/partnerEligibility";

export interface ManualCallSubmission {
  outcome: CallOutcome;
  disposition: string;
  date: Date;
  time: string;
  durationSeconds: number;
  notes: string;
  nextAction: "follow_up" | "stb" | "close" | "none";
  followUpAt: Date | null;
  customerInterest: "high" | "medium" | "low" | "" ;
  escalate: boolean;
  backdatedReason: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  /** Pre-filled timer duration (seconds) carried over from ManualCallPanel. */
  initialDuration?: number;
  /** Last call timestamp ISO — drives duplicate-call warning. */
  lastCallAt?: string;
  /** Current user role — controls whether backdating beyond 24h is allowed. */
  canBackdateBeyond24h: boolean;
  duplicateWindowMinutes?: number;
  onSubmit: (data: ManualCallSubmission) => void;
}

const NEXT_ACTIONS = [
  { value: "follow_up", label: "Schedule Follow-Up" },
  { value: "stb", label: "Initiate Send to Lending Partner" },
  { value: "close", label: "Close Lead" },
  { value: "none", label: "No Action" },
] as const;

export function ManualCallLogDialog({
  open,
  onOpenChange,
  customerName,
  initialDuration = 0,
  lastCallAt,
  canBackdateBeyond24h,
  duplicateWindowMinutes = 30,
  onSubmit,
}: Props) {
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [outcome, setOutcome] = useState<CallOutcome | "">("");
  const [disposition, setDisposition] = useState("");
  const [duration, setDuration] = useState<string>(String(initialDuration));
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState<ManualCallSubmission["nextAction"] | "">("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [followUpTime, setFollowUpTime] = useState("");
  const [customerInterest, setCustomerInterest] = useState<ManualCallSubmission["customerInterest"]>("");
  const [escalate, setEscalate] = useState(false);
  const [backdatedReason, setBackdatedReason] = useState("");

  // Reset form whenever dialog opens
  useEffect(() => {
    if (open) {
      setDate(new Date());
      setTime(new Date().toTimeString().slice(0, 5));
      setOutcome("");
      setDisposition("");
      setDuration(String(initialDuration));
      setNotes("");
      setNextAction("");
      setFollowUpDate(undefined);
      setFollowUpTime("");
      setCustomerInterest("");
      setEscalate(false);
      setBackdatedReason("");
    }
  }, [open, initialDuration]);

  // Reset disposition when outcome changes
  useEffect(() => {
    setDisposition("");
    if (outcome === "not_connected") setDuration("0");
  }, [outcome]);

  // Auto-suggest follow-up requirement when disposition implies it
  useEffect(() => {
    if (disposition && DISPOSITION_FOLLOWUP_REQUIRED.has(disposition) && !nextAction) {
      setNextAction("follow_up");
    }
  }, [disposition]);

  const dispositions = useMemo(() => {
    if (!outcome) return [];
    return DISPOSITION_BY_OUTCOME[outcome] || [];
  }, [outcome]);

  const rule = outcome ? OUTCOME_RULES[outcome] : null;

  // Compute backdating
  const hoursBack = (Date.now() - date.getTime()) / 3_600_000;
  const isBackdated = hoursBack > 1;
  const isBackdatedBeyond24h = hoursBack > 24;

  // Duplicate-call warning
  const showDuplicateWarning = (() => {
    if (!lastCallAt) return false;
    const diffMin = (Date.now() - new Date(lastCallAt).getTime()) / 60_000;
    return diffMin >= 0 && diffMin < duplicateWindowMinutes;
  })();

  const notesRequired =
    !!rule?.notesRequired || (disposition && DISPOSITION_NOTES_REQUIRED.has(disposition));

  const followUpRequired =
    !!rule?.followUpRequired ||
    (disposition && DISPOSITION_FOLLOWUP_REQUIRED.has(disposition)) ||
    nextAction === "follow_up";

  const validate = (): string | null => {
    if (!outcome) return "Select the call outcome.";
    if (!disposition) return "Select the call disposition.";
    if (rule?.durationRequired) {
      const d = parseInt(duration);
      if (!d || d < 1) return "Start the timer or enter call duration.";
    }
    if (notesRequired && !notes.trim()) return "Add a short note for this call result.";
    if (followUpRequired) {
      if (!followUpDate) return "Choose the follow-up date and time.";
      const fu = new Date(followUpDate);
      if (followUpTime) {
        const [h, m] = followUpTime.split(":").map(Number);
        fu.setHours(h || 0, m || 0, 0, 0);
      }
      if (fu.getTime() <= Date.now()) return "Choose a future follow-up time.";
    }
    if (isBackdatedBeyond24h && !canBackdateBeyond24h) {
      return "You cannot backdate calls more than 24 hours.";
    }
    if (isBackdated && !backdatedReason.trim()) {
      return "Select a reason for logging this call later.";
    }
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const fu = followUpDate ? new Date(followUpDate) : null;
    if (fu && followUpTime) {
      const [h, m] = followUpTime.split(":").map(Number);
      fu.setHours(h || 0, m || 0, 0, 0);
    }
    onSubmit({
      outcome: outcome as CallOutcome,
      disposition,
      date,
      time,
      durationSeconds: parseInt(duration) || 0,
      notes,
      nextAction: (nextAction || "none") as ManualCallSubmission["nextAction"],
      followUpAt: fu,
      customerInterest,
      escalate,
      backdatedReason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Log Manual Call — {customerName}</DialogTitle>
        </DialogHeader>

        {/* Constraint reminder */}
        <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-900 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Manual call activity is self-reported. Outcome must reflect what actually happened. Only <strong>Not Connected</strong> outcomes increment the retry counter.</span>
        </div>

        {/* Duplicate warning */}
        {showDuplicateWarning && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>A call was already logged for this lead recently. Confirm this is a separate call before saving.</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Call date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(d) => d > new Date()}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">Call time *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          {/* Backdated reason */}
          {isBackdated && (
            <div>
              <Label className="text-xs">
                Backdated reason {isBackdatedBeyond24h && canBackdateBeyond24h && <span className="text-amber-700">(beyond 24h)</span>} *
              </Label>
              <Select value={backdatedReason} onValueChange={setBackdatedReason}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a reason for late logging" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forgot_to_log">Forgot to log earlier</SelectItem>
                  <SelectItem value="system_unavailable">System was unavailable</SelectItem>
                  <SelectItem value="recovered_from_notes">Reconstructed from offline notes</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {backdatedReason === "other" && (
                <Textarea
                  placeholder="Explain the reason"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 text-sm min-h-[60px]"
                />
              )}
              {isBackdatedBeyond24h && !canBackdateBeyond24h && (
                <p className="text-[11px] text-destructive mt-1">
                  You cannot backdate calls more than 24 hours. Ask your manager to log this on your behalf.
                </p>
              )}
            </div>
          )}

          {/* Outcome + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Outcome *</Label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as CallOutcome)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(OUTCOME_LABELS) as CallOutcome[]).map((o) => (
                    <SelectItem key={o} value={o}>
                      {OUTCOME_LABELS[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">
                Duration (sec) {rule?.durationRequired && "*"}
              </Label>
              <Input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={outcome === "not_connected"}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Disposition */}
          <div>
            <Label className="text-xs">Disposition *</Label>
            <Select value={disposition} onValueChange={setDisposition} disabled={!outcome}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={outcome ? "Select disposition" : "Select outcome first"} />
              </SelectTrigger>
              <SelectContent>
                {outcome && (
                  <SelectGroup>
                    <SelectLabel className="text-[10px] font-semibold uppercase tracking-wide">
                      {OUTCOME_LABELS[outcome as CallOutcome]}
                    </SelectLabel>
                    {dispositions.map((d) => (
                      <SelectItem key={d.type} value={d.type} className="text-sm">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Compliance warning */}
          {outcome === "compliance" && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Compliance dispositions block further outreach to this customer until reviewed by a Manager or
                Cluster Head. The lead will be flagged.
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs">
              Notes {notesRequired && "*"}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={notesRequired ? "Required for this disposition" : "Optional"}
              className="text-sm min-h-[64px]"
            />
          </div>

          {/* Customer interest — only when connected */}
          {outcome === "connected" && (
            <div>
              <Label className="text-xs">Customer interest</Label>
              <Select value={customerInterest} onValueChange={(v) => setCustomerInterest(v as any)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Next action */}
          <div>
            <Label className="text-xs">Next action *</Label>
            <Select value={nextAction} onValueChange={(v) => setNextAction(v as any)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {NEXT_ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up */}
          {(nextAction === "follow_up" || followUpRequired) && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 bg-muted/20">
              <div>
                <Label className="text-xs">Follow-up date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-sm",
                        !followUpDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {followUpDate ? format(followUpDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      disabled={(d) => d < new Date(Date.now() - 86400000)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">Follow-up time *</Label>
                <Input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Escalation toggle */}
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <Label className="text-sm">Escalation required</Label>
              <p className="text-[11px] text-muted-foreground">Notify manager about this call.</p>
            </div>
            <Switch checked={escalate} onCheckedChange={setEscalate} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Call Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
