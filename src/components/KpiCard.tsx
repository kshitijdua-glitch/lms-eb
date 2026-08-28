import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  /** Percentage change vs previous period. */
  deltaPct?: number;
  /** When true, a negative delta is treated as good (e.g. overdue follow-ups). */
  invertDelta?: boolean;
  to?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const toneText: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  deltaPct,
  invertDelta,
  to,
  tone = "default",
  className,
}: KpiCardProps) {
  const navigate = useNavigate();
  const interactive = !!to;
  const good = deltaPct === undefined ? null : invertDelta ? deltaPct <= 0 : deltaPct >= 0;
  const DeltaIcon = deltaPct === undefined ? ArrowRight : deltaPct > 0 ? ArrowUpRight : deltaPct < 0 ? ArrowDownRight : ArrowRight;

  return (
    <Card
      className={cn(
        "min-h-[104px] transition-shadow",
        interactive && "cursor-pointer hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      role={interactive ? "link" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${label}: ${value}. View details` : undefined}
      onClick={interactive ? () => navigate(to!) : undefined}
      onKeyDown={
        interactive
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(to!);
              }
            }
          : undefined
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          {Icon && <Icon className={cn("h-4 w-4 shrink-0", toneText[tone])} aria-hidden />}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        <div className="mt-1 flex items-center gap-1.5 min-h-[18px]">
          {deltaPct !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-medium",
                good ? "text-success" : "text-destructive",
              )}
            >
              <DeltaIcon className="h-3 w-3" aria-hidden />
              {Math.abs(deltaPct)}%
            </span>
          )}
          {hint && <span className="text-[11px] text-muted-foreground truncate">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
