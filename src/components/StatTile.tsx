import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "warning" | "info" | "destructive" | "muted";

const toneGradient: Record<Tone, string> = {
  primary: "from-primary to-[hsl(265_84%_62%)]",
  success: "from-[hsl(160_84%_39%)] to-[hsl(173_80%_40%)]",
  warning: "from-[hsl(38_92%_50%)] to-[hsl(20_90%_55%)]",
  info: "from-[hsl(217_91%_60%)] to-[hsl(199_89%_55%)]",
  destructive: "from-[hsl(0_84%_60%)] to-[hsl(340_82%_55%)]",
  muted: "from-slate-500 to-slate-600",
};

const toneText: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-[hsl(var(--warning))]",
  info: "text-info",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  /** Render as filled gradient (hero) or subtle outlined card */
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
  variant = "gradient",
  className,
  onClick,
  hint,
}: StatTileProps) {
  if (variant === "gradient") {
    return (
      <Card
        onClick={onClick}
        className={cn(
          "border-0 text-white shadow-md bg-gradient-to-br",
          toneGradient[tone],
          onClick && "cursor-pointer transition-transform hover:-translate-y-0.5",
          className,
        )}
      >
        <CardContent className="p-4">
          {Icon && (
            <div className="mb-2">
              <Icon className="h-4 w-4 text-white/90" />
            </div>
          )}
          <div className="text-2xl font-semibold tracking-tight leading-none">{value}</div>
          <div className="mt-1.5 text-[11px] font-medium text-white/85 leading-tight">{label}</div>
          {hint && <div className="mt-1 text-[10px] text-white/70">{hint}</div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(onClick && "cursor-pointer transition hover:border-primary/40", className)}
    >
      <CardContent className="p-4">
        {Icon && (
          <div className="mb-2">
            <Icon className={cn("h-4 w-4", toneText[tone])} />
          </div>
        )}
        <div className="text-2xl font-semibold tracking-tight leading-none text-foreground">{value}</div>
        <div className="mt-1.5 text-[11px] font-medium text-muted-foreground leading-tight">{label}</div>
        {hint && <div className="mt-1 text-[10px] text-muted-foreground/80">{hint}</div>}
      </CardContent>
    </Card>
  );
}
