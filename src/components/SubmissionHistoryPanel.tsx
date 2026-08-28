import { ArrowRight, Cable, Download, History, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAudit, buildActor } from "@/contexts/AuditContext";
import { useRole } from "@/contexts/RoleContext";
import { buildCsv, dateStamp, downloadCsv, type CsvColumn } from "@/lib/csv";
import { STB_STATUS_LABELS } from "@/lib/permissions";
import { can } from "@/lib/permissions";
import type { STBStatusEvent, STBSubmission } from "@/types/lms";

interface Props {
  submission: STBSubmission;
  leadName: string;
  /** Compact spacing when embedded in a table drawer. */
  dense?: boolean;
}

const inr = (v?: number | null) => (v ? `₹${Number(v).toLocaleString("en-IN")}` : "");

const sourceLabel = (s?: STBStatusEvent["source"]) =>
  s === "partner_api" ? "Partner integration" : s === "manual" ? "Manual override" : "System";

/** Full audit-style status history for one partner application. */
export const SubmissionHistoryPanel = ({ submission, leadName, dense }: Props) => {
  const { role, currentAgentId } = useRole();
  const { logAudit } = useAudit();
  const actor = buildActor(role, currentAgentId);

  const events: STBStatusEvent[] = [
    {
      status: "submitted" as const,
      at: submission.submittedAt,
      note: `Application submitted to ${submission.partnerName}`,
      source: "system" as const,
    },
    ...(submission.statusHistory ?? []),
  ].filter((e, i, arr) => i === 0 || e.at !== arr[0].at || e.status !== arr[0].status);

  const canDownload = can.exportAny(role);

  const handleDownload = () => {
    const columns: CsvColumn<STBStatusEvent>[] = [
      { key: "at", label: "Timestamp", value: e => new Date(e.at).toLocaleString("en-IN") },
      { key: "from", label: "From status", value: e => (e.previousStatus ? STB_STATUS_LABELS[e.previousStatus] : "") },
      { key: "to", label: "To status", value: e => STB_STATUS_LABELS[e.status] },
      { key: "actor", label: "Recorded by", value: e => e.actorName ?? "System" },
      { key: "role", label: "Role", value: e => e.actorRole ?? "" },
      { key: "source", label: "Source", value: e => sourceLabel(e.source) },
      { key: "sanction", label: "Sanction amount", value: e => e.sanctionAmount ?? "" },
      { key: "disbursed", label: "Disbursed amount", value: e => e.disbursedAmount ?? "" },
      { key: "ref", label: "Event ref", value: e => e.eventId ?? submission.applicationRef ?? "" },
      { key: "note", label: "Notes", value: e => e.note },
    ];
    downloadCsv(
      `audit-trail-${leadName.replace(/\s+/g, "-").toLowerCase()}-${submission.partnerName.replace(/\s+/g, "-").toLowerCase()}-${dateStamp()}`,
      buildCsv(columns, events),
    );
    logAudit({
      ...actor,
      action: "export_submission_audit_trail",
      entityType: "stb",
      entityId: submission.id,
      entityLabel: `${leadName} → ${submission.partnerName}`,
      after: { rows: events.length },
      notes: `Audit trail downloaded for application ${submission.applicationRef ?? submission.id}`,
    });
    toast.success("Audit trail downloaded", { description: `${events.length} status entries exported` });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className={dense ? "space-y-3" : "space-y-4"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4 text-muted-foreground" aria-hidden />
            Status history · {submission.partnerName}
          </div>
          {canDownload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden /> Download audit trail
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export every status change as CSV</TooltipContent>
            </Tooltip>
          )}
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No status changes recorded yet for this application.</p>
        ) : (
          <ol className="relative space-y-3 pl-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
            {[...events]
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
              .map((e, i) => (
                <li key={`${e.at}-${e.status}-${i}`} className="relative">
                  <span className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary/70 ring-2 ring-background" aria-hidden />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {e.previousStatus && (
                      <>
                        <Badge variant="outline" className="text-[10px]">{STB_STATUS_LABELS[e.previousStatus]}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden />
                      </>
                    )}
                    <Badge variant="secondary" className="text-[10px]">{STB_STATUS_LABELS[e.status]}</Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {e.source === "partner_api" ? <Cable className="h-2.5 w-2.5" aria-hidden /> : <UserCog className="h-2.5 w-2.5" aria-hidden />}
                      {sourceLabel(e.source)}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(e.at).toLocaleString("en-IN")}
                    {e.actorName ? ` · ${e.actorName}` : " · System"}
                    {e.actorRole ? ` (${e.actorRole.replace("_", " ")})` : ""}
                  </div>
                  {e.note && <p className="mt-1 text-xs text-foreground/90">{e.note}</p>}
                  {(e.sanctionAmount || e.disbursedAmount) && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {e.sanctionAmount ? `Sanction ${inr(e.sanctionAmount)}` : ""}
                      {e.sanctionAmount && e.disbursedAmount ? " · " : ""}
                      {e.disbursedAmount ? `Disbursed ${inr(e.disbursedAmount)}` : ""}
                    </p>
                  )}
                </li>
              ))}
          </ol>
        )}
      </div>
    </TooltipProvider>
  );
};
