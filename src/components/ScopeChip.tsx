import { Globe, Building2, Users, User } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { UserRole } from "@/types/lms";
import { cn } from "@/lib/utils";

const SCOPE_BY_ROLE: Record<UserRole, { label: string; icon: typeof Globe }> = {
  data_admin: { label: "Scope: System-wide", icon: Globe },
  cluster_head: { label: "Scope: Cluster / Organisation", icon: Building2 },
  manager: { label: "Scope: My Team", icon: Users },
  agent: { label: "Scope: My Assigned Leads", icon: User },
};

export function ScopeChip({
  override,
  className,
}: {
  override?: { label: string; icon?: typeof Globe };
  className?: string;
}) {
  const { role } = useRole();
  const cfg = override
    ? { label: override.label, icon: override.icon ?? Globe }
    : SCOPE_BY_ROLE[role];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
