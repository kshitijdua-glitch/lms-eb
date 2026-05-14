import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { useRole } from "@/contexts/RoleContext";
import { can } from "@/lib/permissions";
import { SLP_STATUS_LABELS, leadStageFromSLP, type SLPStatus } from "@/lib/slp";
import type { Lead, STBSubmission } from "@/types/lms";

/**
 * SLP Status Update — implements PRD §15 (Manager) and §10 (Cluster Head):
 *  - §15.1 allowed target statuses
 *  - §15.2 required fields per status
 *  - §15.3 effects: SLP record + lead stage + audit
 *  - §15.4 correction/override (any backward jump) — mandatory reason
 *  - §15.5 disbursal validations
 */

const ALL_TARGETS: SLPStatus[] = [
  "documents_pending", "under_review", "approved",
  "declined", "disbursed", "cancelled", "expired",
] as SLPStatus[];

/** Forward-only transition graph — Cluster Head + Manager can override via Correction toggle. */
function forwardTargets(current: SLPStatus): SLPStatus[] {
  const TERMINAL: SLPStatus[] = ["disbursed", "declined", "cancelled", "expired"] as SLPStatus[];
  if (TERMINAL.includes(current)) return [];
  switch (current) {
    case "submitted":
      return ["documents_pending", "under_review", "approved", "declined", "cancelled", "expired"] as SLPStatus[];
    case "documents_pending":
      return ["under_review", "approved", "declined", "cancelled", "expired"] as SLPStatus[];
    case "under_review":
      return ["approved", "declined", "cancelled", "expired"] as SLPStatus[];
    case "approved":
      return ["disbursed", "cancelled", "expired"] as SLPStatus[];
    default:
      return ALL_TARGETS;
  }
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export interface SLPStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Pick<Lead, "id" | "name">;
  submission: STBSubmission;
  onUpdated?: (next: STBSubmission) => void;
}

