import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lead, LeadStage, ProductType, EmploymentType, DispositionType, Priority } from "@/types/lms";

/**
 * Maps a Supabase `leads` row + lightweight relations into the `Lead` shape the
 * UI was built around. Nested collections (callLogs, followUps, stbSubmissions,
 * notes, existingLoans, selectedBanks) are returned as empty arrays in the list
 * view — the Lead Detail page fetches its own deep data.
 */
function rowToLead(r: any): Lead {
  return {
    id: r.id,
    name: r.full_name ?? "",
    mobile: r.mobile ?? "",
    email: r.email ?? "",
    pan: r.pan ?? "",
    dob: r.dob ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    pinCode: r.pincode ?? "",
    companyName: r.employer_name ?? "",
    employmentType: (r.employment_type ?? "salaried") as EmploymentType,
    monthlyIncome: Number(r.monthly_income ?? 0),
    existingObligations: Number(r.existing_obligations ?? 0),
    foir: Number(r.foir ?? 0),
    productType: (r.product ?? "personal_loan") as ProductType,
    loanAmount: Number(r.loan_amount ?? 0),
    stage: (r.stage ?? "new") as LeadStage,
    disposition: (r.disposition ?? "hot_follow_up") as DispositionType,
    priority: (r.priority ?? "warm") as Priority,
    source: r.source ?? "",
    leadSource: r.source ?? "",
    assignedAgentId: r.assigned_agent_id ?? "",
    assignedTeamId: "",
    creditScore: r.credit_score ?? null,
    existingLoans: [],
    selectedBanks: [],
    stbSubmissions: [],
    callLogs: [],
    followUps: [],
    notes: [],
    createdAt: r.created_at,
    lastActivityAt: r.last_activity_at ?? r.created_at,
    allocatedAt: r.allocated_at ?? r.created_at,
    retryCount: r.retry_count ?? 0,
    expiresAt: r.expires_at ?? "",
  };
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("last_activity_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map(rowToLead);
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string; mobile: string; source: string; product: string;
      altMobile?: string; city?: string; state?: string; pin?: string;
      income?: string; loanAmount?: string; employment?: string; company?: string;
      pan?: string; dob?: string; priority?: string; notes?: string;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const payload: any = {
        full_name: input.name.trim(),
        mobile: input.mobile,
        source: input.source,
        product: input.product,
        city: input.city || null,
        state: input.state || null,
        pincode: input.pin || null,
        monthly_income: input.income ? Number(input.income) : null,
        loan_amount: input.loanAmount ? Number(input.loanAmount) : null,
        employment_type: input.employment || null,
        employer_name: input.company || null,
        pan: input.pan ? input.pan.toUpperCase() : null,
        dob: input.dob || null,
        priority: input.priority || "warm",
        stage: "new",
        created_by: uid,
        assigned_agent_id: uid, // self-assign on creation; admin/manager flows can reassign
      };
      const { data, error } = await supabase.from("leads").insert(payload).select("id").single();
      if (error) throw error;
      if (input.notes?.trim()) {
        await supabase.from("lead_notes").insert({ lead_id: data.id, body: input.notes.trim(), author_id: uid });
      }
      return data.id as string;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); },
  });
}
