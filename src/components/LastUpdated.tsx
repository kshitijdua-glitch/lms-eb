import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Section 12.2 — every report/dashboard should show "Last updated".
 * Lightweight prototype: shows current time on mount, refreshes hourly.
 */
export function LastUpdated({ label = "Last updated" }: { label?: string }) {
  const [ts, setTs] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTs(new Date()), 3600_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>{label}: {ts.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
    </div>
  );
}
