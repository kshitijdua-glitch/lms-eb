import { leads as liveLeads } from "@/data/mockData";
import type { Lead } from "@/types/lms";

/**
 * Single source of truth for demo lead data.
 *
 * The seeded array exported from mockData is treated as the live collection so
 * that legacy pages importing `leads` keep working. This module keeps that array
 * in sync, persists it to localStorage (so every action survives a refresh) and
 * notifies React subscribers.
 */

const STORAGE_KEY = "lms.demo.leads.v2";

export interface LmsSnapshot {
  leads: Lead[];
  version: number;
}

let snapshot: LmsSnapshot = { leads: liveLeads, version: 0 };
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.leads));
  } catch {
    /* quota / private mode — demo continues in memory */
  }
}

function syncLiveArray(next: Lead[]) {
  liveLeads.length = 0;
  liveLeads.push(...next);
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persist();
      return;
    }
    const parsed = JSON.parse(raw) as Lead[];
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id) {
      syncLiveArray(parsed);
      snapshot = { leads: liveLeads, version: 1 };
    }
  } catch {
    persist();
  }
}

if (typeof window !== "undefined") {
  hydrate();
  window.addEventListener("storage", e => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as Lead[];
      if (Array.isArray(parsed)) {
        syncLiveArray(parsed);
        snapshot = { leads: liveLeads, version: snapshot.version + 1 };
        listeners.forEach(l => l());
      }
    } catch {
      /* ignore */
    }
  });
}

function commit() {
  snapshot = { leads: liveLeads, version: snapshot.version + 1 };
  persist();
  listeners.forEach(l => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): LmsSnapshot {
  return snapshot;
}

export function getAllLeads(): Lead[] {
  return snapshot.leads;
}

export function getLead(id: string): Lead | undefined {
  return snapshot.leads.find(l => l.id === id);
}

export type LeadPatch = Partial<Lead> | ((lead: Lead) => Partial<Lead>);

export function updateLead(id: string, patch: LeadPatch): Lead | undefined {
  const idx = liveLeads.findIndex(l => l.id === id);
  if (idx === -1) return undefined;
  const current = liveLeads[idx];
  const resolved = typeof patch === "function" ? patch(current) : patch;
  const next = { ...current, ...resolved, lastActivityAt: new Date().toISOString() };
  liveLeads[idx] = next;
  commit();
  return next;
}

export function updateLeads(ids: string[], patch: LeadPatch) {
  const set = new Set(ids);
  liveLeads.forEach((lead, idx) => {
    if (!set.has(lead.id)) return;
    const resolved = typeof patch === "function" ? patch(lead) : patch;
    liveLeads[idx] = { ...lead, ...resolved, lastActivityAt: new Date().toISOString() };
  });
  commit();
}

export function addLeads(newLeads: Lead[]) {
  liveLeads.unshift(...newLeads);
  commit();
}

/** Clears persisted demo state; a reload reseeds fresh mock data. */
export function resetDemoData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
