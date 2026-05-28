import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "agent" | "manager" | "cluster_head" | "data_admin";

interface Body {
  email: string;
  name: string;
  phone?: string;
  role: Role;
  manager_id?: string | null;
  cluster_head_id?: string | null;
  password?: string; // optional; if absent, a temporary one is generated
}

function tempPassword() {
  const a = "abcdefghjkmnpqrstuvwxyz";
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const n = "23456789";
  const s = "!@#$%^&*";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let p = pick(A) + pick(a) + pick(n) + pick(s);
  for (let i = 0; i < 10; i++) p += pick(a + A + n);
  return p;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is data_admin
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: "invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "data_admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden: data_admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as Body;
    if (!body?.email || !body?.name || !body?.role) {
      return new Response(JSON.stringify({ error: "email, name, and role are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const validRoles: Role[] = ["agent", "manager", "cluster_head", "data_admin"];
    if (!validRoles.includes(body.role)) {
      return new Response(JSON.stringify({ error: "invalid role" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const password = body.password ?? tempPassword();

    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email: body.email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name: body.name },
    });
    if (cerr || !created.user) {
      return new Response(JSON.stringify({ error: cerr?.message ?? "could not create user" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const newId = created.user.id;

    // Update profile fields (trigger already inserted the row)
    await admin.from("profiles").update({
      name: body.name,
      phone: body.phone ?? null,
      manager_id: body.manager_id ?? null,
      cluster_head_id: body.cluster_head_id ?? null,
    }).eq("id", newId);

    // Replace default 'agent' role with requested role
    await admin.from("user_roles").delete().eq("user_id", newId);
    await admin.from("user_roles").insert({ user_id: newId, role: body.role });

    return new Response(
      JSON.stringify({ ok: true, user_id: newId, email: body.email, temporary_password: body.password ? undefined : password }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
