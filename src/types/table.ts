import { ReactNode } from "react";

export interface ColumnDef<T> {
  id: string;
  label: string;
  defaultVisible?: boolean;
  locked?: "start" | "end";
  render: (item: T, index: number) => ReactNode;
  headerClassName?: string;
}

export interface ColumnConfig {
  order: string[];
  hidden: string[];
}
