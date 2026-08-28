import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { CreditReport, Lead, LeadStage, STBSubmission } from "@/types/lms";
import {
  addLeads,
  getSnapshot,
  resetDemoData as clearPersisted,
  subscribe,
  updateLead as storeUpdateLead,
  updateLeads as storeUpdateLeads,
  type LeadPatch,
} from "@/lib/lmsStore";
import { nextWebhookEvent } from "@/services/partnerApi";
import { useAudit } from "@/contexts/AuditContext";
import { toast } from "sonner";

export interface SubmissionUpdateMeta {
  actorId: string;
  actorName: string;
  actorRole: "agent" | "manager" | "cluster_head" | "data_admin";
  note?: string;
  /** Manual overrides stop the simulated partner webhook from moving this submission. */
  manual?: boolean;
}

interface LmsDataValue {
  leads: Lead[];
  version: number;
  getLead: (id: string) => Lead | undefined;
  updateLead: (id: string, patch: LeadPatch) => Lead | undefined;
  updateLeads: (ids: string[], patch: LeadPatch) => void;
  addLeads: (leads: Lead[]) => void;
  setCreditReport: (leadId: string, report: CreditReport) => void;
  addSubmissions: (leadId: string, submissions: STBSubmission[], stage?: LeadStage) => void;
  updateSubmission: (
    leadId: string,
    submissionId: string,
    patch: Partial<STBSubmission> & { status: STBSubmission["status"] },
    meta: SubmissionUpdateMeta,
  ) => void;
  resetDemoData: () => void;
}


const LmsDataContext = createContext<LmsDataValue | null>(null);

const POLL_MS = 5000;

