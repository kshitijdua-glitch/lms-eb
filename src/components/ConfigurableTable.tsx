import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
}

export function ConfigurableTable<T>({ tableId, columns, data, onRowClick, rowClassName, emptyMessage = "No records to display" }: Props<T>) {
  const { visibleColumns, allConfigurable, toggleColumn, moveColumn, resetColumns } = useConfigurableColumns(tableId, columns);

  if (data.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search.</p>
      </div>
    );
  }

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
      <div className="md:hidden divide-y divide-border">
        {data.map((item, i) => {
          const [primary, ...rest] = visibleColumns;
          return (
            <div
              key={i}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(item, i)}
              onKeyDown={e => {
                if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onRowClick(item, i);
                }
              }}
              className={cn(
                "px-4 py-3.5 space-y-2.5",
                onRowClick && "cursor-pointer active:bg-accent/50",
                rowClassName?.(item, i)
              )}
            >
              {primary && <div className="text-sm font-semibold">{primary.render(item, i)}</div>}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                {rest.map(col => (
                  <div key={col.id} className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{col.label}</dt>
                    <dd className="text-xs mt-0.5 truncate">{col.render(item, i)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map(col => (
                <TableHead key={col.id} className={col.headerClassName}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, i) => (
              <TableRow
                key={i}
                className={cn(onRowClick && "cursor-pointer hover:bg-accent/50", rowClassName?.(item, i))}
                onClick={() => onRowClick?.(item, i)}
              >
                {visibleColumns.map(col => (
                  <TableCell key={col.id}>{col.render(item, i)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
