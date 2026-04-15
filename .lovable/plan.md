

# Plan: Add Lead List Shortcut Panel on Lead Detail Page

## Summary
Add a collapsible/popover lead list panel on the lead detail page that lets users quickly browse and switch between leads without going back to the leads list page. Shows basic info (name, stage, product, days since activity) for each lead.

## What Changes

### `src/pages/LeadDetailPage.tsx`

1. **Add a "Browse Leads" button** in the header area (next to the Back button) that opens a Sheet (slide-out panel) from the left side.

2. **Sheet content**: 
   - Search input at top to filter leads by name
   - Scrollable list of leads (same dataset as LeadsPage — role-filtered)
   - Each list item shows: Name, Stage badge, Product badge, Days since last activity
   - Current lead is highlighted
   - Clicking a lead navigates to `/leads/{id}` (closing the sheet)

3. **Imports**: Add `Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger` from UI, `List` icon from lucide, and `getLeadsForAgent` from mockData.

4. **State**: Add `leadListSearch` state for filtering the lead list, and `showLeadList` for sheet open state.

### No other files change.

## Technical Notes
- Uses the existing `Sheet` component for the slide-out panel
- Filters leads by role (agent sees only their leads, others see all)
- List is capped at ~50 items for performance
- Current lead gets a distinct background highlight

