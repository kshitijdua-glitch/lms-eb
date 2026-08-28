import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ColumnConfigurator } from "./ColumnConfigurator";
import { useConfigurableColumns } from "@/hooks/use-configurable-columns";
import type { ColumnDef } from "@/types/table";
import { cn } from "@/lib/utils";

interface Props<T> {
  tableId: string;
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  emptyMessage?: string;
  /** Rows rendered per page. Set to 0 to disable pagination. */
  pageSize?: number;
}

const DESKTOP_ROW_HEIGHT = 53;
const MOBILE_ROW_HEIGHT = 104;

export function ConfigurableTable<T>({
  tableId,
  columns,
  data,
  onRowClick,
  rowClassName,
  emptyMessage = "No records to display",
  pageSize = 25,
}: Props<T>) {
  const { visibleColumns, allConfigurable, toggleColumn, moveColumn, resetColumns } = useConfigurableColumns(tableId, columns);
  const [page, setPage] = useState(0);

  const paginated = pageSize > 0;
  const totalPages = paginated ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;

  // Keep the page in range when filters shrink the dataset.
  useEffect(() => {
    setPage(p => (p > totalPages - 1 ? 0 : p));
  }, [totalPages]);

  const rows = useMemo(
    () => (paginated ? data.slice(page * pageSize, page * pageSize + pageSize) : data),
    [data, page, pageSize, paginated]
  );

  // Reserve vertical space for the rows on the current page so switching
  // pages or applying filters does not shift the surrounding layout.
  const reservedRows = paginated ? Math.min(pageSize, Math.max(rows.length, 1)) : Math.max(rows.length, 1);

  if (data.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search.</p>
      </div>
    );
  }

  const rangeStart = paginated ? page * pageSize + 1 : 1;
  const rangeEnd = paginated ? page * pageSize + rows.length : data.length;

  return (
    <div>
      <div className="hidden md:flex justify-end px-3 py-2">
        <ColumnConfigurator
          items={allConfigurable}
          onToggle={toggleColumn}
          onMove={moveColumn}
          onReset={resetColumns}
        />
      </div>

      {/* Mobile: card rows */}
      <div
        className="md:hidden divide-y divide-border"
        style={{ minHeight: reservedRows * MOBILE_ROW_HEIGHT }}
      >
        {rows.map((item, i) => {
          const [primary, ...rest] = visibleColumns;
          const absoluteIndex = paginated ? page * pageSize + i : i;
          return (
            <div
              key={absoluteIndex}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(item, absoluteIndex)}
              onKeyDown={e => {
                if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onRowClick(item, absoluteIndex);
                }
              }}
              className={cn(
                "px-4 py-3.5 space-y-2.5",
                onRowClick && "cursor-pointer active:bg-accent/50",
                rowClassName?.(item, absoluteIndex)
              )}
            >
              {primary && <div className="text-sm font-semibold">{primary.render(item, absoluteIndex)}</div>}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                {rest.map(col => (
                  <div key={col.id} className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{col.label}</dt>
                    <dd className="text-xs mt-0.5 truncate">{col.render(item, absoluteIndex)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div style={{ minHeight: reservedRows * DESKTOP_ROW_HEIGHT + DESKTOP_ROW_HEIGHT }}>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(col => (
                  <TableHead key={col.id} className={col.headerClassName}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item, i) => {
                const absoluteIndex = paginated ? page * pageSize + i : i;
                return (
                  <TableRow
                    key={absoluteIndex}
                    className={cn(onRowClick && "cursor-pointer hover:bg-accent/50", rowClassName?.(item, absoluteIndex))}
                    onClick={() => onRowClick?.(item, absoluteIndex)}
                  >
                    {visibleColumns.map(col => (
                      <TableCell key={col.id}>{col.render(item, absoluteIndex)}</TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {paginated && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing <span className="font-medium text-foreground">{rangeStart}</span>–
            <span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
            <span className="font-medium text-foreground">{data.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
