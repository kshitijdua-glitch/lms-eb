

# Plan: Merge Team Leader + Manager into Single "Manager" Role

## Summary
Remove `team_leader` as a separate role. The merged "Manager" role combines all TL features (agent monitoring, targets, notes/flags, team reassignment) with Manager features (group-level views, cross-team reassignment, disposition overrides, MIS reports). The navigation uses "Group" naming with merged capabilities.

## Changes

### 1. Type & Context Updates
- **`src/types/lms.ts`**: Remove `"team_leader"` from `UserRole` union -- becomes `"agent" | "manager" | "cluster_head" | "data_admin"`
- **`src/contexts/RoleContext.tsx`**: Remove `team_leader` from `roleLabels`, update `currentAgentId`/`currentTeamId` ternaries

### 2. Navigation & Routing
- **`src/components/AppSidebar.tsx`**: Delete `tlNav`. Merge into `managerNav` -- keep the current Manager nav (Dashboard, My Leads, My Follow-Ups, My STB, Group Leads, Group Follow-Ups, Group STB, Group Mgmt, Lead Report, Performance, MIS Reports). Remove `team_leader` case from `getNav()`.
- **`src/App.tsx`**: Remove imports and routes for Team-specific pages (`/team-leads`, `/team-follow-ups`, `/team-stb`, `/team-management`, `/team-reports`)

### 3. Dashboard
- **`src/pages/Index.tsx`**: Remove `team_leader` case. Manager renders `ManagerDashboard`.
- **`src/components/dashboards/ManagerDashboard.tsx`**: Merge TL dashboard features into it -- add agent activity monitoring section (login status, daily target progress per agent) from TLDashboard into the Group Health section
- **Delete** `src/components/dashboards/TLDashboard.tsx`

### 4. Group Management Page (merge TL team mgmt into it)
- **`src/pages/GroupManagementPage.tsx`**: Already has TL overview with expandable agents, notes, flags, targets. Add direct agent-level management features from TeamManagementPage (agent notes, agent flags, agent target setting) so the Manager can manage agents directly without going through TL abstraction.

### 5. Shared Pages (role checks)
- **`src/pages/LeadsPage.tsx`**: Change `role === "team_leader"` to `role === "manager"` (already uses team-1 data)
- **`src/pages/FollowUpsPage.tsx`**: Same change
- **`src/pages/STBPage.tsx`**: Same change
- **`src/pages/LeadDetailPage.tsx`**: Change all `role === "team_leader"` checks to `role === "manager"`. Merge TL badge + Manager badge into single "Manager" badge in timeline. Keep override logic (manager can override).

### 6. Audit Trail & Staff Management
- **`src/pages/AuditTrailPage.tsx`**: Remove `"team_leader"` from roles filter, update mock data actorRole references from `"team_leader"` to `"manager"`
- **`src/pages/StaffManagementPage.tsx`**: Remove "Team Leader" as a creatable role (Cluster Head creates Managers who directly manage agents)
- **`src/pages/admin/AdminStaffPage.tsx`**: Same -- rename "Team Leader" tab to reflect merged role or remove

### 7. Delete TL-only Pages
- Delete `src/pages/TeamLeadsPage.tsx`
- Delete `src/pages/TeamFollowUpsPage.tsx`
- Delete `src/pages/TeamSTBPage.tsx`
- Delete `src/pages/TeamManagementPage.tsx`
- Delete `src/pages/TeamReportsPage.tsx`

### 8. Mock Data
- **`src/data/mockData.ts`**: Update any `team_leader` notification type references to `manager`

## Files Touched
- **Edit**: ~12 files (types, context, sidebar, App.tsx, Index, ManagerDashboard, GroupManagementPage, LeadsPage, FollowUpsPage, STBPage, LeadDetailPage, AuditTrailPage, StaffManagementPage, AdminStaffPage, mockData)
- **Delete**: 6 files (TLDashboard, 5 Team* pages)

