import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, ChevronUp, ChevronDown } from "lucide-react";

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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" aria-label="Configure columns">
          <Settings2 className="h-3.5 w-3.5" /> Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Show / reorder columns</div>
        <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 px-1 py-1 rounded text-xs hover:bg-accent/50"
            >
              <div className="flex flex-col -space-y-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => onMove(i, i - 1)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Move up</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={i === items.length - 1}
                      onClick={() => onMove(i, i + 1)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Move down</TooltipContent>
                </Tooltip>
              </div>
              <Checkbox
                checked={item.visible}
                onCheckedChange={() => onToggle(item.id)}
                className="h-3.5 w-3.5"
                aria-label={`Toggle ${item.label}`}
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
