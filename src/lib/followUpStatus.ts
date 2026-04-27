/**
 * Centralized follow-up status logic.
 * Rules (relative to "now"):
 * - completed status → "Completed"
 * - missed status → "Overdue"
 * - scheduled date is BEFORE start of today → "Overdue"
 * - scheduled date is within today (start..end) → "Today" (alias "Due Now")
 * - scheduled date is AFTER end of today → "Upcoming"
 */
export type FollowUpBucket = "overdue" | "today" | "upcoming" | "completed";

export interface FollowUpStatusResult {
  bucket: FollowUpBucket;
  label: string;
  variant: "destructive" | "default" | "secondary";
}

export function getFollowUpBucket(scheduledAt: string, status: string, now: Date = new Date()): FollowUpBucket {
  if (status === "completed") return "completed";
  const sched = new Date(scheduledAt).getTime();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);

  if (status === "missed") return "overdue";
  if (sched < startOfToday.getTime()) return "overdue";
  if (sched <= endOfToday.getTime()) return "today";
  return "upcoming";
}

export function getFollowUpStatus(scheduledAt: string, status: string, now: Date = new Date()): FollowUpStatusResult {
  const bucket = getFollowUpBucket(scheduledAt, status, now);
  switch (bucket) {
    case "completed": return { bucket, label: "Completed", variant: "default" };
    case "overdue": return { bucket, label: "Overdue", variant: "destructive" };
    case "today": return { bucket, label: "Today", variant: "default" };
    case "upcoming": return { bucket, label: "Upcoming", variant: "secondary" };
  }
}
