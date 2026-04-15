import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnConfigurator } from "./ColumnConfigurator";
import { useConfigurableColumns } from "@/hooks/use-configurable-columns";
import type { ColumnDef } from "@/types/table";

interface Props<T> {
  tableId: string;
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
}

export function ConfigurableTable<T>({ tableId, columns, data, onRowClick, rowClassName }: Props<T>) {
  const { visibleColumns, allConfigurable, toggleColumn, moveColumn, resetColumns } = useConfigurableColumns(tableId, columns);

  return (
    <div>
      <div className="flex justify-end px-3 py-2">
        <ColumnConfigurator
          items={allConfigurable}
          onToggle={toggleColumn}
          onMove={moveColumn}
          onReset={resetColumns}
        />
      </div>
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
              className={`${onRowClick ? "cursor-pointer hover:bg-accent/50" : ""} ${rowClassName?.(item, i) || ""}`}
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
  );
}