export function SLPStatusUpdateDialog({
  open, onOpenChange, lead, submission, onUpdated,
}: SLPStatusUpdateDialogProps) {
  const { role } = useRole();
  const { logAudit } = useAudit();

  const allowed = can.updateSlpStatus(role);
  const canCorrect = role === "manager" || role === "cluster_head"; // §15.4 / §10.3

  const [correctionMode, setCorrectionMode] = useState(false);
  const targets = useMemo(
    () => correctionMode ? ALL_TARGETS : forwardTargets(submission.status as SLPStatus),
    [correctionMode, submission.status],
  );

  const [status, setStatus] = useState<SLPStatus>(targets[0] ?? (submission.status as SLPStatus));
  const [sanctionAmount, setSanctionAmount] = useState<string>(submission.sanctionAmount?.toString() ?? "");
  const [approvalDate, setApprovalDate] = useState<string>(
    submission.approvalDate ? submission.approvalDate.slice(0, 10) : todayISO(),
  );
  const [disbursedAmount, setDisbursedAmount] = useState<string>(submission.disbursedAmount?.toString() ?? "");
  const [disbursementDate, setDisbursementDate] = useState<string>(
    submission.disbursementDate ? submission.disbursementDate.slice(0, 10) : todayISO(),
  );
  const [referenceId, setReferenceId] = useState<string>(submission.referenceId ?? "");
  const [reason, setReason] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(todayISO());
  const [correctionReason, setCorrectionReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setCorrectionMode(false);
    setStatus(forwardTargets(submission.status as SLPStatus)[0] ?? (submission.status as SLPStatus));
    setSanctionAmount(submission.sanctionAmount?.toString() ?? "");
    setApprovalDate(submission.approvalDate ? submission.approvalDate.slice(0, 10) : todayISO());
    setDisbursedAmount(submission.disbursedAmount?.toString() ?? "");
    setDisbursementDate(submission.disbursementDate ? submission.disbursementDate.slice(0, 10) : todayISO());
    setReferenceId(submission.referenceId ?? "");
    setReason("");
    setUpdateNote("");
    setNextFollowUpDate(todayISO());
    setCorrectionReason("");
  }, [open, submission]);

  if (!allowed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update SLP status</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Only Managers and Cluster Heads can update SLP status (PRD §15.1 / §10.1).
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /** Required-field flags by target status — PRD §15.2. */
  const req = {
    sanction: status === "approved",
    approvalDate: status === "approved",
    disbursedAmount: status === "disbursed",
    disbursementDate: status === "disbursed",
    referenceId: status === "disbursed",
    reason:
      status === "declined" || status === "cancelled" ||
      status === "expired" || status === "documents_pending",
    nextFollowUp: status === "documents_pending",
    updateNote:
      status === "under_review" || status === "approved" || status === "declined",
  };

  const validate = (): string | null => {
    if (!status) return "Pick a new status";
    if (correctionMode && !correctionReason.trim()) return "Correction reason is required (PRD §15.4)";
    if (req.sanction && !(Number(sanctionAmount) > 0)) return "Sanction amount is required";
    if (req.approvalDate && !approvalDate) return "Approval date is required";
    if (req.disbursedAmount && !(Number(disbursedAmount) > 0)) return "Disbursed amount must be > 0";
    if (req.disbursementDate) {
      if (!disbursementDate) return "Disbursement date is required";
      if (new Date(disbursementDate) > new Date()) return "Disbursement date cannot be in the future";
    }
    if (req.referenceId && !referenceId.trim()) return "Partner reference ID is required for Disbursed";
    if (req.reason && !reason.trim()) return "Reason is required";
    if (req.nextFollowUp && !nextFollowUpDate) return "Next follow-up date is required";
    if (req.updateNote && !updateNote.trim()) return "Update note is required";
    if (status === "disbursed") {
      const sanc = req.sanction ? Number(sanctionAmount) : Number(submission.sanctionAmount ?? 0);
      const dis = Number(disbursedAmount);
      if (sanc > 0 && dis > sanc) return "Disbursed amount cannot exceed sanction amount";
    }
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    const actor = buildActor(role, role === "manager" ? "mgr-1" : "ch-1");
    const next: STBSubmission = {
      ...submission,
      status,
      sanctionAmount: req.sanction ? Number(sanctionAmount) : submission.sanctionAmount,
      approvedAmount: req.sanction ? Number(sanctionAmount) : submission.approvedAmount,
      approvalDate: req.approvalDate ? new Date(approvalDate).toISOString() : submission.approvalDate,
      disbursedAmount: req.disbursedAmount ? Number(disbursedAmount) : submission.disbursedAmount,
      disbursementDate: req.disbursementDate ? new Date(disbursementDate).toISOString() : submission.disbursementDate,
      referenceId: req.referenceId ? referenceId.trim() : submission.referenceId,
      lastUpdateNote: updateNote.trim() || submission.lastUpdateNote || null,
      statusReason: req.reason ? reason.trim() : submission.statusReason ?? null,
      nextFollowUpAt: req.nextFollowUp ? new Date(nextFollowUpDate).toISOString() : submission.nextFollowUpAt ?? null,
    };

    logAudit({
      ...actor,
      action: correctionMode ? "correct_slp_status" : "update_slp_status",
      entityType: "stb",
      entityId: submission.id,
      entityLabel: `${lead.name} · ${submission.partnerName}`,
      before: { status: submission.status },
      after: {
        status,
        sanctionAmount: next.sanctionAmount,
        approvalDate: next.approvalDate,
        disbursedAmount: next.disbursedAmount,
        disbursementDate: next.disbursementDate,
        referenceId: next.referenceId,
        leadStage: leadStageFromSLP(status),
      },
      reason: correctionMode ? correctionReason.trim() : (req.reason ? reason.trim() : undefined),
      notes: updateNote.trim() || undefined,
    });

    toast.success(`SLP status updated to ${SLP_STATUS_LABELS[status] ?? status}`);
    onUpdated?.(next);
    onOpenChange(false);
  };

  const stageLabel = leadStageFromSLP(status).replace(/_/g, " ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {correctionMode ? "Correct SLP status" : "Update SLP status"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Lead</span><span className="font-medium">{lead.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Partner</span><span className="font-medium">{submission.partnerName}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current</span>
              <Badge variant="secondary" className="text-[10px]">{SLP_STATUS_LABELS[submission.status] ?? submission.status}</Badge>
            </div>
          </div>

          {canCorrect && (
            <label className="flex items-start gap-2 rounded-md border bg-amber-50 px-3 py-2 cursor-pointer">
              <Checkbox
                checked={correctionMode}
                onCheckedChange={(v) => {
                  const on = v === true;
                  setCorrectionMode(on);
                  const fresh = on ? ALL_TARGETS : forwardTargets(submission.status as SLPStatus);
                  setStatus(fresh[0] ?? (submission.status as SLPStatus));
                }}
                className="mt-0.5"
              />
              <div className="text-xs">
                <div className="font-medium text-amber-900">Correction / override (PRD §15.4)</div>
                <p className="text-amber-800 mt-0.5">Allow backward or out-of-flow status change. Reason required.</p>
              </div>
            </label>
          )}

          {targets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This submission is in a terminal state ({SLP_STATUS_LABELS[submission.status] ?? submission.status}).
              Enable Correction mode above to override.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">New status *</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SLPStatus)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {targets.map(o => (
                      <SelectItem key={o} value={o}>{SLP_STATUS_LABELS[o] ?? o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Lead stage will become <span className="font-medium">{stageLabel}</span>.
                </p>
              </div>

              {correctionMode && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Correction reason *</Label>
                  <Textarea rows={2} value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Why is this status being corrected?" />
                </div>
              )}

              {req.sanction && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sanction amount (₹) *</Label>
                    <Input type="number" inputMode="numeric" value={sanctionAmount}
                      onChange={(e) => setSanctionAmount(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Approval date *</Label>
                    <Input type="date" value={approvalDate} max={todayISO()}
                      onChange={(e) => setApprovalDate(e.target.value)} className="h-9" />
                  </div>
                </div>
              )}

              {req.disbursedAmount && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Disbursed amount (₹) *</Label>
                    <Input type="number" inputMode="numeric" value={disbursedAmount}
                      onChange={(e) => setDisbursedAmount(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Disbursement date *</Label>
                    <Input type="date" value={disbursementDate} max={todayISO()}
                      onChange={(e) => setDisbursementDate(e.target.value)} className="h-9" />
                  </div>
                </div>
              )}

              {req.referenceId && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Partner reference ID *</Label>
                  <Input value={referenceId} onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="e.g. HDFC-PL-23890123" className="h-9" />
                  <p className="text-[11px] text-muted-foreground">Loan account / application reference shared by the partner.</p>
                </div>
              )}

              {req.nextFollowUp && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Next follow-up date *</Label>
                  <Input type="date" value={nextFollowUpDate} min={todayISO()}
                    onChange={(e) => setNextFollowUpDate(e.target.value)} className="h-9" />
                </div>
              )}

              {req.reason && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {status === "declined" ? "Decline reason"
                      : status === "cancelled" ? "Cancellation reason"
                      : status === "expired" ? "Expiry reason"
                      : "Pending reason"} *
                  </Label>
                  <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}

              {req.updateNote && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Update note *</Label>
                  <Textarea rows={2} value={updateNote} onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="What changed in this update?" />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={targets.length === 0}>
            {correctionMode ? "Save correction" : "Update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
