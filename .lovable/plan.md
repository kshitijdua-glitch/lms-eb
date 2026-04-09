
# Smart LMS — Working Prototype Plan

## Overview
A complete UI/UX prototype of the Smart LMS with mock data, covering both the **LMS Portal** (Agent/TL/Manager/Cluster Head) and **Admin Portal** (Data Admin). Role switching via a dropdown selector (no auth needed for prototype).

---

## 1. App Shell & Navigation
- **Sidebar layout** with role-aware navigation (different menu items per role)
- **Role switcher** dropdown in the header to toggle between: Agent, Team Leader, Manager, Cluster Head, Data Admin
- Admin Portal gets a separate sidebar section/theme to visually distinguish it
- Responsive design for mobile agent access

## 2. LMS Portal — Agent Workspace

### 2.1 Agent Dashboard (Home)
- KPI cards: Missed Follow-Ups, Today's Follow-Ups, Leads Worked Today, STB Count (Month), Approved (Month), Disbursed Count & Amount (Month)
- Quick-nav buttons: My Leads, My Follow-Ups, My STB
- Missed follow-ups list with click-to-open

### 2.2 My Leads View
- Table of assigned leads with columns: Name, Mobile (masked), Last Disposition, Last Activity, Days Since Allocation, Pipeline Stage
- Filters: Date range, Disposition type, Income bracket, Product type, Search by name/ID
- Click any row to open Lead Detail

### 2.3 Lead Detail Screen
- **Customer Profile**: Name, masked mobile/PAN, DOB, city, employment type, income, obligations, auto-calculated FOIR
- **Bureau Section**: Credit score display, bureau report status (mock data)
- **Eligibility Section**: BRE results showing eligible/ineligible partners with reasons
- **Action Panel**: Log Call button (opens call log form), Disposition selector, STB initiation, EMI calculator, Notes field
- **History Timeline**: Full disposition and call log history with actor badges (Agent/TL/Manager)

### 2.4 Call Logging Modal
- Date/time, call outcome (Connected/Not Connected), duration, notes, mandatory disposition selector, next action (follow-up/STB/close)

### 2.5 Manual Lead Creation
- Simple form: Name, Mobile, Product Type → auto-assigns to agent

## 3. BRE + Send to Bank (STB)

### 3.1 BRE Eligibility Check
- Toggle between Basic Eligibility and Bureau Rules modes
- Results panel showing eligible partners with product type and estimated loan range
- Disqualification reasons per ineligible partner
- Recommended partner ranking

### 3.2 STB Flow
- Pre-STB validation checklist (mandatory fields, bureau report, BRE result, consent)
- Consent initiation button with status tracking (Consent Sent → Received)
- Bank selection and submission
- Post-STB status tracker: Consent Sent → Application Submitted → Approved/Declined → Disbursed
- Multi-bank approach: same lead can be submitted to multiple partners

## 4. Follow-Up & Retry Engine

### 4.1 Follow-Up Queue Page
- Tab/page showing all follow-ups due today, sorted by time
- Missed follow-ups highlighted at top
- Filters by priority (Hot/Warm/Cold), product type, date
- Click to open lead detail directly

### 4.2 Retry Logic Display
- Auto-scheduled retries visible on lead detail for "Not Contactable" leads
- Retry count and escalation indicator (after 5 consecutive failures → TL review)

### 4.3 Lead Aging Indicators
- Days since allocation and days since last activity shown on lead rows
- Visual badges (green/yellow/red) based on aging thresholds

## 5. Dashboards & Reporting

### 5.1 Team Leader Dashboard
- Team-level rollup of agent KPIs
- Follow-up compliance rate chart
- Disposition breakdown by agent (bar chart)
- Aging alerts list
- Daily activity table by agent
- Lead reassignment log

### 5.2 Manager Dashboard
- Conversion funnel visualization: Allocated → Contacted → STB → Approved → Disbursed
- Bank-wise STB pipeline table
- Approval rate by partner (bar/pie chart)
- Lead count report with date-wise breakdown

### 5.3 Cluster Head Dashboard
- Source-wise lead quality chart
- Agent productivity ranking table
- Partner-wise disbursal summary
- Daily/Weekly/Monthly trend charts with period selector
- Predictive analytics cards: Lead Score, Drop-off Analysis, Disbursal Forecast

## 6. Admin Portal

### 6.1 Lead Upload & Management
- CSV upload interface with drag-and-drop
- Lead pool view with deduplication flags
- Bulk allocation tool: select leads → assign to agents/teams (round-robin or manual)

### 6.2 Agent Management
- Agent list with status (Active/Inactive), team assignment, TL mapping
- Create/edit agent profiles

### 6.3 Configuration Pages
- Disposition categories and sub-types editor
- BRE rules configuration per lending partner
- Lending partner management (add/edit partners with integration type)
- Product type configuration

### 6.4 MIS & Reports
- Export buttons (CSV) on all data views
- Bureau campaign management view
- Audit trail viewer (recent actions log)

## 7. Mock Data
- 50+ sample leads across various stages and dispositions
- 5 lending partners with different BRE rules
- 10 agents across 2 teams with 2 TLs, 1 Manager
- Realistic disposition histories and call logs
- Dashboard metrics derived from mock data

## 8. Design & UX
- Professional, clean design with a blue/navy primary palette suitable for fintech
- Data-dense but organized layouts — tables, cards, and charts
- Masked PII fields (PAN: XXXX1234, Mobile: XXXXXX7890)
- Status badges with color coding throughout
- Toast notifications for actions (call logged, lead submitted, etc.)
