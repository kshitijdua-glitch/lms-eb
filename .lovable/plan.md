## Change

On `src/pages/FollowUpsPage.tsx`, in each follow-up card's action row:

1. **Remove** the "Call" button (and its `handleCall` handler + the `Phone` icon import if unused elsewhere).
2. **Rename** the "Complete" button to "Contact". Clicking it navigates to the lead detail page (`/leads/:leadId`) instead of marking the follow-up complete locally.
   - Use a contact-appropriate icon (e.g. `UserRound` from lucide-react) in place of `Check`.
   - Keep `handleComplete` removed (or repurpose as `handleContact` that just navigates and logs an audit entry `view_lead_from_followup`).
3. Keep the "Reschedule" button as-is.
4. Since "Complete" is gone, also drop the `completedLocal` state and the related logic that moved items into the Completed bucket via local state — completed bucket will now reflect only `f.status === "completed"` from mock data. The Completed tab itself stays.

## Files

- `src/pages/FollowUpsPage.tsx` — only file touched.

## Notes

- Audit logging is preserved (a `view_lead_from_followup` entry is written when Contact is clicked).
- No changes to types, mock data, or other follow-up pages (Group/Org follow-ups are untouched per scope).
