

# Plan: Update Agent Flow Per PRD

## Summary
Align the agent portal with the detailed Agent PRD. The current prototype covers the basics but is missing several key features and details specified in the PRD.

## Gap Analysis

**What exists and needs enhancement:**
- Dashboard: Missing "Total Assigned Leads" widget, "Create New Lead" quick-nav, lead expiry warnings, motivational daily target tracker
- My Leads: Missing Source column, Follow-Up Scheduled column, lead source filter, follow-up status filter, sorting, lead count summary bar (total / worked today / never contacted)
- Lead Detail: Missing editable profile fields, Pin Code field, Company Name, DND status, profile lock after STB, "Check Eligibility" and "Back to Leads" action bar buttons, immutable timestamped notes (currently just a single notes field), bureau pull flow with consent SMS status, STB events and system events in history
- Call Log Modal: Missing separate date/time pickers, backdating limit (24hr), duration auto-zero for "Not Connected", "No Action" next action option already exists but missing "Schedule Follow-Up" date picker when that option is selected
- Disposition System: Current types are flat. PRD defines 9 categories with sub-types (Follow-Up: Hot/Warm/Cold/Document/Callback/Price Discussion; Not Contactable: Busy/No Response/Switched Off/Invalid/Dropped/Wrong; etc.). Need grouped disposition selector.
- STB Page: Missing Sanction Amount, Disbursement Date, Days Since Submission columns. Missing inline status update actions for non-API partners.
- Follow-Ups: Missing Lead ID, Scheduled Time column, Days Since Allocation, status column (Upcoming/Due Now/Overdue), retry schedule display per sub-type

**What is completely missing:**
- Performance History page (`/performance`) with monthly summary cards and trend chart
- Notifications panel (bell icon drawer with event list from PRD section 15)
- Manual Lead Creation form needs Lead Source field, Loan Amount, City, Income, Notes, and duplicate check warning

## Implementation Steps

### 1. Update Types and Disposition System
- Expand `DispositionType` to include all PRD sub-types (hot_follow_up, warm_follow_up, cold_follow_up, document_follow_up, callback_requested, price_discussion_pending, number_busy, no_response, invalid_number, call_dropped, already_has_loan, does_not_need, rate_too_high, will_decide_later, chose_competitor, language_barrier, hung_up, credit_score_low, income_below, age_outside, pin_not_serviceable, too_many_loans, high_dpd, recent_writeoff, dnd_registered, pan_not_available, income_proof_not_ready, address_proof_pending, bank_statement_not_available, photo_id_missing, stb_qualified, duplicate, closed_sanctioned_elsewhere, closed_changed_mind, closed_unreachable)
- Add `pinCode`, `companyName`, `dndStatus`, `leadSource` fields to Lead type
- Add disposition category grouping to DispositionConfig
- Update mock data generator accordingly

### 2. Enhance Agent Dashboard
- Add "Total Assigned Leads" KPI widget
- Add "Create New Lead" quick-nav button
- Add lead expiry warnings section (leads expiring within 3 days)
- Add optional daily target tracker (calls logged vs target)

### 3. Enhance My Leads Page
- Add Source and Follow-Up Scheduled columns to table
- Add lead source and follow-up status filters
- Add summary bar: Total leads / Worked today / Never contacted
- Add column sorting
- Hide Export button for agent role (PRD restriction)

### 4. Revamp Lead Detail Page
- Make profile fields editable with inline edit controls; mark mandatory fields
- Add Pin Code (auto-fill State), Company Name, DND status display
- Implement profile lock indicator when STB has been initiated
- Add persistent Action Bar with: Log Call, Check Eligibility (triggers BRE), Send to Bank (with pre-STB checklist), Back to Leads
- Replace single notes field with immutable timestamped notes list + add note form
- Enhance Bureau section: pull status (Fresh/Stale/Not Pulled), Pull Bureau button with consent SMS status
- Add BRE mode toggle (Basic vs Bureau)
- Expand history timeline to show STB events, bureau pulls, status changes, system events alongside call logs and follow-ups

### 5. Revamp Call Log Modal
- Separate Date picker (max 24hr backdating) and Time picker
- Duration auto-set to 0 and disabled when outcome is "Not Connected"
- Grouped disposition selector organized by PRD categories
- Show follow-up date/time picker when "Schedule Follow-Up" is selected as next action

### 6. Enhance STB Page
- Add Sanction Amount, Disbursement Date, Days Since Submission columns
- Add inline status update dropdown for each submission (for non-API partners)
- Show multi-bank rows per lead clearly

### 7. Enhance Follow-Ups Page
- Add Lead ID, Scheduled Time, Days Since Allocation, Status (Upcoming/Due Now/Overdue) columns
- Show retry schedule info for Not Contactable leads
- Add product type and date filters

### 8. Add Performance History Page
- New route `/performance` with monthly summary cards (6 months)
- Metrics: Allocated, Contacted, Contact Rate, STB Count/Rate, Approved, Disbursed Count/Amount, Follow-Up Compliance
- Monthly trend chart (selectable metric)
- Add nav link in agent sidebar

### 9. Add Notifications Drawer
- Bell icon opens a slide-out drawer with notification list
- Mock notifications matching PRD events (follow-up due, missed, expiry warning, consent received, lead reassigned, new allocation, STB status update)
- Read/unread state, timestamps

### 10. Enhance Manual Lead Creation
- Add Lead Source (required, from configured list), Loan Amount, City, Monthly Income, Notes fields
- Add duplicate mobile check with warning toast
- Post-creation toast with DND check result

## Technical Notes
- All changes are mock/prototype-level with client-side state
- Disposition grouping will use a custom grouped select component
- Profile edit uses controlled form state with toast on save
- Performance chart will use recharts (already available via shadcn chart)
- Approximately 10 files modified, 2 new files created

