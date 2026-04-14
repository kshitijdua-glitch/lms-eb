

# Plan: Update Data Admin Flow Per PRD

## Summary
The current Data Admin portal has a basic dashboard (4 KPI cards, 4 quick-nav buttons), a simple lead upload page (drag-drop with instant mock import, flat unallocated lead table), a basic agent management page, and a minimal config page (dispositions, BRE rules, products). The PRD defines the Data Admin as a dedicated data operations role with comprehensive lead upload validation, lead pool management, MIS/data export, bureau campaign data, full staff profile management (including Cluster Head), system configuration, audit trail with export, and configurable performance dashboard access.

## What Gets Built

1. **Navigation** -- Expand from 7 items to 10: Dashboard, Lead Upload, Lead Allocation, Lead Pools, MIS Export, Bureau Campaigns, Staff Management, System Config, Audit Trail, Performance.

2. **Dashboard revamp** -- Replace 4 generic KPIs with 6 data-health widgets per PRD: Unallocated Lead Pools count, Leads Pending Validation, Stale Lead Pools, Active Staff Count (by role), Profiles Flagged for Review, Recent Upload Activity (last 5 batches). 8 quick-nav buttons.

3. **Lead Upload page overhaul** -- Multi-step upload flow: file drop/browse (CSV/XLSX, 50MB max) → column mapping step (map uploaded columns to system fields) → pre-ingestion validation report (total rows, valid, invalid with reasons, duplicates) → action buttons: "Ingest Valid Rows", "Download Rejected Rows CSV", "Cancel Upload". Post-ingestion: batch created with status "Awaiting Allocation". No individual row approval.

4. **Lead Allocation page** (`/admin/allocation`) -- List of unallocated pools (batch name, source, product, date, count). Select pool → select allocation mode (Assign to Manager Group, Assign to TL Team, Auto Round Robin Group, Auto Round Robin Team) → cascading Manager/TL dropdown → allocation summary with agent count and leads-per-agent preview → confirm. Partial allocation supported (split pool across multiple runs). Restrictions: no direct-to-agent, no re-allocation of allocated leads, no inactive groups.

5. **Lead Pool Management page** (`/admin/pools`) -- All uploaded batches with columns: Batch Name, Source, Product, Upload Date, Uploaded By, Total/Valid/Rejected Rows, Allocation Status (Unallocated/Partial/Fully Allocated), Allocated To, Allocation Date. Filters: date, source, product, status. Click pool → detail view: validation report, allocation history, pipeline stage breakdown. Read-only (no individual lead editing).

6. **MIS & Data Export page** (`/admin/mis`) -- 6 export types: Full Lead Export (with PII warning), Disposition Summary, STB Pipeline, Source Attribution, Agent Activity, Staff Profile. Each with filters: date range (mandatory), Manager (cascading to TL to Agent), product, source, stage. Export as CSV. PII exports logged in audit trail. Scheduled reports section: configure non-PII reports with frequency (daily/weekly), day, time, recipients.

7. **Bureau Campaign Data page** (`/admin/bureau`) -- Separate upload form with additional fields: Bureau Name (CIBIL/Experian/CRIF/Equifax), Campaign Name, Campaign Date, Bureau Score, Pre-Approval Amount, Bureau Grade. Same validation as standard upload plus bureau-specific format checks. Bureau batches tagged separately in Lead Pool Management.

8. **Staff Management overhaul** (`/admin/staff`) -- Tabbed: Agents | TLs | Managers | Cluster Heads. Create/edit/deactivate/reactivate all roles. Agent form: name, email, phone, Manager → TL (cascading), location, process, allocation type, status. TL form adds team size limit. Manager form adds group name, TL capacity. Cluster Head form: name, email, phone, org scope, status. Deactivation pre-check: active leads, open FUs, pending STBs, reporting staff count. Password reset button (mock: generates temp password, logs in audit). Search by name/email/role.

9. **System Configuration** -- Same scope as Cluster Head config (already built at `/system-config`). Reuse existing SystemConfigPage but make it accessible from admin nav. Add note that changes are audit-logged.

10. **Audit Trail** -- Same as Cluster Head audit trail but WITH CSV export capability (Data Admin can export, CH cannot per CH PRD). Reuse AuditTrailPage pattern, add export button for Data Admin role.

11. **Performance Dashboard** -- Configurable access level display. Show a toggle (mock) for No Access / Read-Only MIS / Full Analytics. Default: show data health widgets only. When Read-Only MIS enabled, show org-wide performance summary (reuse patterns from CH performance).

12. **Notifications** -- Upload validation complete, large export ready, scheduled report sent/failed, allocation confirmed/failed, profile created/deactivated/reactivated, password reset, config change confirmation.

## Implementation Steps

### Step 1: Update navigation and routes
- Expand `adminNav` to 10 items
- Add routes: `/admin/allocation`, `/admin/pools`, `/admin/mis`, `/admin/bureau`, `/admin/staff`
- Reuse `/system-config` and `/audit-trail` routes (already exist, just add to admin nav)

### Step 2: Revamp Admin Dashboard
- 6 data-health widgets with mock data
- 8 quick-nav buttons per PRD

### Step 3: Overhaul Lead Upload page
- Multi-step flow: upload → column mapping → validation report → ingest/reject/cancel
- Mock validation with sample valid/invalid/duplicate counts
- Download rejected rows as CSV mock

### Step 4: Build Lead Allocation page
- Unallocated pool list from mock batches
- 4 allocation modes with cascading dropdowns
- Partial allocation support
- Allocation summary preview

### Step 5: Build Lead Pool Management page
- Batch list table with all PRD columns
- Filters: date, source, product, allocation status
- Pool detail view with validation report and allocation history

### Step 6: Build MIS Export page
- 6 export type cards/tabs
- Cascading filters per export
- PII warning for Full Lead Export
- Scheduled reports configuration section

### Step 7: Build Bureau Campaign page
- Bureau-specific upload form with additional fields
- Same validation flow as standard upload
- Bureau tag in pool management

### Step 8: Overhaul Staff Management
- 4-tab view (Agents, TLs, Managers, Cluster Heads)
- Create/edit modals with role-appropriate fields
- Deactivation pre-check dialog
- Password reset button with mock flow

### Step 9: Update Audit Trail for Data Admin
- Add CSV export button when role is data_admin
- Export logged in audit trail

### Step 10: Update mock data and notifications
- Add admin-specific notification types
- Add mock batch/pool data for lead pool management

## Technical Notes
- All client-side mock data, no backend
- ~6 new/overhauled page files, ~3 modified files
- Reuse SystemConfigPage and AuditTrailPage (with minor role-based tweaks)
- Data Admin has NO LMS portal access -- no lead detail, no dispositions, no calling

