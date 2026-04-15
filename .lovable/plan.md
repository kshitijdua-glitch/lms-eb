

# Plan: Replace Stage Dropdown with Tabs on All Lead Pages

## Summary
Replace the stage filter dropdown with a horizontal tab bar at the top of all lead listing pages. Each tab shows a stage name with a count badge. The "All" tab is the default.

## What the User Gets
- A horizontal scrollable tab bar above the filters: **All (25) | New (8) | Contacted (5) | Interested (3) | BRE Done (2) | STB Submitted (2) | Approved (1) | Declined (1) | Disbursed (2) | Closed (1)**
- Clicking a tab instantly filters the table to that stage
- The stage dropdown is removed from the filter row
- All other filters (product, source, follow-up, agent, search) remain as dropdowns

## Changes

### Files to Edit (3 pages)

1. **`src/pages/LeadsPage.tsx`**
   - Remove stage `<Select>` dropdown from filter row
   - Add a `<Tabs>` component (already exists in `src/components/ui/tabs.tsx`) above the filters
   - Each `TabsTrigger` shows stage label + count badge computed from `allLeads`
   - `stageFilter` state driven by tab value instead of dropdown
   - "All" tab is default, shows total count

2. **`src/pages/GroupLeadsPage.tsx`**
   - Same change: replace stage dropdown with tabs bar
   - Counts computed from `allLeads` (pre-filter, so counts don't change when other filters are applied)

3. **`src/pages/OrgLeadsPage.tsx`**
   - Same change

### Layout
```text
┌─────────────────────────────────────────────────┐
│ [All (25)] [New (8)] [Contacted (5)] [...]  ... │  ← tabs row
├─────────────────────────────────────────────────┤
│ [Search...] [Product ▾] [Source ▾] [F/U ▾]      │  ← filters (no stage)
├─────────────────────────────────────────────────┤
│ Table                                            │
└─────────────────────────────────────────────────┘
```

### Technical Details
- Uses existing `Tabs`, `TabsList`, `TabsTrigger` from Radix
- Tab counts are computed from total leads (not filtered), so they always reflect the full dataset per stage
- Stages array: `["all","new","contacted","interested","bre_done","stb_submitted","approved","declined","disbursed","closed_lost"]`
- `TabsList` gets `className="w-full justify-start overflow-x-auto"` for horizontal scroll on smaller screens

