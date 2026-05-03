import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

/** Section 9.4 — Escalation Modal */
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadName: string;
  onSubmit: (data: { reason: string; escalateTo: string; priority: string; notes: string; dueDate: string }) => void;
}

export function EscalationDialog({ open, onOpenChange, leadName, onSubmit }: Props) {
  const [reason, setReason] = useState("");
  const [escalateTo, setEscalateTo] = useState("");
  const [priority, setPriority] = useState("high");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");

  const submit = () => {
    if (!reason) { toast.error("Pick an escalation reason"); return; }
    if (!escalateTo) { toast.error("Pick who to escalate to"); return; }
    onSubmit({ reason, escalateTo, priority, notes, dueDate });
    onOpenChange(false);
    setReason(""); setEscalateTo(""); setPriority("high"); setNotes(""); setDueDate("");
    toast.success(`Escalated ${leadName}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-base">Escalate — {leadName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_complaint">Customer complaint</SelectItem>
                <SelectItem value="urgent_callback">Urgent callback requested</SelectItem>
                <SelectItem value="not_reachable">Customer not reachable after retries</SelectItem>
                <SelectItem value="bre_failed">BRE / partner eligibility failed</SelectItem>
                <SelectItem value="manager_review">Needs manager review</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Escalate to *</Label>
            <Select value={escalateTo} onValueChange={setEscalateTo}>
              <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="team_leader">Team Leader</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="cluster_head">Cluster Head</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-sm min-h-[60px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Escalate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
