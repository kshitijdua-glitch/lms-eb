import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserRole } from "@/types/lms";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentAgentId: string;
  currentTeamId: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const STORAGE_KEY = "lms-role";
const VALID_ROLES: UserRole[] = ["agent", "manager", "cluster_head", "data_admin"];

function loadRole(): UserRole {
  if (typeof window === "undefined") return "agent";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID_ROLES.includes(saved as UserRole)) return saved as UserRole;
  } catch { /* noop */ }
  return "agent";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => loadRole());

  const setRole = (r: UserRole) => {
    setRoleState(r);
    try { localStorage.setItem(STORAGE_KEY, r); } catch { /* noop */ }
  };

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && VALID_ROLES.includes(e.newValue as UserRole)) {
        setRoleState(e.newValue as UserRole);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const currentAgentId = role === "agent" ? "agent-1" : "agent-9";
  const currentTeamId = "team-1";

  return (
    <RoleContext.Provider value={{ role, setRole, currentAgentId, currentTeamId }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export const roleLabels: Record<UserRole, string> = {
  agent: "Agent",
  manager: "Manager",
  cluster_head: "Cluster Head",
  data_admin: "Data Admin",
};
