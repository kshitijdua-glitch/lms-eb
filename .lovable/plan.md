

# Plan: File-Based Batch Upload, Naming, and Allocation

## Summary
Restructure the upload and allocation flow so batches are file-based, not source-based. Upload flow adds a step where the user names the batch and selects source + default product. Allocation page shows uploaded batches (not source pools). Source list is configurable by Data Admins in System Config.

## Changes

### 1. `src/pages/admin/LeadUploadPage.tsx`
- Change step flow to: `upload` → `details` → `mapping` → `validation` → `done`
- New **"details" step** after file upload: user enters batch name (auto-filled from filename), selects source from configurable list, selects default product
- Product Type column mapping still available (overrides batch default per-lead)
- Update stepper UI to show 4 steps
- Remove hardcoded source references; use source list from a shared constant/context

### 2. `src/pages/LeadAllocationPage.tsx`
- Replace `PoolRow` type: change from `{ source, date, count, product }` to `{ batchName, fileName, uploadDate, source, count, product, status }`
- Update mock data to show file-based batches (e.g., "Google_Ads_Apr14.csv", "Partner_Leads_Q1.xlsx")
- Table columns: Batch Name, File Name, Upload Date, Source, Product, Lead Count, Status, Action
- Allocation dialog title references batch name instead of source
- Summary cards remain the same (total unallocated, active batches, active agents, active teams)

### 3. `src/pages/SystemConfigPage.tsx`
- Add a **"Lead Sources"** tab (visible to Cluster Head / Data Admin)
- UI: list of source names with Add/Remove buttons
- Sources stored in component state (mock prototype)
- These sources are used in the upload page's source dropdown

### 4. `src/data/mockData.ts` (or inline in pages)
- Add a shared `defaultLeadSources` array: `["Website", "Google Ads", "Facebook", "Partner", "IVR", "Referral", "Walk-in", "Email Campaign"]`
- Update mock batch data for allocation page

## Technical Notes
- No new context needed for sources — simple shared constant with local state editing in SystemConfig
- Product override from file column is handled by the existing column mapping step (if "Product Type" column is mapped, per-lead values override batch default)
- All mock/prototype — no backend

