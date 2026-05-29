import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AuditEntry, UserRole } from "@/types/lms";

interface AuditContextType {
  entries: AuditEntry[];
  loading: boolean;
  /** No-op: writes happen via database triggers. Kept for backward compat. */
  logAudit: (entry: Omit<AuditEntry, "id" | "timestamp">) => string;
  forLead: (leadId: string) => AuditEntry[];
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

type AuditRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
};

function rowToEntry(r: AuditRow, profileNames: Map<string, string>): AuditEntry {
  return {
    id: r.id,
    timestamp: r.created_at,
    actorId: r.actor_id ?? "system",
    actorName: r.actor_id ? (profileNames.get(r.actor_id) ?? "Unknown") : "System",
    actorRole: (r.actor_role ?? "agent") as UserRole,
    action: r.action,
    entityType: r.entity_type as AuditEntry["entityType"],
    entityId: r.entity_id ?? "",
    before: r.before ?? undefined,
    after: r.after ?? undefined,
    reason: r.reason ?? undefined,
  };
}

export function AuditProvider({ children }: { children: ReactNode }) {
  const q = useQuery({
    queryKey: ["audit_log"],
    queryFn: async (): Promise<AuditEntry[]> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, created_at, actor_id, actor_role, action, entity_type, entity_id, before, after, reason")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        // RLS may deny for non-privileged roles — return empty list
        return [];
      }
      const ids = Array.from(new Set((data as AuditRow[]).map(r => r.actor_id).filter(Boolean) as string[]));
      const nameMap = new Map<string, string>();
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, name").in("id", ids);
        (profs ?? []).forEach(p => nameMap.set(p.id, p.name));
      }
      return (data as AuditRow[]).map(r => rowToEntry(r, nameMap));
    },
  });

  const entries = q.data ?? [];

  const logAudit = useCallback(() => {
    // Writes happen server-side via DB triggers. This is a no-op.
    return "";
  }, []);

  const forLead = useCallback(
    (leadId: string) => entries.filter(e => e.entityType === "leads" || e.entityType === "lead").filter(e => e.entityId === leadId),
    [entries],
  );

  const value = useMemo(() => ({ entries, loading: q.isLoading, logAudit, forLead }), [entries, q.isLoading, logAudit, forLead]);
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
}

/** Build actor object — kept for backward compatibility; only used by no-op writes. */
export function buildActor(role: UserRole, agentId: string, name?: string) {
  return { actorId: agentId, actorName: name ?? role, actorRole: role };
}
