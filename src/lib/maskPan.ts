import type { UserRole } from "@/types/lms";

/**
 * Mask PAN per Master PRD §26 PII visibility matrix.
 * - Data Admin sees full PAN.
 * - All other roles see masked: ABCDE****F (first 5 + 4 stars + last char).
 */
export function maskPan(pan: string | null | undefined, role: UserRole): string {
  if (!pan) return "—";
  if (role === "data_admin") return pan;
  if (pan.length < 6) return "*".repeat(pan.length);
  return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
}

export function unmaskedPan(pan: string | null | undefined): string {
  return pan ?? "—";
}
