

# Plan: Remove TL Role, Make Manager Directly Manage Agents

## Summary
The current data model still has a TL (Team Leader) abstraction: `teams` have a `tlId`, agents have `tlId`/`tlName` fields, and the GroupManagementPage shows a TL-level overview with expandable agent rows. Since TL no longer exists, the Manager directly manages all agents. The page should show a flat agent table with direct notes, flags, and target management per agent.

## Changes

### 1. Data Model (`src/types/lms.ts`)
- **Agent**: Remove `tlId` and `tlName` fields. Keep `teamId`/`teamName` (team = the manager's group).
- **Team**: Remove `tlId` and `tlName`. Rename concept to "Group" -- fields become `id`, `name`, `managerId`, `managerName`, `agentCount`.

### 2. Mock Data (`src/data/mockData.ts`)
- Update `teams` array: replace `tlId`/`tlName` with `managerId`/`managerName`.
- Update `agents` array: remove `tlId`/`tlName` fields. agent-9 and agent-10 become regular agents or the manager identity.
- Update helper functions `getLeadsForTeam`, `getAgentsForTeam` accordingly.

### 3. GroupManagementPage -- Complete Rewrite
- Remove TL-level grouping. Show a **flat agent table** with columns: Agent Name, Status, Leads, Worked Today, Calls Today, Missed F/U, STB, Disbursed, Last Activity, Actions.
- Actions per agent: Set Targets (target icon), Profile/Notes/Flags (message icon), View Leads.
- **Agent Profile Dialog**: flags (add/remove from predefined list), notes (add/view), quick stats for that agent.
- **Agent Targets Dialog**: set Calls, Follow-Ups, STBs, Leads to Work per agent.
- Remove all TL-specific state variables and data structures.

### 4. Update All TL References Across Pages
- **GroupLeadsPage**: Remove TL filter dropdown. Show agent filter only.
- **GroupFollowUpsPage**: Same -- remove TL filter.
- **GroupSTBPage**: Remove TL filter, remove TL column from table.
- **GroupReportsPage**: Remove TL column and TL summary rows. Report by Agent only.
- **ManagerDashboard**: Remove any TL references in agent activity section.
- **OrgLeadsPage, OrgFollowUpsPage, OrgSTBPage, OrgReportsPage**: Replace TL filter/column with Manager filter/column (Manager → Agent cascading instead of Manager → TL → Agent).
- **StaffManagementPage**: Remove TL tab if present.
- **AdminStaffPage**: Remove TL tab.
- **LeadDetailPage**: Remove TL references in reassignment and timeline.
- **AuditTrailPage**: Remove TL from actor role filters.

### 5. Sidebar & Context
- **AppSidebar.tsx**: Remove any remaining TL label references.
- **RoleContext.tsx**: Ensure no TL references remain.

## Files Touched
- **Edit**: ~15 files (types, mockData, GroupManagementPage, GroupLeadsPage, GroupFollowUpsPage, GroupSTBPage, GroupReportsPage, ManagerDashboard, OrgLeadsPage, OrgFollowUpsPage, OrgSTBPage, OrgReportsPage, StaffManagementPage, AdminStaffPage, LeadDetailPage, AuditTrailPage, AppSidebar, RoleContext)
- **Delete**: None

