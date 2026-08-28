/** Minimal client-side CSV builder + download helper (no dependencies). */

export type CsvValue = string | number | null | undefined;
export interface CsvColumn<T> {
  key: string;
  label: string;
  value: (row: T) => CsvValue;
}

const escapeCell = (v: CsvValue) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map(c => escapeCell(c.label)).join(",");
  const body = rows.map(r => columns.map(c => escapeCell(c.value(r))).join(","));
  return [header, ...body].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Masks PII values for roles without PII export rights. */
export const maskValue = (v: CsvValue, keep = 4) => {
  const s = v === null || v === undefined ? "" : String(v);
  if (s.length <= keep) return s ? "•".repeat(s.length) : "";
  return `${"•".repeat(Math.max(2, s.length - keep))}${s.slice(-keep)}`;
};

export const dateStamp = () => new Date().toISOString().slice(0, 10);
