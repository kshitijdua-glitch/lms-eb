import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronRight, ShieldCheck, ListChecks, Send, ClipboardCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * STB Wizard — Section 6 of Frontend Change Requirements.
 * 4-step submit-to-bank flow: Eligibility → Pairs → Checklist → Review.
 */

export interface STBPair { partnerId: string; partnerName: string; productType: string }

export interface STBWizardSubmission {
  pairs: STBPair[];
  checklist: Record<string, boolean>;
  remarks: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerName: string;
  selectedPairs: STBPair[];
  creditScore: number | null;
  onSubmit: (data: STBWizardSubmission) => void;
}

const CHECKLIST_ITEMS: { id: string; label: string; required: boolean }[] = [
  { id: "kyc_verified", label: "KYC documents verified", required: true },
  { id: "income_verified", label: "Income proof verified", required: true },
  
  { id: "duplicate_checked", label: "Checked for duplicate STB in last 30 days", required: true },
  { id: "bank_eligibility", label: "Confirmed BRE eligibility per partner", required: false },
  { id: "remarks_added", label: "Added remarks for partner reviewer", required: false },
];

const STEPS = [
  { id: 1, label: "Eligibility", icon: ShieldCheck },
  { id: 2, label: "Confirm Banks", icon: ListChecks },
  { id: 3, label: "Checklist", icon: ClipboardCheck },
  { id: 4, label: "Review & Submit", icon: Send },
];

export function STBWizardDialog({ open, onOpenChange, customerName, selectedPairs, creditScore, onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState("");
  const [confirmedPairs, setConfirmedPairs] = useState<Record<string, boolean>>(
    Object.fromEntries(selectedPairs.map(p => [`${p.partnerId}-${p.productType}`, true]))
  );

  const eligibilityIssues = useMemo(() => {
    const issues: string[] = [];
    if (selectedPairs.length === 0) issues.push("No bank-product pairs selected. Add at least one before submitting.");
    if (creditScore !== null && creditScore < 600) issues.push("Credit score below 600 — partners may auto-decline.");
    return issues;
  }, [selectedPairs.length, creditScore]);

  const requiredUnchecked = CHECKLIST_ITEMS.filter(i => i.required && !checklist[i.id]);
  const activePairs = selectedPairs.filter(p => confirmedPairs[`${p.partnerId}-${p.productType}`]);

  const canProceed =
    step === 1 ? eligibilityIssues.length === 0 :
    step === 2 ? activePairs.length > 0 :
    step === 3 ? requiredUnchecked.length === 0 :
    true;

  const reset = () => { setStep(1); setChecklist({}); setRemarks(""); };

  const handleClose = (o: boolean) => { if (!o) reset(); onOpenChange(o); };

  const handleSubmit = () => {
    onSubmit({ pairs: activePairs, checklist, remarks });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Submit to Lending Partner — {customerName}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between gap-1 -mx-1 mt-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className={cn("flex flex-col items-center gap-1 flex-1", isActive && "text-primary", isDone && "text-emerald-600")}>
                  <div className={cn("h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-medium",
                    isActive ? "border-primary bg-primary/10" : isDone ? "border-emerald-500 bg-emerald-50" : "border-border bg-muted/30 text-muted-foreground")}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-[10px] font-medium text-center">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-3 min-h-[220px]">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Verifying lead is ready for partner submission.</p>
              {eligibilityIssues.length === 0 ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 mt-0.5" /> Lead passes initial eligibility checks.
                </div>
              ) : (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-1">
                  <div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" /> Resolve before continuing</div>
                  <ul className="list-disc pl-5 text-xs">
                    {eligibilityIssues.map((i, idx) => <li key={idx}>{i}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="rounded-md border border-border p-2">
                  <div className="text-muted-foreground">Credit Score</div>
                  <div className="font-medium">{creditScore ?? "—"}</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Confirm which bank-product pairs to submit.</p>
              {selectedPairs.map(p => {
                const key = `${p.partnerId}-${p.productType}`;
                return (
                  <label key={key} className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/30">
                    <Checkbox checked={confirmedPairs[key]} onCheckedChange={(v) => setConfirmedPairs(prev => ({ ...prev, [key]: !!v }))} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.partnerName}</div>
                      <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">{p.productType.replace(/_/g, " ")}</Badge>
                    </div>
                  </label>
                );
              })}
              {selectedPairs.length === 0 && <p className="text-sm text-muted-foreground italic">No pairs selected.</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Confirm pre-submission compliance items.</p>
              {CHECKLIST_ITEMS.map(item => (
                <label key={item.id} className="flex items-center gap-3 rounded-md border border-border p-2.5 cursor-pointer hover:bg-muted/30">
                  <Checkbox checked={!!checklist[item.id]} onCheckedChange={(v) => setChecklist(prev => ({ ...prev, [item.id]: !!v }))} />
                  <span className="text-sm flex-1">{item.label}</span>
                  {item.required && <Badge variant="outline" className="text-[9px]">Required</Badge>}
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-md border border-border p-3 space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Submitting to</div>
                {activePairs.map(p => (
                  <div key={`${p.partnerId}-${p.productType}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.partnerName}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{p.productType.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium">Remarks for partner (optional)</label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Customer requested fast-track…" className="mt-1 min-h-[70px] text-sm" />
              </div>
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900">
                Once submitted, the lead profile is locked. Use Manager Override to make further changes.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
          {step < 4 && (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}>
              Continue
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-1.5" /> Submit to {activePairs.length} Lending Partner{activePairs.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
