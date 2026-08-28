# Demo-Ready LMS: Functional Lifecycle, Credit Bureau Pull, Partner API

Goal: by tomorrow the prototype behaves like a working loan management platform — every action changes real state, survives refresh, and the full lead lifecycle can be demonstrated end to end for any role.

## 1. Make the app actually stateful (foundation)

Today all leads, batches, STB records and allocations live in a module-level array (`src/data/mockData.ts` exports `leads` directly), so most screen actions only fire a toast plus an audit entry and are lost on refresh. Confirmed examples: saving a credit score only writes an audit log, added banks/loans/STB records live in local component state on the lead page.

Fix: introduce a single `LmsDataProvider` (React context + localStorage persistence) that owns leads, batches, allocations, STB submissions, follow-ups, call logs, notes and notifications. Every page reads from it via selector hooks instead of importing `leads`. Adds:

- All mutations (log call, disposition, credit pull, bank select, submit, reassign, allocate, follow-up complete) write through the store, so lists, dashboards, KPIs and reports update instantly and consistently.
- Derived stage/priority recomputed automatically after each action.
- "Reset demo data" in the profile menu to return to a clean state between client walkthroughs.

## 2. Credit bureau: replace manual score with Experian Griffith (simulated sandbox)

- Remove the manual credit-score input from the Lead Detail page.
- New "Fetch Credit Report" action calling a simulated Experian Griffith sandbox service (`src/services/experianSandbox.ts`): realistic latency, deterministic per-PAN results, occasional "no-hit"/"error" cases so error handling is demonstrable.
- Returns a full report: score + band, score factors, trade lines (lender, type, sanctioned/outstanding, EMI, DPD history), enquiries last 6/12 months, total obligations, bureau reference ID and pull timestamp.
- New Credit Report panel/drawer on the lead page: score gauge, band, factors, accounts table, enquiry summary, "Bureau: Experian Griffith (Sandbox) · Ref ####" footer, plus "Re-pull" with a cooldown note.
- Fetched obligations auto-populate existing loans and recompute FOIR, which then feeds partner eligibility — no manual entry.
- Score, FOIR and DPD flow into the priority engine and BRE eligibility so downstream screens stay consistent.

## 3. Lending partner integration: simulated partner API + live status updates

- Remove manual STB status/amount entry. "Submit to Lending Partner" calls a simulated partner API (`src/services/partnerApi.ts`) per selected partner-product pair.
- Response: application reference number, decision (`approved` / `declined` / `pending review`), sanction amount, ROI, tenure, decision reasons — driven by the partner's BRE thresholds against the bureau data, so decisions look logical.
- Webhook-style progression: a background simulator advances `submitted → under review → approved/declined → disbursed` on timers, pushing notifications and audit entries, so statuses visibly change during the presentation.
- Lead stage, STB pages (agent/group/org) and dashboard KPIs follow these updates automatically.
- Partner config screen keeps CRUD, and eligibility uses each partner's own thresholds.

## 4. Full lifecycle QA pass and fixes

Walk and fix the entire lifecycle for each of the five roles, in the browser:

```text
Upload batch -> validate/map -> ingest -> allocate (incl. split) ->
agent worklist -> call + disposition -> follow-up scheduling ->
credit pull (Experian) -> BRE eligibility -> select partners ->
submit to lending partner -> decision -> disbursed -> reports/MIS/audit
```

For each step: confirm the action mutates state, the lead moves stage correctly, invalid transitions are blocked with a clear reason, and the audit trail records actor + role. Fix broken links, stale routes, dead buttons, empty screens, and any page still reading stale mock arrays. Verify guards for Agent, Manager, Cluster Head and Data Admin by direct URL.

## 5. Presentation polish

- Consistent loading, empty and error states for every async action (credit pull, submit, upload, export).
- Obvious primary action per stage on the lead page; secondary actions grouped.
- Dashboards, reports and MIS export driven by live store data so numbers reconcile across screens.
- Responsive check at 375 / 768 / 1280.
- Keep the existing minimal indigo/Inter aesthetic — no new colour system.

## Technical notes

- New: `src/contexts/LmsDataContext.tsx`, `src/services/experianSandbox.ts`, `src/services/partnerApi.ts`, `src/lib/leadLifecycle.ts` (stage transition rules), `src/components/CreditReportPanel.tsx`, `src/components/StbTracker.tsx`.
- `src/data/mockData.ts` becomes seed data only; pages stop importing mutable `leads`.
- No backend, no real network calls; both services are local simulators with realistic latency and clear "Sandbox" labelling in the UI.
- Existing audit, permissions, partners and priority-config contexts are reused, not replaced.

## Sequence

1. Data store + wiring existing pages (unblocks everything else)
2. Experian sandbox service + credit report UI + FOIR/BRE feed
3. Partner API + status simulator + STB screens
4. Lifecycle QA sweep per role, fixes
5. Polish and final browser verification of the full flow
