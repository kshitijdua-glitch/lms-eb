/**
 * Centralized follow-up status logic — extended for PRD §9.5.
 * Buckets: Upcoming | Today | Overdue | Completed | Escalated | Cancelled
 */
export type FollowUpBucket = "overdue" | "today" | "upcoming" | "completed" | "escalated" | "cancelled";

export interface FollowUpStatusResult {
  bucket: FollowUpBucket;
  label: string;
  variant: "destructive" | "default" | "secondary";
}

export function getFollowUpBucket(scheduledAt: string, status: string, now: Date = new Date()): FollowUpBucket {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "escalated") return "escalated";
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
    case "escalated": return { bucket, label: "Escalated", variant: "destructive" };
    case "cancelled": return { bucket, label: "Cancelled", variant: "secondary" };
  }
}
