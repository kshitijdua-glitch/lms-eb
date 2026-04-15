import { useState, useMemo, useCallback } from "react";
import type { ColumnDef, ColumnConfig } from "@/types/table";

function loadConfig(tableId: string): ColumnConfig | null {
  try {
    const raw = localStorage.getItem(`table-cols-${tableId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveConfig(tableId: string, config: ColumnConfig) {
  localStorage.setItem(`table-cols-${tableId}`, JSON.stringify(config));
}

export function useConfigurableColumns<T>(tableId: string, columns: ColumnDef<T>[]) {
  const defaultOrder = columns.filter(c => !c.locked).map(c => c.id);
  const defaultHidden = columns.filter(c => c.defaultVisible === false && !c.locked).map(c => c.id);

  const [config, setConfig] = useState<ColumnConfig>(() => {
    const saved = loadConfig(tableId);
    if (saved) {
      // Merge: add new columns not in saved order
      const allIds = columns.filter(c => !c.locked).map(c => c.id);
      const order = [...saved.order.filter(id => allIds.includes(id)), ...allIds.filter(id => !saved.order.includes(id))];
      return { order, hidden: saved.hidden.filter(id => allIds.includes(id)) };
    }
    return { order: defaultOrder, hidden: defaultHidden };
  });

  const updateConfig = useCallback((next: ColumnConfig) => {
    setConfig(next);
    saveConfig(tableId, next);
  }, [tableId]);

  const toggleColumn = useCallback((colId: string) => {
    const next = { ...config, hidden: config.hidden.includes(colId) ? config.hidden.filter(id => id !== colId) : [...config.hidden, colId] };
    updateConfig(next);
  }, [config, updateConfig]);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    const order = [...config.order];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    updateConfig({ ...config, order });
  }, [config, updateConfig]);

  const resetColumns = useCallback(() => {
    updateConfig({ order: defaultOrder, hidden: defaultHidden });
  }, [defaultOrder, defaultHidden, updateConfig]);

  const lockedStart = columns.filter(c => c.locked === "start");
  const lockedEnd = columns.filter(c => c.locked === "end");
  const colMap = new Map(columns.map(c => [c.id, c]));

  const visibleColumns = useMemo(() => {
    const middle = config.order
      .filter(id => !config.hidden.includes(id))
      .map(id => colMap.get(id)!)
      .filter(Boolean);
    return [...lockedStart, ...middle, ...lockedEnd];
  }, [config, lockedStart, lockedEnd, colMap]);

  const allConfigurable = useMemo(() => {
    return config.order.map(id => ({
      id,
      label: colMap.get(id)?.label || id,
      visible: !config.hidden.includes(id),
    }));
  }, [config, colMap]);

  return { visibleColumns, allConfigurable, toggleColumn, moveColumn, resetColumns };
}
