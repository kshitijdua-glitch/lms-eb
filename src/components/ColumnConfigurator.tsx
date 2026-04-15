import { useState, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, GripVertical } from "lucide-react";

interface ConfigItem {
  id: string;
  label: string;
  visible: boolean;
}

interface Props {
  items: ConfigItem[];
  onToggle: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onReset: () => void;
}

export const ColumnConfigurator = ({ items, onToggle, onMove, onReset }: Props) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
          <Settings2 className="h-3.5 w-3.5" /> Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Show / reorder columns</div>
        <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={e => { e.preventDefault(); setDragOverIndex(i); }}
              onDrop={() => { if (dragIndex !== null && dragIndex !== i) onMove(dragIndex, i); setDragIndex(null); setDragOverIndex(null); }}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={`flex items-center gap-2 px-1 py-1 rounded text-xs cursor-grab hover:bg-accent/50 ${dragOverIndex === i ? "border-t-2 border-primary" : ""}`}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
              <Checkbox
                checked={item.visible}
                onCheckedChange={() => onToggle(item.id)}
                className="h-3.5 w-3.5"
              />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs" onClick={onReset}>
          Reset to Default
        </Button>
      </PopoverContent>
    </Popover>
  );
};
