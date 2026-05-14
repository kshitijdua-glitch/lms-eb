import { useEffect, useRef, useState } from "react";
import { Phone, Copy, Clock, BookOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface ManualCallPanelProps {
  customerName: string;
  primaryPhone: string;
  alternatePhone?: string;
  lastCallSummary?: string;
  onLogCall: (durationSeconds: number) => void;
  /** Disabled (e.g. compliance block / DNC). */
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * Manual Call Panel — Section 5.3 of the Frontend Change Requirements.
 * Makes the LMS-doesn't-place-the-call constraint explicit, exposes a
 * timer for the call, and links to the call log form.
 */
export function ManualCallPanel({
  customerName,
  primaryPhone,
  alternatePhone,
  lastCallSummary,
  onLogCall,
  disabled,
  disabledReason,
}: ManualCallPanelProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      const start = Date.now() - elapsed * 1000;
      tickRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    } else if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  const copyNumber = (n: string) => {
    navigator.clipboard.writeText(n).catch(() => {});
    toast.success("Phone number copied");
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Phone className="h-4 w-4" />
          </span>
          Manual Call
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Constraint banner */}
        <div className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Use your phone to call this customer. Then record the result here. The LMS does not place calls.
          </span>
        </div>

        {/* Customer + numbers */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">{customerName}</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Primary</span>
                <span className="font-mono text-sm tabular-nums">{primaryPhone}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copyNumber(primaryPhone)} aria-label="Copy primary number">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <a href={`tel:${primaryPhone}`}>
                    <Phone className="h-3.5 w-3.5 mr-1" /> Call on Phone
                  </a>
                </Button>
              </div>
            </div>
            {alternatePhone && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Alternate</span>
                  <span className="font-mono text-sm tabular-nums">{alternatePhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copyNumber(alternatePhone)} aria-label="Copy alternate number">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                    <a href={`tel:${alternatePhone}`}>
                      <Phone className="h-3.5 w-3.5 mr-1" /> Call on Phone
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Last call */}
        {lastCallSummary && (
          <div className="flex items-center justify-end text-xs">
            <Badge variant="outline" className="text-[10px] font-normal">
              Last: {lastCallSummary}
            </Badge>
          </div>
        )}

        {/* Timer + log button */}
        <div className="rounded-md border border-border p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Manual call timer</span>
            </div>
            <span className="font-mono text-base font-semibold tabular-nums">{fmt(elapsed)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={running ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs"
              disabled={disabled}
              onClick={() => setRunning(r => !r)}
            >
              {running ? "Pause Timer" : elapsed > 0 ? "Resume Timer" : "Start Manual Call Timer"}
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={disabled}
              onClick={() => {
                setRunning(false);
                onLogCall(elapsed);
              }}
            >
              Log Manual Call
            </Button>
          </div>
          {elapsed > 0 && !running && (
            <button
              onClick={() => setElapsed(0)}
              className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Reset timer
            </button>
          )}
        </div>

        {disabled && disabledReason && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
            {disabledReason}
          </div>
        )}

        {/* Call script */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between text-xs text-primary hover:underline">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Call script
              </span>
              <span className="text-[10px] text-muted-foreground">Show / hide</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-md bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
              <p><strong className="text-foreground">Greeting:</strong> "Hi, this is [Your Name] calling from Smart LMS regarding your loan enquiry."</p>
              <p><strong className="text-foreground">Verify:</strong> Confirm name and that this is a good time to talk.</p>
              <p><strong className="text-foreground">Discover:</strong> Required loan amount, purpose, employment, monthly income.</p>
              <p><strong className="text-foreground">Pitch:</strong> Lending partner options based on profile.</p>
              <p><strong className="text-foreground">Close:</strong> Document collection, follow-up time, or SLP submission.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
