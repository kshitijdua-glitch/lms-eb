import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "warning" | "info" | "destructive" | "muted";

const toneText: Record<Tone, string> = {
  primary: "text-muted-foreground",
  success: "text-muted-foreground",
  warning: "text-muted-foreground",
  info: "text-muted-foreground",
  destructive: "text-muted-foreground",
  muted: "text-muted-foreground",
};

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  /** Kept for backwards-compat; both render as a clean neutral tile now */
  variant?: "gradient" | "soft";
  className?: string;
  onClick?: () => void;
  hint?: React.ReactNode;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "primary",
  className,
  onClick,
  hint,
}: StatTileProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "shadow-none",
        onClick && "cursor-pointer transition hover:border-primary/40",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {Icon && <Icon className={cn("h-4 w-4", toneText[tone])} />}
        </div>
        <div className="text-2xl font-semibold tracking-tight leading-none text-foreground">
          {value}
        </div>
        {hint && <div className="mt-1.5 text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
