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

interface LmsDataValue {
  leads: Lead[];
  version: number;
  getLead: (id: string) => Lead | undefined;
  updateLead: (id: string, patch: LeadPatch) => Lead | undefined;
  updateLeads: (ids: string[], patch: LeadPatch) => void;
  addLeads: (leads: Lead[]) => void;
  setCreditReport: (leadId: string, report: CreditReport) => void;
  addSubmissions: (leadId: string, submissions: STBSubmission[], stage?: LeadStage) => void;
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

  /** Webhook-style partner status progression. */
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const lead of getSnapshot().leads) {
        if (!lead.stbSubmissions?.length) continue;
        let changed = false;
        const nextSubs = lead.stbSubmissions.map(sub => {
          const event = nextWebhookEvent(sub, now);
          if (!event) return sub;
          changed = true;
          const updated: STBSubmission = {
            ...sub,
            ...event.patch,
            statusHistory: [
              ...(sub.statusHistory ?? []),
              { status: event.status, at: new Date(now).toISOString(), note: event.note, eventId: event.eventId },
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
          const worst = nextSubs.some(s => s.status === "disbursed")
            ? "disbursed"
            : nextSubs.some(s => s.status === "approved")
              ? "approved"
              : nextSubs.every(s => s.status === "declined")
                ? "declined"
                : "stb_submitted";
          storeUpdateLead(lead.id, { stbSubmissions: nextSubs, stage: worst as LeadStage });
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
    resetDemoData: () => {
      clearPersisted();
      window.location.reload();
    },
  }), [snapshot, setCreditReport, addSubmissions]);

  return <LmsDataContext.Provider value={value}>{children}</LmsDataContext.Provider>;
}

export function useLmsData() {
  const ctx = useContext(LmsDataContext);
  if (!ctx) throw new Error("useLmsData must be used within LmsDataProvider");
  return ctx;
}