export function LmsDataProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { logAudit } = useAudit();

  const setCreditReport = useCallback((leadId: string, report: CreditReport) => {
    storeUpdateLead(leadId, lead => {
      const obligations = report.totalObligations;
      const foir = lead.monthlyIncome > 0 ? Math.round((obligations / lead.monthlyIncome) * 100) : lead.foir;
      return {
        creditReport: report,
        creditScore: report.score,
        existingObligations: obligations,
        foir,
        existingLoans: report.tradeLines
          .filter(t => t.status === "active")
          .map(t => ({
            id: t.id,
            bankName: t.lender,
            loanType: t.accountType,
            outstandingAmount: t.outstandingAmount,
            emi: t.emi,
            tenure: t.tenure,
          })),
      };
    });
  }, []);

  const addSubmissions = useCallback((leadId: string, submissions: STBSubmission[], stage?: LeadStage) => {
    storeUpdateLead(leadId, lead => ({
      stbSubmissions: [...lead.stbSubmissions, ...submissions],
      stage: stage ?? "stb_submitted",
    }));
  }, []);

  /** Derives the lead stage from the current set of submissions. */
  const deriveStage = (subs: STBSubmission[]): LeadStage =>
    subs.some(s => s.status === "disbursed")
      ? "disbursed"
      : subs.some(s => s.status === "approved")
        ? "approved"
        : subs.length > 0 && subs.every(s => s.status === "declined")
          ? "declined"
          : "stb_submitted";

  const updateSubmission = useCallback<LmsDataValue["updateSubmission"]>(
    (leadId, submissionId, patch, meta) => {
      const lead = getSnapshot().leads.find(l => l.id === leadId);
      const before = lead?.stbSubmissions.find(s => s.id === submissionId);
      if (!lead || !before) return;

      storeUpdateLead(leadId, current => {
        const nextSubs = current.stbSubmissions.map(s =>
          s.id === submissionId
            ? {
                ...s,
                ...patch,
                manualOverride: meta.manual ? true : s.manualOverride,
                statusHistory: [
                  ...(s.statusHistory ?? []),
                  {
                    status: patch.status,
                    previousStatus: s.status,
                    at: new Date().toISOString(),
                    note: meta.note?.trim() || "Status updated",
                    actorName: meta.actorName,
                    actorRole: meta.actorRole,
                    source: (meta.manual ? "manual" : "system") as "manual" | "system",
                    sanctionAmount: patch.sanctionAmount ?? s.sanctionAmount,
                    disbursedAmount: patch.disbursedAmount ?? s.disbursedAmount,
                  },
                ],
              }
            : s,
        );
        return { stbSubmissions: nextSubs, stage: deriveStage(nextSubs) };
      });

      logAudit({
        actorId: meta.actorId,
        actorName: meta.actorName,
        actorRole: meta.actorRole,
        action: `update_partner_status_${patch.status}`,
        entityType: "stb",
        entityId: submissionId,
        entityLabel: `${lead.name} → ${before.partnerName}`,
        before: { status: before.status, sanctionAmount: before.sanctionAmount, disbursedAmount: before.disbursedAmount },
        after: {
          status: patch.status,
          sanctionAmount: patch.sanctionAmount ?? before.sanctionAmount,
          disbursedAmount: patch.disbursedAmount ?? before.disbursedAmount,
          applicationRef: patch.applicationRef ?? before.applicationRef,
        },
        notes: meta.note,
        reason: meta.manual ? "Manual status override" : undefined,
      });

      toast.success(`${before.partnerName} · status set to ${patch.status.replace("_", " ")}`);
    },
    [logAudit],
  );

  /** Webhook-style partner status progression. */
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const lead of getSnapshot().leads) {
        if (!lead.stbSubmissions?.length) continue;
        let changed = false;
        const nextSubs = lead.stbSubmissions.map(sub => {
          // Manual overrides win — the simulated partner API stops touching them.
          if (sub.manualOverride) return sub;
          const event = nextWebhookEvent(sub, now);
          if (!event) return sub;
          changed = true;
          const updated: STBSubmission = {
            ...sub,
            ...event.patch,
            statusHistory: [
              ...(sub.statusHistory ?? []),
              {
                status: event.status,
                previousStatus: sub.status,
                at: new Date(now).toISOString(),
                note: event.note,
                eventId: event.eventId,
                actorName: `${sub.partnerName} integration`,
                source: "partner_api",
                sanctionAmount: event.patch.sanctionAmount ?? sub.sanctionAmount,
                disbursedAmount: event.patch.disbursedAmount ?? sub.disbursedAmount,
              },
            ],
          };
          logAudit({
            actorId: "partner-api",
            actorName: `${sub.partnerName} API`,
            actorRole: "data_admin",
            action: `partner_webhook_${event.status}`,
            entityType: "stb",
            entityId: sub.id,
            entityLabel: `${lead.name} → ${sub.partnerName}`,
            before: { status: sub.status },
            after: { status: event.status, ref: sub.applicationRef },
            notes: event.note,
          });
          toast.message(`Partner update · ${sub.partnerName}`, { description: event.note });
          return updated;
        });
        if (changed) {
          storeUpdateLead(lead.id, { stbSubmissions: nextSubs, stage: deriveStage(nextSubs) });
        }
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [logAudit]);

  const value = useMemo<LmsDataValue>(() => ({
    leads: snapshot.leads,
    version: snapshot.version,
    getLead: (id: string) => snapshot.leads.find(l => l.id === id),
    updateLead: storeUpdateLead,
    updateLeads: storeUpdateLeads,
    addLeads,
    setCreditReport,
    addSubmissions,
    updateSubmission,
    resetDemoData: () => {
      clearPersisted();
      window.location.reload();
    },
  }), [snapshot, setCreditReport, addSubmissions, updateSubmission]);


  return <LmsDataContext.Provider value={value}>{children}</LmsDataContext.Provider>;
}

export function useLmsData() {
  const ctx = useContext(LmsDataContext);
  if (!ctx) throw new Error("useLmsData must be used within LmsDataProvider");
  return ctx;
}
