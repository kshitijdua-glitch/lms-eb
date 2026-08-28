import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BAND_LABEL, REPULL_COOLDOWN_MINUTES, repullAvailableAt } from "@/services/experianSandbox";
import type { CreditReport } from "@/types/lms";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Shield, TrendingDown, TrendingUp } from "lucide-react";

const BAND_STYLE: Record<string, string> = {
  excellent: "text-emerald-700 bg-emerald-50 border-emerald-200",
  good: "text-emerald-700 bg-emerald-50 border-emerald-200",
  fair: "text-amber-700 bg-amber-50 border-amber-200",
  poor: "text-rose-700 bg-rose-50 border-rose-200",
  no_history: "text-slate-600 bg-slate-50 border-slate-200",
};

function ScoreGauge({ score, band }: { score: number; band: string }) {
  const pct = Math.min(100, Math.max(0, ((score - 300) / 600) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">{score}</span>
        <span className={cn("mb-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", BAND_STYLE[band])}>
          {BAND_LABEL[band as keyof typeof BAND_LABEL] ?? band}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gradient-to-r from-rose-300 via-amber-300 to-emerald-400 relative">
        <span
          className="absolute -top-1 h-4 w-1.5 rounded-full bg-foreground shadow"
          style={{ left: `calc(${pct}% - 3px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>300</span><span>900</span>
      </div>
    </div>
  );
}

interface Props {
  report: CreditReport | null | undefined;
  loading: boolean;
  onFetch: () => void;
  canFetch: boolean;
  errorMessage?: string | null;
}

export function CreditReportPanel({ report, loading, onFetch, canFetch, errorMessage }: Props) {
  const cooldownUntil = repullAvailableAt(report);
  const cooldownActive = !!cooldownUntil && cooldownUntil.getTime() > Date.now();

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Shield className="h-4 w-4" />
          </span>
          <span className="flex-1">Credit Bureau</span>
          <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground border rounded px-1.5 py-0.5">
            Sandbox
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {!report && !loading && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              No bureau record pulled yet. Fetch the Experian Griffith report to populate score, obligations and FOIR —
              these drive partner eligibility.
            </p>
            {errorMessage && (
              <div className="rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 text-[11px] text-rose-800 flex gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {errorMessage}
              </div>
            )}
            <Button className="w-full h-10" onClick={onFetch} disabled={!canFetch} aria-label="Fetch credit report">
              <Shield className="h-4 w-4 mr-1.5" /> Fetch Credit Report
            </Button>
            {!canFetch && <p className="text-[11px] text-muted-foreground">Your role cannot initiate bureau enquiries.</p>}
          </div>
        )}

        {loading && (
          <div className="py-6 flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs font-medium">Querying Experian Griffith sandbox…</p>
            <p className="text-[11px] text-muted-foreground">Authenticating · fetching bureau file · scoring</p>
          </div>
        )}

        {report && !loading && (
          <>
            <ScoreGauge score={report.score} band={report.band} />

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Active accounts", value: report.activeAccounts },
                { label: "Total EMI", value: `₹${report.totalObligations.toLocaleString("en-IN")}` },
                { label: "Enquiries (6m)", value: report.enquiries6m },
                { label: "Max DPD", value: `${report.maxDpd} days` },
              ].map(m => (
                <div key={m.label} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</div>
                  <div className="text-sm font-semibold tabular-nums">{m.value}</div>
                </div>
              ))}
            </div>

            {report.writeOff && (
              <div className="rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 text-[11px] text-rose-800 flex gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Write-off / settled account reported — most partners will decline.
              </div>
            )}

            <div className="space-y-1.5">
              <div className="text-xs font-medium">Score factors</div>
              {report.scoreFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  {f.impact === "positive"
                    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    : <TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />}
                  <span><span className="font-medium">{f.label}</span> — <span className="text-muted-foreground">{f.detail}</span></span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-medium">Trade lines ({report.tradeLines.length})</div>
              <div className="rounded-md border border-border divide-y divide-border/60 max-h-56 overflow-y-auto">
                {report.tradeLines.map(t => (
                  <div key={t.id} className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium truncate">{t.lender} · {t.accountType}</span>
                      <span className={cn("text-[10px] rounded-full px-2 py-0.5 border",
                        t.status === "active" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-100 text-slate-600 border-slate-200")}>
                        {t.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Sanctioned ₹{t.sanctionedAmount.toLocaleString("en-IN")} · Outstanding ₹{t.outstandingAmount.toLocaleString("en-IN")} · EMI ₹{t.emi.toLocaleString("en-IN")}
                      {t.maxDpd > 0 && <span className="text-rose-600"> · {t.maxDpd} DPD</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t">
              <div className="text-[10px] leading-relaxed text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {report.bureau} (Sandbox)
                </div>
                <div>Ref {report.referenceId} · {new Date(report.pulledAt).toLocaleString()}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button variant="outline" size="sm" className="h-8" onClick={onFetch} disabled={!canFetch || cooldownActive} aria-label="Re-pull credit report">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Re-pull
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {cooldownActive
                    ? `Bureau re-pull allowed after ${cooldownUntil?.toLocaleTimeString()} (${REPULL_COOLDOWN_MINUTES} min throttle)`
                    : "Fetch a fresh bureau file"}
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
