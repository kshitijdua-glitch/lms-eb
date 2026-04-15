

# Plan: Configurable & Reorderable Table Columns

## Summary
Build a reusable system that lets users show/hide columns and drag-reorder them on every table in the app. Column preferences persist in localStorage per table.

## What the User Gets
- A **gear/columns icon button** above each table that opens a popover
- In the popover: checkboxes to toggle column visibility, drag handles to reorder columns
- A "Reset to Default" button to restore original column order/visibility
- Preferences saved per table and persist across sessions

## Architecture

### 1. Column Definition Type (`src/types/lms.ts`)
```typescript
interface ColumnDef<T> {
  id: string;
  label: string;
  defaultVisible?: boolean; // defaults true
  locked?: boolean; // e.g. checkbox column, actions -- can't hide/move
  render: (item: T, index: number) => React.ReactNode;
  headerClassName?: string;
  sortable?: boolean;
  sortKey?: string;
}
```

### 2. `useConfigurableColumns` Hook (`src/hooks/use-configurable-columns.ts`)
- Input: `tableId: string`, `columns: ColumnDef[]`
- Reads/writes localStorage key `table-columns-${tableId}`
- Returns: `{ visibleColumns, allColumns, toggleColumn, moveColumn, resetColumns }`
- `moveColumn(fromIndex, toIndex)` for drag reorder

### 3. `ColumnConfigurator` Component (`src/components/ColumnConfigurator.tsx`)
- Popover triggered by a `Settings2` icon button
- Lists all non-locked columns with checkboxes and drag handles
- Uses HTML drag-and-drop (no external library needed) for reordering
- "Reset" button at bottom

### 4. `ConfigurableTable` Component (`src/components/ConfigurableTable.tsx`)
- Wraps `<Table>` with the hook and configurator
- Takes `tableId`, `columns`, `data`, `onRowClick`, `renderActions` props
- Renders only visible columns in the saved order
- Keeps locked columns (checkbox, actions) pinned at start/end

### 5. Migrate All Tables (~20 tables across 17 files)
Convert each table from inline `<TableHead>`/`<TableCell>` to a `columns` array definition and use `ConfigurableTable`. Files:

**Lead tables**: `LeadsPage`, `GroupLeadsPage`, `OrgLeadsPage`
**Follow-up tables**: `FollowUpsPage`, `GroupFollowUpsPage`, `OrgFollowUpsPage`
**STB tables**: `STBPage`, `GroupSTBPage`, `OrgSTBPage`
**Report tables**: `ReportsPage`, `GroupReportsPage`, `OrgReportsPage`
**Staff tables**: `StaffManagementPage`, `AdminStaffPage`, `AgentManagementPage`
**Other tables**: `AuditTrailPage`, `LeadPoolsPage`, `GroupManagementPage`, `LeadAllocationPage`

## Implementation Steps

1. **Create types and hook** -- `ColumnDef` type, `useConfigurableColumns` hook with localStorage persistence
2. **Create ColumnConfigurator component** -- Popover UI with checkboxes and drag-to-reorder
3. **Create ConfigurableTable wrapper** -- Combines hook + configurator + table rendering
4. **Migrate lead tables** -- LeadsPage, GroupLeadsPage, OrgLeadsPage
5. **Migrate follow-up tables** -- FollowUpsPage, GroupFollowUpsPage, OrgFollowUpsPage
6. **Migrate STB tables** -- STBPage, GroupSTBPage, OrgSTBPage
7. **Migrate report/audit/staff tables** -- All remaining tables

## Technical Notes
- HTML5 drag-and-drop for column reorder (no new dependencies)
- localStorage key pattern: `table-cols-{tableId}` stores `{ order: string[], hidden: string[] }`
- Locked columns (checkbox, actions) are excluded from configurator and stay pinned
- Sort functionality preserved -- sortable columns still clickable
- ~3 new files, ~17 modified files

