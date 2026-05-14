import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Progressive Lead Creation — 6-step form. Step 1 saves a "lite" lead;
 * subsequent steps surface what's still missing before SLP.
 */

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existingMobiles?: string[];
  onSubmit: (data: any) => void;
}

const STEPS = [
  { id: 1, label: "Quick Capture" },
  { id: 2, label: "Location" },
  { id: 3, label: "Financial" },
  { id: 4, label: "KYC" },
  { id: 5, label: "Assignment" },
  { id: 6, label: "Review" },
];

const SOURCES = ["Website", "Google Ads", "Facebook", "Referral", "Partner", "Walk-in", "IVR", "WhatsApp"];
const PRODUCTS = [
  { v: "personal_loan", l: "Personal Loan" },
  { v: "home_loan", l: "Home Loan" },
  { v: "business_loan", l: "Business Loan" },
  { v: "credit_card", l: "Credit Card" },
  { v: "loan_against_property", l: "Loan Against Property" },
];

const TOTAL = STEPS.length;

export function CreateLeadWizard({ open, onOpenChange, existingMobiles = [], onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [d, setD] = useState<any>({
    name: "", mobile: "", altMobile: "", source: "", product: "",
    city: "", state: "", pin: "", language: "",
    income: "", loanAmount: "", employment: "", company: "",
    pan: "", dob: "",
    owner: "", priority: "warm", notes: "",
  });

  const set = (k: string, v: any) => setD((prev: any) => ({ ...prev, [k]: v }));

  const duplicate = useMemo(() => {
    if (d.mobile.length < 4) return null;
    return existingMobiles.find(m => m.endsWith(d.mobile.slice(-4)));
  }, [d.mobile, existingMobiles]);

  const missingForSTB = useMemo(() => {
    const out: string[] = [];
    if (!d.income) out.push("Income");
    if (!d.loanAmount) out.push("Loan amount");
    if (!d.employment) out.push("Employment type");
    if (!d.pan) out.push("PAN");
    return out;
  }, [d]);

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!d.name.trim()) return "Customer name is required.";
      if (!/^\d{10}$/.test(d.mobile)) return "Enter a valid 10-digit mobile number.";
      if (!d.source) return "Select a lead source.";
      if (!d.product) return "Select a product.";
    }
    if (step === 3 && d.income && Number(d.income) < 1000) return "Income looks too low.";
    if (step === 4 && d.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(d.pan)) return "PAN format invalid (e.g. ABCDE1234F).";
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep(s => Math.min(TOTAL, s + 1));
  };

  const reset = () => { setStep(1); setD({ name: "", mobile: "", altMobile: "", source: "", product: "", city: "", state: "", pin: "", language: "", income: "", loanAmount: "", employment: "", company: "", pan: "", dob: "", owner: "", priority: "warm", notes: "" }); };

  const handleSubmit = () => {
    onSubmit(d);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Create Lead — Step {step} of {TOTAL}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 -mx-1 mt-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <div key={s.id} className="flex items-center shrink-0">
                <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium",
                  active ? "bg-primary/10 text-primary" : done ? "text-emerald-700" : "text-muted-foreground")}>
                  <span className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[9px]",
                    active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-500 text-white" : "bg-muted")}>
                    {done ? <Check className="h-2.5 w-2.5" /> : s.id}
                  </span>
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />}
              </div>
            );
          })}
        </div>

        <div className="mt-3 space-y-3 min-h-[260px]">
          {step === 1 && (
            <>
              <p className="text-xs text-muted-foreground">Minimum info to save the lead. You can finish the rest later.</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer name *"><Input value={d.name} onChange={e => set("name", e.target.value)} /></Field>
                <Field label="Mobile *"><Input value={d.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit" /></Field>
                <Field label="Alternate phone"><Input value={d.altMobile} onChange={e => set("altMobile", e.target.value)} /></Field>
                <Field label="Lead source *"><PickSelect value={d.source} onChange={(v) => set("source", v)} options={SOURCES.map(s => ({ v: s, l: s }))} /></Field>
                <Field label="Product *"><PickSelect value={d.product} onChange={(v) => set("product", v)} options={PRODUCTS} /></Field>
              </div>
              {duplicate && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium">Possible duplicate found</div>
                    <div>Last 4 digits match an existing lead. Verify before continuing.</div>
                  </div>
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"><Input value={d.city} onChange={e => set("city", e.target.value)} /></Field>
              <Field label="State"><Input value={d.state} onChange={e => set("state", e.target.value)} /></Field>
              <Field label="PIN code"><Input value={d.pin} onChange={e => set("pin", e.target.value.replace(/\D/g, "").slice(0, 6))} /></Field>
              <Field label="Preferred language"><Input value={d.language} onChange={e => set("language", e.target.value)} placeholder="Hindi, English…" /></Field>
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monthly income (₹)"><Input type="number" value={d.income} onChange={e => set("income", e.target.value)} /></Field>
              <Field label="Loan amount (₹)"><Input type="number" value={d.loanAmount} onChange={e => set("loanAmount", e.target.value)} /></Field>
              <Field label="Employment type">
                <PickSelect value={d.employment} onChange={(v) => set("employment", v)} options={[
                  { v: "salaried", l: "Salaried" }, { v: "self_employed", l: "Self-Employed" }, { v: "business", l: "Business Owner" }, { v: "other", l: "Other" },
                ]} />
              </Field>
              <Field label="Company / business name"><Input value={d.company} onChange={e => set("company", e.target.value)} /></Field>
            </div>
          )}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="PAN"><Input value={d.pan} onChange={e => set("pan", e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" /></Field>
              <Field label="Date of birth"><Input type="date" value={d.dob} onChange={e => set("dob", e.target.value)} /></Field>
            </div>
          )}
          {step === 5 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner (agent)">
                <PickSelect value={d.owner} onChange={(v) => set("owner", v)} options={[
                  { v: "self", l: "Assign to me" }, { v: "round_robin", l: "Round-robin" }, { v: "manager_review", l: "Manager review" },
                ]} />
              </Field>
              <Field label="Priority">
                <PickSelect value={d.priority} onChange={(v) => set("priority", v)} options={[{ v: "hot", l: "Hot" }, { v: "warm", l: "Warm" }, { v: "cold", l: "Cold" }]} />
              </Field>
              <div className="col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea value={d.notes} onChange={e => set("notes", e.target.value)} className="text-sm min-h-[70px]" />
              </div>
            </div>
          )}
          {step === 6 && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 space-y-1.5 text-sm">
                <Row label="Name" value={d.name} />
                <Row label="Mobile" value={d.mobile} />
                <Row label="Source" value={d.source} />
                <Row label="Product" value={PRODUCTS.find(p => p.v === d.product)?.l || d.product} />
                <Row label="City / State" value={[d.city, d.state].filter(Boolean).join(", ") || "—"} />
                <Row label="Income / Loan" value={d.income || d.loanAmount ? `₹${d.income || "—"} / ₹${d.loanAmount || "—"}` : "—"} />
                <Row label="Owner" value={d.owner || "Unassigned"} />
              </div>
              {missingForSTB.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Lead can be saved as a lite lead.</div>
                    <div>Still needed before SLP: {missingForSTB.map(m => <Badge key={m} variant="outline" className="text-[10px] mr-1 mt-0.5">{m}</Badge>)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
          {step < TOTAL && <Button onClick={next}>Continue</Button>}
          {step === TOTAL && <Button onClick={handleSubmit}>Save Lead</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}
function PickSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
