

# Plan: Add Optional Follow-Up Time to Scheduling

## Summary
Add an optional time picker alongside the mandatory follow-up date picker in the call log dialog. When scheduling a follow-up, the agent must pick a date but can optionally specify a time (hour + minute).

## What Changes

### `src/pages/LeadDetailPage.tsx`

**State**: Add `followUpTime` state (`string`, default `""`) for storing selected time (e.g. `"14:30"`).

**UI**: Below the existing Follow-Up Date calendar popover (line ~636), add an optional time input:
- An `<Input type="time" />` field labeled "Follow-Up Time (optional)"
- Same compact styling as other fields (`h-8 text-xs`)

**Logic**: In `handleLogCall`, when building the follow-up date string, combine `followUpDate` with `followUpTime` if provided. If no time is set, default to start of day. Reset `followUpTime` when dialog closes.

No other files change.

