## Goal

Let **Data Admin** and **Cluster Head** fully manage **Lending Partners (Banks)** and **Products** from the admin UI — add, edit, enable/disable, and assign which products each bank offers — instead of these being hardcoded in `mockData.ts`.

## Approach

Move partners + products from static arrays into a shared **PartnersContext** (session-persisted, like `AuditContext`) so any edits propagate to all consumers (Lead Detail bank picker, STB pages, BRE config, dashboards). Then upgrade `PartnersPage` and `ConfigPage > Products` into real CRUD screens.

## Changes

### 1. New context: `src/contexts/PartnersContext.tsx`
- Holds `partners: LendingPartner[]` and `products: ProductDefinition[]`.
- Seeds from `mockData` on first load, persists to `sessionStorage`.
- Exposes: `addPartner`, `updatePartner`, `togglePartnerStatus`, `removePartner`, `addProduct`, `updateProduct`, `toggleProductStatus`, `removeProduct`, `getProductLabel`, `getActivePartnersForProduct`.
- Wrap app in `App.tsx` (alongside Audit/Priority providers).

### 2. New type: `ProductDefinition`
Add to `src/types/lms.ts`:
```ts
interface ProductDefinition {
  id: ProductType | string; // allow custom slugs
  label: string;
  status: "active" | "inactive";
  isCustom?: boolean;
}
```

### 3. Rewrite `src/pages/admin/PartnersPage.tsx` — full Bank CRUD
- "Add Partner" opens a Dialog form: name, integration type, products (multi-select from active products), min credit score, max FOIR, min income, status.
- Row "Edit" opens the same dialog pre-filled.
- Add inline status toggle and a delete (with confirm) action.
- Validate with zod (name required, score 300-900, FOIR 0-100, income ≥0, ≥1 product).
- All mutations call `logAudit({ action: "partner_created" | "partner_updated" | "partner_deleted", entityType: "config" })`.
- Gate write actions with `can.configureSystem(role)`; show read-only state otherwise.

### 4. Upgrade `src/pages/admin/ConfigPage.tsx` — Products tab CRUD
- Replace the hardcoded product list loop with `products` from context.
- "Add Product" dialog: label + auto-slug id, status.
- Each row: edit label, toggle status, delete (only for `isCustom`; built-ins can only be toggled).
- BRE Rules tab: when editing a partner's BRE row, reuse the same partner edit dialog.
- Dispositions tab: leave as-is for this task.

### 5. Wire consumers to the context
Replace direct `lendingPartners` / hardcoded product imports in:
- `LeadDetailPage.tsx` (bank selection list — only show `status === "active"` partners that offer the lead's product)
- `STBPage.tsx`, `OrgSTBPage.tsx`, `GroupSTBPage.tsx` (partner filters)
- Dashboards (`ManagerDashboard`, `ClusterHeadDashboard`) for partner counts
- `mockData.ts` `getProductLabel` helper stays as fallback; pages prefer context's `getProductLabel`.

### 6. Permissions
- Both Bank CRUD and Product CRUD require `can.configureSystem` (Cluster Head + Data Admin already allowed).
- Agent/Manager see partners read-only on lead detail (unchanged).

## Files

**Created**
- `src/contexts/PartnersContext.tsx`

**Modified**
- `src/types/lms.ts` — add `ProductDefinition`
- `src/App.tsx` — wrap with `PartnersProvider`
- `src/pages/admin/PartnersPage.tsx` — full CRUD with dialog + zod validation
- `src/pages/admin/ConfigPage.tsx` — Products tab CRUD, BRE edit dialog wired
- `src/pages/LeadDetailPage.tsx` — read partners from context, filter by active + product
- `src/pages/STBPage.tsx`, `OrgSTBPage.tsx`, `GroupSTBPage.tsx` — read from context
- `src/components/dashboards/ManagerDashboard.tsx`, `ClusterHeadDashboard.tsx` — read from context

## Out of scope
- Backend persistence (stays mock/sessionStorage, per prototype constraints)
- Per-product BRE rules (current BRE is per-partner; can be a follow-up)
- Bulk import of partners
