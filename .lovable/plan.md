

# Plan: Update Team Leader Flow Per TL PRD

## Summary
The current TL view is a basic dashboard with 4 KPI cards, agent activity chart, disposition pie chart, and aging alerts. The PRD defines the TL as a dual-role (producer + supervisor) with extensive team management, lead reassignment, agent monitoring, target setting, performance reporting, and lead count reports. This plan brings the TL portal in line with the PRD.

## Gap Analysis

**Current state:** Single `TLDashboard.tsx` with basic team stats. TL shares the same `/leads`, `/follow-ups`, `/stb` pages as agents with no team-specific views. No team management, no reassignment, no agent notes/flags, no target setting, no lead count report, no TL-specific performance view.

**What needs to be built:**

1. **Dashboard** — Split into Own Production widgets (same as Agent) + Team Health widgets (missed FUs, compliance rate, agent activity status with login/zero-activity indicators, team STB/disbursed). Add 9 quick-nav buttons.

2. **My Team Leads** — New page/tab at `/team-leads` with all team leads, Assigned Agent column, full filter set (agent, date range, stage, disposition, product, source, follow-up status, aging threshold, search). Bulk selection + Reassign Selected action.

3. **My Team Follow-Ups** — New page/tab at `/team-follow-ups` with agent column, priority filters, escalation badges for 5+ NC leads.

4. **My Team STB** — New page/tab at `/team-stb` with agent column, bank column, days since submission, inline status updates.

5. **Team Management** — New page at `/team-management` with agent overview table (login status, leads assigned, worked today, FU compliance, STB, disbursed, last activity). Click agent row to filter team leads. Agent activity monitoring (calls today, disposition breakdown, missed FUs, overdue leads).

6. **Lead Reassignment** — Reassign button on lead detail (when TL views team agent's lead). Single reassignment with agent dropdown + optional reason. Bulk reassignment from team leads view. Restrictions: same team only, no reassigning own leads, no reassigning STB-locked leads.

7. **Agent Notes & Flags** — Agent profile card accessible from Team Management. Add dated notes (immutable). Flag types: On Leave, Performance Watch, Disposition Quality Issue, Training Required, DND Violation Risk. Flags removable by TL.

8. **Daily Target Setting** — From Team Management, set per-agent daily targets (Calls, FUs, STBs, Leads to Work). Actual vs target display. Repeat daily option.

9. **Lead Count Report** — New page at `/team-reports` with date range, agent, product, disposition filters. Table: date, agent, disposition category/sub-type, count. Summary row. CSV export.

10. **Performance Reporting** — Own performance (reuse agent Performance page). Agent performance history (per agent, 12 months, with trend chart). Team performance summary table (all agents side by side for current month, sortable). CSV export.

11. **TL Disposition on Agent Leads** — When TL views an agent's lead, dispositions are tagged as "TL" type in history. TL Not Eligible locks STB. TL Closed/Lost archives lead.

12. **TL Notifications** — Extend notification mock data with team events: agent missed FU, 5-NC escalation, team lead expiry, agent not logged in, STB initiated by agent, STB status updates.

## Implementation Steps

### 1. Update Navigation & Routes
- Add TL nav items: My Leads, My Follow-Ups, My STB, Team Leads, Team Follow-Ups, Team STB, Team Management, Lead Count Report, Performance
- Add routes: `/team-leads`, `/team-follow-ups`, `/team-stb`, `/team-management`, `/team-reports`

### 2. Revamp TL Dashboard
- Split into two sections: "My Production" (6 KPI cards mirroring agent) and "Team Health" (7 widgets per PRD)
- Agent Activity Status list with login indicators and zero-activity alerts
- 9 quick-nav buttons

### 3. Build Team Leads Page
- Full table with Assigned Agent column and all PRD filters
- Checkbox selection + Reassign Selected button
- Reuse lead row components from LeadsPage

### 4. Build Team Follow-Ups & Team STB Pages
- Team Follow-Ups: agent column, escalation badges for 5+ NC
- Team STB: agent column, bank column, inline status updates

### 5. Build Team Management Page
- Agent overview table with all PRD columns
- Click agent row to filter team leads
- Agent activity monitoring panel (calls today, disposition breakdown)
- Agent profile card with notes (immutable, timestamped) and flags
- Set Targets modal per agent

### 6. Add Lead Reassignment
- Reassign button on LeadDetailPage when role=TL and lead belongs to team agent
- Agent dropdown (same team, exclude current assignee)
- Optional reason field
- Mock reassignment with history log entry
- Bulk reassignment from Team Leads page

### 7. Build Lead Count Report Page
- Date range, agent, product, disposition filters
- Aggregated table with summary row
- CSV export button

### 8. Enhance TL Performance Page
- Own performance (reuse agent view)
- Agent selector to view individual agent history
- Team summary table (all agents, current month)

### 9. Update Notifications for TL
- Add team-specific notification types to mock data
- Show team notifications in the existing NotificationsDrawer

### 10. TL Disposition Tagging
- When TL logs call/disposition on agent lead, tag as "TL" in history
- Visual badge in timeline showing TL vs Agent actions

## Technical Notes
- All client-side mock data, no backend changes
- ~5 new page files, ~3 modified files
- Reuse existing table/card/chart components
- TL inherits all agent functionality on own leads — reuse agent pages with role checks

