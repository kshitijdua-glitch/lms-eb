import React, { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "@/types/lms";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentAgentId: string;
  currentTeamId: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("agent");

  const currentAgentId = role === "agent" ? "agent-1" : role === "team_leader" ? "agent-9" : "agent-9";
  const currentTeamId = role === "agent" ? "team-1" : "team-1";

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
  team_leader: "Team Leader",
  manager: "Manager",
  cluster_head: "Cluster Head",
  data_admin: "Data Admin",
};
