import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { useRole } from "@/contexts/RoleContext";
import { can } from "@/lib/permissions";
import { SLP_STATUS_LABELS, leadStageFromSLP, type SLPStatus } from "@/lib/slp";
import type { Lead, STBSubmission } from "@/types/lms";

/**
 * SLP Status Update — PRD §10.4 (Manager / Cluster Head only),
 * §10.13 (required fields per status), §10.17 (status → lead stage mapping).
 */

const TERMINAL: SLPStatus[] = ["disbursed", "declined", "cancelled", "expired"] as SLPStatus[];

/** Allowed forward transitions from a given current status. */
function nextStatusOptions(current: SLPStatus): SLPStatus[] {
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
      return ["under_review", "approved", "declined"] as SLPStatus[];
  }
}

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
  const options = useMemo(() => nextStatusOptions(submission.status as SLPStatus), [submission.status]);

  const [status, setStatus] = useState<SLPStatus>(options[0] ?? (submission.status as SLPStatus));
  const [sanctionAmount, setSanctionAmount] = useState<string>(submission.sanctionAmount?.toString() ?? "");
  const [disbursedAmount, setDisbursedAmount] = useState<string>(submission.disbursedAmount?.toString() ?? "");
  const [disbursementDate, setDisbursementDate] = useState<string>(
    submission.disbursementDate ? submission.disbursementDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [remarks, setRemarks] = useState(submission.remarks ?? "");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setStatus(options[0] ?? (submission.status as SLPStatus));
      setSanctionAmount(submission.sanctionAmount?.toString() ?? "");
      setDisbursedAmount(submission.disbursedAmount?.toString() ?? "");
      setDisbursementDate(
        submission.disbursementDate ? submission.disbursementDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      );
      setRemarks(submission.remarks ?? "");
      setReason("");
    }
  }, [open, submission, options]);

  if (!allowed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update SLP status</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Only Managers and Cluster Heads can update SLP status (PRD §10.4).
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const requiresSanction = status === "approved";
  const requiresDisbursal = status === "disbursed";
  const requiresReason = status === "declined" || status === "cancelled";

  const validate = (): string | null => {
    if (!status) return "Pick a new status";
    if (requiresSanction && !(Number(sanctionAmount) > 0)) return "Sanction amount is required for Approved";
    if (requiresDisbursal) {
      if (!(Number(disbursedAmount) > 0)) return "Disbursed amount is required";
      if (!disbursementDate) return "Disbursement date is required";
    }
    if (requiresReason && !reason.trim()) return "Reason is required";
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    const actor = buildActor(role, role === "manager" ? "mgr-1" : "ch-1");
    const next: STBSubmission = {
      ...submission,
      status,
      sanctionAmount: requiresSanction ? Number(sanctionAmount) : submission.sanctionAmount,
      approvedAmount: requiresSanction ? Number(sanctionAmount) : submission.approvedAmount,
      disbursedAmount: requiresDisbursal ? Number(disbursedAmount) : submission.disbursedAmount,
      disbursementDate: requiresDisbursal ? new Date(disbursementDate).toISOString() : submission.disbursementDate,
      remarks: remarks.trim() || submission.remarks,
    };

    logAudit({
      ...actor,
      action: "update_slp_status",
      entityType: "stb",
      entityId: submission.id,
      entityLabel: `${lead.name} · ${submission.partnerName}`,
      before: { status: submission.status },
      after: {
        status,
        sanctionAmount: next.sanctionAmount,
        disbursedAmount: next.disbursedAmount,
        disbursementDate: next.disbursementDate,
        leadStage: leadStageFromSLP(status),
      },
      reason: requiresReason ? reason.trim() : undefined,
      notes: remarks.trim() || undefined,
    });

    toast.success(`SLP status updated to ${SLP_STATUS_LABELS[status] ?? status}`);
    onUpdated?.(next);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Update SLP status</DialogTitle>
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

          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This submission is in a terminal state ({SLP_STATUS_LABELS[submission.status] ?? submission.status}) and cannot be updated.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">New status *</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SLPStatus)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {options.map(o => (
                      <SelectItem key={o} value={o}>{SLP_STATUS_LABELS[o] ?? o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Lead stage will become <span className="font-medium">{leadStageFromSLP(status).replace(/_/g, " ")}</span>.
                </p>
              </div>

              {requiresSanction && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Sanction amount (₹) *</Label>
                  <Input type="number" inputMode="numeric" value={sanctionAmount}
                    onChange={(e) => setSanctionAmount(e.target.value)} className="h-9" />
                </div>
              )}

              {requiresDisbursal && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Disbursed amount (₹) *</Label>
                    <Input type="number" inputMode="numeric" value={disbursedAmount}
                      onChange={(e) => setDisbursedAmount(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Disbursement date *</Label>
                    <Input type="date" value={disbursementDate}
                      onChange={(e) => setDisbursementDate(e.target.value)} className="h-9" />
                  </div>
                </div>
              )}

              {requiresReason && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Reason *</Label>
                  <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder={status === "declined" ? "Bank decline reason" : "Cancellation reason"} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Remarks</Label>
                <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional internal note" />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={options.length === 0}>Update status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
