import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { UserRole } from "@/types/lms";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

interface DemoCred {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  joinedAt: string;
}

export const DEMO_PASSWORD = "demo123";

export const DEMO_CREDENTIALS: DemoCred[] = [
  { email: "agent@smartlms.com",   password: DEMO_PASSWORD, name: "Aarav Verma",   role: "agent",        joinedAt: "2024-03-12" },
  { email: "manager@smartlms.com", password: DEMO_PASSWORD, name: "Meera Iyer",    role: "manager",      joinedAt: "2023-08-04" },
  { email: "cluster@smartlms.com", password: DEMO_PASSWORD, name: "Rohit Kapoor",  role: "cluster_head", joinedAt: "2022-11-20" },
  { email: "admin@smartlms.com",   password: DEMO_PASSWORD, name: "Priya Shah",    role: "data_admin",   joinedAt: "2022-05-09" },
];

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  updateRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "lms-auth";

function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());

  const persist = (u: AuthUser | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
  };

  const login: AuthContextType["login"] = useCallback((email, password) => {
    const match = DEMO_CREDENTIALS.find(
      c => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password,
    );
    if (!match) return { ok: false, error: "Invalid email or password" };
    const u: AuthUser = { name: match.name, email: match.email, role: match.role, joinedAt: match.joinedAt };
    persist(u);
    try { localStorage.setItem("lms-role", match.role); } catch { /* noop */ }
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  const updateRole = useCallback((role: UserRole) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, role };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setUser(loadUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
