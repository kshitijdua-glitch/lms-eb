import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rangePresets, resolvePreset, type RangePresetId } from "@/lib/dateRanges";

interface Props {
  from: string;
  to: string;
  preset: RangePresetId;
  onChange: (next: { from: string; to: string; preset: RangePresetId }) => void;
  className?: string;
}

/** Quick date-range selector with presets plus a custom from/to pair. */
export const DateRangeFilter = ({ from, to, preset, onChange, className }: Props) => {
  const [open, setOpen] = useState(preset === "custom");

  const applyPreset = (id: RangePresetId) => {
    const resolved = resolvePreset(id);
    setOpen(id === "custom");
    if (resolved) onChange({ ...resolved, preset: id });
    else onChange({ from, to, preset: id });
  };

  return (
    <div className={`flex flex-wrap items-end gap-2 ${className ?? ""}`}>
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Period</Label>
        <Select value={preset} onValueChange={v => applyPreset(v as RangePresetId)}>
          <SelectTrigger className="h-9 w-[168px]" aria-label="Select date range preset">
            <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rangePresets.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {(open || preset === "custom") && (
        <>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground" htmlFor="range-from">From</Label>
            <Input
              id="range-from"
              type="date"
              className="h-9 w-[150px]"
              value={from}
              max={to}
              onChange={e => onChange({ from: e.target.value, to, preset: "custom" })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground" htmlFor="range-to">To</Label>
            <Input
              id="range-to"
              type="date"
              className="h-9 w-[150px]"
              value={to}
              min={from}
              onChange={e => onChange({ from, to: e.target.value, preset: "custom" })}
            />
          </div>
        </>
      )}
    </div>
  );
};
