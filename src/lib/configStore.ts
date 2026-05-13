/**
 * Tiny localStorage-backed config store for the prototype's Configuration Center.
 * Each call rule / SLA / disposition tweak persists across reloads so the demo
 * can show the impact across screens.
 */

const KEY = "lms-config-center";

export interface CallRulesConfig {
  minCallDurationSec: number;
  maxRetriesPerLead: number;
  duplicateWindowMinutes: number;
  agentBackdateHours: number;
}

export interface FollowUpSLAConfig {
  hotLeadHours: number;
  warmLeadHours: number;
  coldLeadHours: number;
  overdueGraceMinutes: number;
  notifyManagerOnMissed: boolean;
}

export interface NotificationConfig {
  followUpDueLeadMinutes: number;
  digestEnabled: boolean;
  channels: { inApp: boolean; email: boolean; sms: boolean };
}

export interface AppConfig {
  callRules: CallRulesConfig;
  followUpSLA: FollowUpSLAConfig;
  notifications: NotificationConfig;
  customDispositions: { id: string; label: string; outcome: "connected" | "not_connected" | "invalid" | "compliance" }[];
}

export const defaultConfig: AppConfig = {
  callRules: {
    minCallDurationSec: 30,
    maxRetriesPerLead: 5,
    duplicateWindowMinutes: 30,
    agentBackdateHours: 24,
  },
  followUpSLA: {
    hotLeadHours: 4,
    warmLeadHours: 24,
    coldLeadHours: 72,
    overdueGraceMinutes: 30,
    notifyManagerOnMissed: true,
  },
  notifications: {
    followUpDueLeadMinutes: 15,
    digestEnabled: true,
    channels: { inApp: true, email: true, sms: false },
  },
  customDispositions: [],
};

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
}

export function saveConfig(cfg: AppConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {}
}
