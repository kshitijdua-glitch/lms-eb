/** Quick date-range presets shared by dashboards, reports and exports. */

export type RangePresetId =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "this_month"
  | "last_month"
  | "qtd"
  | "last6m"
  | "custom";

export interface RangePreset {
  id: RangePresetId;
  label: string;
}

export const rangePresets: RangePreset[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "qtd", label: "Quarter to date" },
  { id: "last6m", label: "Last 6 months" },
  { id: "custom", label: "Custom range" },
];

export const toIsoDate = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/** Resolves a preset into inclusive from/to ISO dates. Returns null for "custom". */
export function resolvePreset(id: RangePresetId): { from: string; to: string } | null {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (id) {
    case "today":
      return { from: toIsoDate(now), to: toIsoDate(now) };
    case "yesterday": {
      const y = startOfDay(now);
      y.setDate(y.getDate() - 1);
      return { from: toIsoDate(y), to: toIsoDate(y) };
    }
    case "last7": {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 6);
      return { from: toIsoDate(s), to: toIsoDate(now) };
    }
    case "last30": {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 29);
      return { from: toIsoDate(s), to: toIsoDate(now) };
    }
    case "this_month":
      return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toIsoDate(now) };
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toIsoDate(first), to: toIsoDate(last) };
    }
    case "qtd": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return { from: toIsoDate(new Date(now.getFullYear(), q, 1)), to: toIsoDate(now) };
    }
    case "last6m": {
      const s = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { from: toIsoDate(s), to: toIsoDate(now) };
    }
    default:
      return null;
  }
}

export function describeRange(from: string, to: string) {
  const fmt = (v: string) =>
    new Date(`${v}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}
