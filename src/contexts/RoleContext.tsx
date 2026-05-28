import React, { createContext, useContext, ReactNode } from "react";
import { UserRole } from "@/types/lms";
import { useAuth } from "@/contexts/AuthContext";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentAgentId: string;
  currentTeamId: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = (user?.role ?? "agent") as UserRole;

  const setRole = () => {
    // Role is server-managed via user_roles. No-op for backward compatibility.
  };

  return (
    <RoleContext.Provider value={{ role, setRole, currentAgentId: user?.id ?? "", currentTeamId: "" }}>
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
