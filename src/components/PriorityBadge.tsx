import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePriorityConfig } from "@/contexts/PriorityConfigContext";
import { calculatePriority, calculatePriorityScore } from "@/utils/priorityEngine";
import type { Lead } from "@/types/lms";

interface PriorityBadgeProps {
  lead: Lead;
  className?: string;
}

export function PriorityBadge({ lead, className = "text-xs" }: PriorityBadgeProps) {
  const { config } = usePriorityConfig();
  const priority = calculatePriority(lead, config);
  const { score, reasons } = calculatePriorityScore(lead, config);
  const variant = priority === "hot" ? "destructive" : priority === "warm" ? "default" : "secondary";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} className={`${className} cursor-help capitalize`}>
          {priority}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-semibold text-xs mb-1">
          Priority: {priority.toUpperCase()} (score {score >= 0 ? `+${score}` : score})
        </p>
        {reasons.length > 0 ? (
          reasons.map((r, i) => (
            <p key={i} className="text-[11px] leading-tight">{r}</p>
          ))
        ) : (
          <p className="text-[11px] text-muted-foreground">No scoring factors matched</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1.5 pt-1 border-t border-border">
          Thresholds: Hot ≥ {config.thresholds.hot}, Warm ≥ {config.thresholds.warm}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
