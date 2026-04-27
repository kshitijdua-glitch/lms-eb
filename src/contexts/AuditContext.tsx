import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { AuditEntry, UserRole } from "@/types/lms";

interface AuditContextType {
  entries: AuditEntry[];
  /** Append a new immutable audit entry. Returns the created entry id. */
  logAudit: (entry: Omit<AuditEntry, "id" | "timestamp">) => string;
  /** Filter helper for the lead-detail timeline. */
  forLead: (leadId: string) => AuditEntry[];
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

const STORAGE_KEY = "lms-audit-log";

const seed: AuditEntry[] = [
  {
    id: "audit-seed-1",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    actorId: "agent-1",
    actorName: "Amit Verma",
    actorRole: "agent",
    action: "log_call",
    entityType: "lead",
    entityId: "lead-1",
    entityLabel: "Rajesh Khanna",
    after: { outcome: "connected", disposition: "warm_follow_up" },
    notes: "Customer interested in PL ₹5L",
  },
  {
    id: "audit-seed-2",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    actorId: "mgr-1",
    actorName: "Vikram Mehta",
    actorRole: "manager",
    action: "reassign_lead",
    entityType: "lead",
    entityId: "lead-9",
    entityLabel: "Arjun Rao",
    before: { agentId: "agent-3", agentName: "Sneha Gupta" },
    after: { agentId: "agent-1", agentName: "Amit Verma" },
    reason: "Workload balancing",
  },
];

export function AuditProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>(() => {
    if (typeof window === "undefined") return seed;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AuditEntry[];
    } catch {
      /* ignore parse errors */
    }
    return seed;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* quota or serialization errors are non-fatal */
    }
  }, [entries]);

  const logAudit = useCallback((entry: Omit<AuditEntry, "id" | "timestamp">) => {
    const id = `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const full: AuditEntry = { ...entry, id, timestamp: new Date().toISOString() };
    setEntries(prev => [full, ...prev]);
    return id;
  }, []);

  const forLead = useCallback(
    (leadId: string) => entries.filter(e => e.entityType === "lead" && e.entityId === leadId),
    [entries],
  );

  return (
    <AuditContext.Provider value={{ entries, logAudit, forLead }}>{children}</AuditContext.Provider>
  );
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
}

/** Build a friendly actor object from current role context. */
export function buildActor(role: UserRole, agentId: string, name?: string) {
  return {
    actorId: agentId,
    actorName: name ?? (role === "agent" ? "Amit Verma" : role === "manager" ? "Vikram Mehta" : role === "cluster_head" ? "CH Admin" : "Data Admin"),
    actorRole: role,
  };
}
