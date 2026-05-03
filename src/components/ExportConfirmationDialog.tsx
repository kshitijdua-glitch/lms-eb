import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";

/** Section 12.3 — Export Confirmation Modal */
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reportName: string;
  scope: string;
  fields: string[];
  onExport: (opts: { reason: string; includePII: boolean }) => void;
}

export function ExportConfirmationDialog({ open, onOpenChange, reportName, scope, fields, onExport }: Props) {
  const { role } = useRole();
  const canExportPII = role === "data_admin" || role === "cluster_head";
  const [reason, setReason] = useState("");

  const handleExport = (includePII: boolean) => {
    if (!reason.trim()) { toast.error("Enter a reason for this export."); return; }
    onExport({ reason, includePII });
    setReason("");
    onOpenChange(false);
    toast.success(`${reportName} exported${includePII ? " with PII" : " without phone numbers"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-base">Export report?</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Row label="Report" value={reportName} />
          <Row label="Scope" value={scope} />
          <div>
            <div className="text-xs text-muted-foreground mb-1">Fields included</div>
            <div className="flex flex-wrap gap-1">
              {fields.map(f => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}
            </div>
          </div>
          <div>
            <Label className="text-xs">Reason for export *</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Monthly cluster review" className="text-sm min-h-[60px]" />
          </div>
          {!canExportPII && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldAlert className="h-3.5 w-3.5 mt-0.5" />
              <span>Your role can only export with PII masked. Phone numbers and PAN will not be included.</span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => handleExport(false)}>
            <Download className="h-4 w-4 mr-1.5" /> Export Without Phone Numbers
          </Button>
          {canExportPII && (
            <Button onClick={() => handleExport(true)}>
              <Download className="h-4 w-4 mr-1.5" /> Export Full Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
