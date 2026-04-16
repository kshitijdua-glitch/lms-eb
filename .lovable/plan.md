

# Plan: Auto-Priority Scoring Engine with Customizable Rules

## Summary
Add a rule-based priority engine that auto-calculates lead priority (hot/warm/cold). Cluster Head and Data Admin roles can customize the scoring weights and thresholds from a settings UI.

## Changes

### 1. New: `src/utils/priorityEngine.ts`
- `calculatePriority(lead, config)` pure function that scores leads
- Default scoring config object with factors and weights:
  - Loan amount, income, credit score, FOIR, disposition type, days since activity, retry count
- Score thresholds: ≥ 5 = hot, 2–4 = warm, < 2 = cold

### 2. New: `src/contexts/PriorityConfigContext.tsx`
- Context holding the scoring config (weights, thresholds) in state
- Cluster Head and Data Admin can modify; other roles get read-only defaults
- Persisted in-memory (mock prototype)

### 3. `src/data/mockData.ts`
- Replace `randomFrom(priorities)` with `calculatePriority(lead)` using default config

### 4. `src/pages/LeadDetailPage.tsx`
- Show priority badge with tooltip explaining scoring factors
- Add "Recalculate" button to re-run engine
- Add manual override dropdown (manager+ and cluster head+ only)

### 5. New section in `src/pages/SystemConfigPage.tsx` or `src/pages/ReportsPage.tsx`
- Add a "Priority Rules" tab accessible to Cluster Head and Data Admin
- UI to adjust:
  - Factor weights (sliders or number inputs for each scoring factor)
  - Score thresholds for hot/warm/cold cutoffs
  - Toggle individual factors on/off
- Save button applies changes app-wide via context
- Shows a preview of how current leads would be re-distributed (e.g., "Hot: 12, Warm: 25, Cold: 8")

### 6. `src/components/AppSidebar.tsx`
- No changes needed — config is accessed via existing System Config or Reports page

## Technical Notes
- Config stored in React context (no backend)
- Only Cluster Head and Data Admin can edit rules; all roles benefit from calculated priorities
- Agent and Manager can see priority + override individual leads, but cannot change the rules
- The engine is a pure function — easy to move server-side later

