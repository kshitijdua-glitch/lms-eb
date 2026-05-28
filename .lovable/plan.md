
# Phase A — Backend Foundation & Core Modules

Goal: turn the mock-data prototype into a real product backed by your Supabase project. This phase covers the schema, auth, RLS, and wiring the **core operational modules** to real data. Dashboards, reports, exports, notifications, and config polish come in Phase B.

## 1. Supabase connection & auth

- You'll connect your own Supabase project via the native Supabase integration.
- Auth: **email + password**, signup disabled in Auth settings. Only `data_admin` can create users (via an admin-only edge function that calls `auth.admin.createUser`, sends a password-reset/invite email).
- First-admin bootstrap: a one-time SQL seed promotes the first email you provide to `data_admin`.
- Remove `DemoModeBanner`, `RoleContext` role-switcher, and all `localStorage`-based role/auth state. `useAuth` becomes the single source of truth, reading the session + the user's row in `profiles` + `user_roles`.

## 2. Database schema (migrations)

All tables in `public`, RLS enabled, explicit GRANTs, `service_role` full access. Key tables:

- `profiles` (id = auth.uid, name, email, phone, manager_id, cluster_head_id, status, joined_at)
- `app_role` enum: `agent | manager | cluster_head | data_admin`
- `user_roles` (user_id, role) + `has_role()` security-definer function
- `lending_partners` (name, products[], integration_type, min_credit_score, max_foir, min_income, status)
- `products` (slug, label, status, is_custom)
- `dispositions` (type, label, category, group, requires_follow_up) — seeded from current taxonomy
- `lead_batches` (id, uploaded_by, source, file_name, row_count, valid_count, invalid_count, created_at)
- `leads` — full PRD §4 schema: identity, employment, income, obligations, **FOIR computed via trigger**, product, loan_amount, stage, disposition, priority, source, assigned_agent_id, credit_score, retry_count, allocated_at, expires_at, last_activity_at, timestamps
- `lead_existing_loans`, `lead_selected_partners`, `lead_notes`
- `call_logs` (lead_id, agent_id, timestamp, outcome, duration, disposition, notes, next_action, follow_up_at)
- `follow_ups` (lead_id, scheduled_at, type, status, notes, sub_type, completed_at, completed_by)
- `slp_submissions` (lead_id, partner_id, submitted_by, submitted_at, status, sanction_amount, approval_date, disbursed_amount, disbursement_date, reference_id, status_reason, last_update_note, next_follow_up_at, remarks)
- `audit_log` (actor_id, actor_role, action, entity_type, entity_id, before jsonb, after jsonb, reason, created_at) — append-only; UPDATE/DELETE blocked by policy
- `notifications` (user_id, type, title, message, lead_id, read, created_at)

Computed columns / triggers:
- `leads.foir` recomputed on insert/update from `existing_obligations / monthly_income`.
- `leads.priority` recomputed via priority engine (credit/income/FOIR weights).
- `leads.stage` auto-derived from latest `slp_submissions.status` via trigger (PRD §10.17).
- `leads.last_activity_at` bumped on any child write.
- `audit_log` rows inserted by triggers on `leads`, `slp_submissions`, `follow_ups`, `call_logs`, `user_roles`.
- POST-SLP field locks (PRD §10.18) enforced in a `BEFORE UPDATE` trigger that raises on locked field changes when an active SLP exists.

## 3. RLS policies (per PRD §3)

Using `has_role()` and ownership predicates:
- `agent`: read/write only leads where `assigned_agent_id = auth.uid()`; insert call_logs/follow_ups/notes for those leads; cannot mutate `slp_submissions` status; cannot reassign.
- `manager`: read/write all leads where `profiles.manager_id = auth.uid()` for the assigned agent; can bulk-reassign within group; can update SLP status.
- `cluster_head`: org-wide read; can update SLP status; can override locked fields with reason.
- `data_admin`: org-wide read/write on batches, partners, products, dispositions, users; cannot edit leads directly.
- `audit_log`: SELECT for managers/cluster_head/data_admin (scoped), INSERT only via triggers, no UPDATE/DELETE for anyone.

## 4. Edge functions

- `admin-create-user` — data_admin only; creates auth user, profile, role, sends invite.
- `bulk-allocate-leads` — split-allocation wizard backend (round-robin / weighted / manual).
- `compute-priority` — callable on batch upload completion.
- `expire-leads` — cron (pg_cron) marks leads `expired` past TTL.
- `slp-status-update` — validates transitions, required fields per status (reference_id for disbursed, sanction amount for approved, reasons for declined/cancelled), writes audit + notification.

All functions: zod validation, CORS headers, `verify_jwt = true` where caller is user; service-role client for privileged writes.

## 5. Frontend rewiring (this phase)

Replace `mockData.ts` reads with Supabase queries (TanStack Query) in:
- `LeadsPage`, `LeadDetailPage`, `GroupLeadsPage`, `OrgLeadsPage`
- `LeadAllocationPage`, `admin/LeadUploadPage`, `admin/LeadPoolsPage`
- `FollowUpsPage`, `GroupFollowUpsPage`, `OrgFollowUpsPage`
- `STBPage`, `GroupSTBPage`, `OrgSTBPage`, `SLPStatusUpdateDialog`, `STBWizardDialog`
- `ManualCallPanel`, `ManualCallLogDialog`
- `StaffManagementPage`, `admin/AdminStaffPage`, `admin/AgentManagementPage`
- `admin/PartnersPage`, `AuditTrailPage`
- `LoginPage` — real `signInWithPassword`; remove role-picker UI.
- `AppLayout` — derive role from `useAuth`/`useRole` (now DB-backed); hide DemoModeBanner.

Deferred to Phase B: Dashboards (`/dashboards/*`), `ReportsPage`, `GroupReportsPage`, `OrgReportsPage`, `PerformancePage`, `NotificationsPage` realtime, `SystemConfigPage`, `admin/MISExportPage`, `admin/ConfigPage`. They'll keep showing mock/empty states with a "Phase B" badge until then.

## 6. Seed data

Empty DB. Provide a SQL seed that inserts:
- 1 default `data_admin` (you tell me the email; password reset link emailed on first login).
- The disposition taxonomy and product list currently in `mockData.ts`.
- 3 sample lending partners (editable later in Admin → Partners).

No sample leads/agents — you'll create those through the real UI.

## Technical details

- Migrations live in `supabase/migrations/*.sql`, applied via the Supabase integration.
- Use `@supabase/supabase-js` v2 client at `src/integrations/supabase/client.ts`.
- All list pages use TanStack Query with `lead-list`, `lead-detail`, `follow-ups`, `slp-submissions` query keys; mutations invalidate granularly.
- `RoleContext` keeps its API but `role` comes from `user_roles` table cached in React Query.
- `AuditContext` becomes a thin wrapper that just reads server-side audit rows; writes happen via DB triggers.
- Permissions in `src/lib/permissions.ts` stay as the client-side gate (UX), with RLS as the server-side enforcement.

## What I need from you before I start building

1. Confirm the email for the bootstrap `data_admin` account.
2. Confirm you'll click through the Supabase native integration prompt when I trigger it.
3. Confirm Phase B scope (dashboards/reports/notifications/exports/config) can come in a follow-up plan.
