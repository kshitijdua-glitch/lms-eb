import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/lms";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => void; // legacy no-op for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PRIORITY: UserRole[] = ["data_admin", "cluster_head", "manager", "agent"];

async function loadProfileAndRole(supaUser: User): Promise<AuthUser> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, joined_at").eq("id", supaUser.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", supaUser.id),
  ]);
  const rolesList = (roles ?? []).map(r => r.role as UserRole);
  const role = ROLE_PRIORITY.find(r => rolesList.includes(r)) ?? "agent";
  return {
    id: supaUser.id,
    name: profile?.name ?? supaUser.email?.split("@")[0] ?? "User",
    email: profile?.email ?? supaUser.email ?? "",
    role,
    joinedAt: profile?.joined_at ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // defer profile lookup to avoid deadlock
        setTimeout(() => { loadProfileAndRole(sess.user).then(setUser).catch(() => setUser(null)); }, 0);
      } else {
        setUser(null);
      }
    });
    // 2) existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadProfileAndRole(sess.user).then(setUser).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const login: AuthContextType["login"] = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const updateRole = useCallback(() => {
    // Role is now sourced from DB and cannot be changed client-side.
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAuthenticated: !!session, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Legacy exports kept so existing imports don't break — values are now meaningless.
export const DEMO_PASSWORD = "";
export const DEMO_CREDENTIALS: { email: string; password: string; name: string; role: UserRole; joinedAt: string }[] = [];
