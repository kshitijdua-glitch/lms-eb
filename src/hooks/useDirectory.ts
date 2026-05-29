import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/types/lms";

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  manager_id: string | null;
  cluster_head_id: string | null;
  status: "active" | "inactive";
  joined_at: string;
  role: UserRole;
}

export function useDirectory() {
  return useQuery({
    queryKey: ["directory"],
    queryFn: async (): Promise<DirectoryUser[]> => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, name, email, phone, manager_id, cluster_head_id, status, joined_at").order("name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const roleMap = new Map<string, UserRole>();
      (roles ?? []).forEach(r => {
        const cur = roleMap.get(r.user_id);
        const priority: UserRole[] = ["data_admin", "cluster_head", "manager", "agent"];
        if (!cur || priority.indexOf(r.role as UserRole) < priority.indexOf(cur)) {
          roleMap.set(r.user_id, r.role as UserRole);
        }
      });
      return (profiles ?? []).map(p => ({
        ...p,
        status: p.status as "active" | "inactive",
        role: roleMap.get(p.id) ?? "agent",
      }));
    },
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; name: string; phone?: string; role: UserRole; manager_id?: string | null; cluster_head_id?: string | null }) => {
      const { data, error } = await supabase.functions.invoke("admin-create-user", { body: input });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { ok: true; user_id: string; email: string; temporary_password?: string };
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["directory"] }); },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<{ name: string; phone: string | null; manager_id: string | null; cluster_head_id: string | null; status: "active" | "inactive" }> }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["directory"] }),
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: UserRole }) => {
      const { error: dErr } = await supabase.from("user_roles").delete().eq("user_id", user_id);
      if (dErr) throw dErr;
      const { error: iErr } = await supabase.from("user_roles").insert({ user_id, role });
      if (iErr) throw iErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["directory"] }),
  });
}
