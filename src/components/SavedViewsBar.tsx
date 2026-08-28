import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteView, listSavedViews, saveView, type SavedView, type ViewFilters } from "@/lib/savedViews";

interface Props {
  /** Module key, e.g. "performance" or "mis-export". */
  module: string;
  /** Owner key so views stay per-user/role. */
  owner: string;
  /** Current filter state to save. */
  filters: ViewFilters;
  /** Applies a stored filter set. */
  onApply: (filters: ViewFilters) => void;
  /** Restores module defaults. */
  onReset: () => void;
}

/** Save / apply / delete named filter sets for reproducible reporting. */
export const SavedViewsBar = ({ module, owner, filters, onApply, onReset }: Props) => {
  const [views, setViews] = useState<SavedView[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setViews(listSavedViews(module, owner));
    setSelected("");
  }, [module, owner]);

  const selectedView = useMemo(() => views.find(v => v.id === selected), [views, selected]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Give the view a name");
      return;
    }
    const view = saveView(module, owner, name, filters);
    setViews(listSavedViews(module, owner));
    setSelected(view.id);
    setDialogOpen(false);
    setName("");
    toast.success(`View "${view.name}" saved`);
  };

  const handleDelete = () => {
    if (!selectedView) return;
    deleteView(module, owner, selectedView.id);
    setViews(listSavedViews(module, owner));
    setSelected("");
    toast.success(`View "${selectedView.name}" removed`);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Saved view</Label>
          <Select
            value={selected}
            onValueChange={id => {
              setSelected(id);
              const v = views.find(x => x.id === id);
              if (v) {
                onApply(v.filters);
                toast.success(`Applied "${v.name}"`);
              }
            }}
            disabled={views.length === 0}
          >
            <SelectTrigger className="h-9 w-[180px]" aria-label="Apply a saved view">
              <SelectValue placeholder={views.length ? "Select a view" : "No saved views"} />
            </SelectTrigger>
            <SelectContent>
              {views.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setDialogOpen(true)}>
              <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" /> Save view
            </Button>
          </TooltipTrigger>
          <TooltipContent>Store the current filters for reuse</TooltipContent>
        </Tooltip>

        {selectedView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleDelete} aria-label="Delete saved view">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete "{selectedView.name}"</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => {
                setSelected("");
                onReset();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
            </Button>
          </TooltipTrigger>
          <TooltipContent>Restore default filters</TooltipContent>
        </Tooltip>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save current view</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="view-name">View name</Label>
              <Input
                id="view-name"
                value={name}
                placeholder="e.g. Q3 personal loans — Team A"
                onChange={e => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Saves the active period and every filter so the same numbers can be reproduced later.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save view</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
