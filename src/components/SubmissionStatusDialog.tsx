import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STB_STATUS_LABELS, nextAllowedStatuses } from "@/lib/permissions";
import { useLmsData } from "@/contexts/LmsDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import type { STBStatus, STBSubmission } from "@/types/lms";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export interface SubmissionTarget extends STBSubmission {
  leadId: string;
  leadName: string;
}

interface Props {
  submission: SubmissionTarget | null;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionStatusDialog({ submission, onOpenChange }: Props) {
  const { updateSubmission } = useLmsData();
  const { role, currentAgentId } = useRole();
  const auth = useAuth();

  const options = useMemo<STBStatus[]>(
    () => (submission ? nextAllowedStatuses(submission.status) : []),
    [submission],
  );

  const [status, setStatus] = useState<STBStatus | "">("");
  const [sanction, setSanction] = useState("");
  const [disbursed, setDisbursed] = useState("");
  const [disbursementDate, setDisbursementDate] = useState("");
  const [ref, setRef] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!submission) return;
    setStatus(options[0] ?? "");
    setSanction(submission.sanctionAmount ? String(submission.sanctionAmount) : "");
    setDisbursed(submission.disbursedAmount ? String(submission.disbursedAmount) : "");
    setDisbursementDate(submission.disbursementDate ?? new Date().toISOString().slice(0, 10));
    setRef(submission.applicationRef ?? "");
    setRemarks("");
  }, [submission, options]);

  const open = !!submission;
  const needsSanction = status === "approved" || status === "disbursed";
  const needsDisbursal = status === "disbursed";

  const submit = () => {
    if (!submission || !status) return;
    if (needsSanction && (!sanction || Number(sanction) <= 0)) {
      toast.error("Enter the sanctioned amount for an approved application.");
      return;
    }
    if (needsDisbursal && (!disbursed || Number(disbursed) <= 0 || !disbursementDate)) {
      toast.error("Disbursed amount and disbursement date are required.");
      return;
    }
    if (status === "declined" && !remarks.trim()) {
      toast.error("Add a remark explaining the decline.");
      return;
    }

    updateSubmission(
      submission.leadId,
      submission.id,
      {
        status,
        sanctionAmount: needsSanction ? Number(sanction) : submission.sanctionAmount,
        approvedAmount: needsSanction ? Number(sanction) : submission.approvedAmount,
        disbursedAmount: needsDisbursal ? Number(disbursed) : submission.disbursedAmount,
        disbursementDate: needsDisbursal ? disbursementDate : submission.disbursementDate,
        applicationRef: ref || submission.applicationRef,
        remarks: remarks.trim() || submission.remarks,
      },
      {
        actorId: currentAgentId,
        actorName: auth.user?.name ?? "Internal User",
        actorRole: role,
        note: remarks.trim(),
        manual: true,
      },
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update partner status</DialogTitle>
          <DialogDescription>
            {submission ? `${submission.leadName} · ${submission.partnerName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {submission && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">Current: {STB_STATUS_LABELS[submission.status]}</Badge>
              {submission.applicationRef && <Badge variant="outline">Ref {submission.applicationRef}</Badge>}
              <Badge variant="outline" className="capitalize">{submission.integrationType}</Badge>
            </div>

            {options.length === 0 ? (
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                <span>
                  This application is in a final state ({STB_STATUS_LABELS[submission.status]}). No further status change is
                  allowed.
                </span>
              </div>
            ) : (
              <>
                {submission.integrationType === "api" && (
                  <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                    <span>
                      This is an API-integrated partner. A manual update stops automated status sync for this application and is
                      recorded as an override in the audit trail.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-status">New status</Label>
                  <Select value={status} onValueChange={v => setStatus(v as STBStatus)}>
                    <SelectTrigger id="new-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {options.map(o => (
                        <SelectItem key={o} value={o}>{STB_STATUS_LABELS[o]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {needsSanction && (
                    <div className="space-y-2">
                      <Label htmlFor="sanction">Sanctioned amount (₹)</Label>
                      <Input id="sanction" inputMode="numeric" value={sanction} onChange={e => setSanction(e.target.value.replace(/\D/g, ""))} />
                    </div>
                  )}
                  {needsDisbursal && (
                    <div className="space-y-2">
                      <Label htmlFor="disbursed">Disbursed amount (₹)</Label>
                      <Input id="disbursed" inputMode="numeric" value={disbursed} onChange={e => setDisbursed(e.target.value.replace(/\D/g, ""))} />
                    </div>
                  )}
                  {needsDisbursal && (
                    <div className="space-y-2">
                      <Label htmlFor="disb-date">Disbursement date</Label>
                      <Input id="disb-date" type="date" value={disbursementDate} onChange={e => setDisbursementDate(e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="app-ref">Partner reference</Label>
                    <Input id="app-ref" value={ref} onChange={e => setRef(e.target.value)} placeholder="e.g. HDFC-PL-99213" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks{status === "declined" && " (required)"}</Label>
                  <Textarea id="remarks" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Partner communication, reason, or next step" />
                </div>
              </>
            )}

            {(submission.statusHistory?.length ?? 0) > 0 && (
              <div className="rounded-md border border-border p-3">
                <div className="text-xs font-medium mb-2">Status history</div>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {[...(submission.statusHistory ?? [])].reverse().map((h, i) => (
                    <li key={`${h.at}-${i}`} className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{STB_STATUS_LABELS[h.status]}</span>{" "}
                      · {new Date(h.at).toLocaleString()} · {h.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!status || options.length === 0}>Save status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
