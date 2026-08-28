import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelStep } from "@/lib/metrics";

export function FunnelChart({ steps, title = "Lifecycle Funnel" }: { steps: FunnelStep[]; title?: string }) {
  const max = Math.max(1, ...steps.map(s => s.value));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].value : null;
          const drop = prev && prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : 0;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {s.value} · {s.pctOfTop}%
                  {i > 0 && drop > 0 && <span className="text-destructive ml-2">-{drop}%</span>}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(2, (s.value / max) * 100)}%`, opacity: 1 - i * 0.12 }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
