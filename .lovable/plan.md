# Plan: Hi-Fidelity Theme Overhaul (Indigo/Violet SaaS)

## Summary
Replace the lo-fi grayscale wireframe aesthetic with a polished hi-fidelity design system inspired by the reference: white surfaces, indigo/violet primary, soft neutral grays, colored status pills (green/amber/red/blue), rounded corners, subtle shadows, and a clean sans-serif typeface.

## Visual Direction (from reference)
- **Primary**: Indigo/violet `#6366F1` (used for buttons, active nav, accents)
- **Background**: `#F8FAFC` page, `#FFFFFF` cards
- **Text**: `#0F172A` primary, `#64748B` muted
- **Borders**: `#E2E8F0` solid (no more dashed)
- **Status colors**: green `#10B981`, amber `#F59E0B`, red `#EF4444`, blue `#3B82F6`
- **Typography**: Inter (replaces Architects Daughter)
- **Radius**: `0.5rem` (8px) instead of 2px
- **Shadows**: subtle elevation on cards, dropdowns, dialogs

## Changes

### 1. `src/index.css` — Complete rewrite of design tokens
- Swap font import: Inter (Google Fonts) instead of Architects Daughter
- Update `:root` HSL tokens:
  - `--background: 210 40% 98%`
  - `--foreground: 222 47% 11%`
  - `--card: 0 0% 100%`
  - `--primary: 239 84% 67%` (indigo-500)
  - `--primary-foreground: 0 0% 100%`
  - `--secondary: 210 40% 96%`
  - `--muted-foreground: 215 16% 47%`
  - `--border: 214 32% 91%`
  - `--input: 214 32% 91%`
  - `--ring: 239 84% 67%`
  - `--radius: 0.5rem`
  - `--success: 160 84% 39%` (emerald)
  - `--warning: 38 92% 50%` (amber)
  - `--destructive: 0 84% 60%` (red)
  - `--info: 217 91% 60%` (blue)
  - Sidebar tokens → white sidebar with indigo active state
- Update `.dark` mode to a matching dark indigo palette
- **Remove the entire `@layer components` lo-fi override block** (dashed borders, cross-hatch bg-primary, italic labels, forced wireframe styling on buttons/inputs/tables/cards)
- Keep `* { @apply border-border }` and body base
- Set body font to Inter

### 2. `tailwind.config.ts` — Minor polish
- No structural change required (already token-driven)
- Add `fontFamily.sans: ['Inter', 'system-ui', 'sans-serif']`
- Confirm `borderRadius` chain still works with the new larger `--radius`

### 3. Component sweep — Replace hardcoded colors
Search & update any components using hardcoded gray hex/tailwind grays for status that should be semantic. Touch points expected:
- `src/components/AppSidebar.tsx` — active nav state to use primary indigo background tint
- `src/components/dashboards/*` — stat cards, ensure they use `bg-card`, `text-muted-foreground`, colored accents for KPIs
- `src/pages/LeadAllocationPage.tsx`, `LeadsPage.tsx`, `STBPage.tsx` — status badges use semantic `success/warning/destructive/info` variants
- `src/components/ui/badge.tsx` — add `success`, `warning`, `info` variants alongside default/secondary/destructive
- Priority badges (hot/warm/cold) → red/amber/blue pills

### 4. Memory update
- Update `mem://style/ui-ux-direction` from "lo-fi wireframe / dashed / grayscale" to "hi-fi SaaS / indigo primary / Inter / soft shadows"
- Update `mem://index.md` Core rules accordingly

## Out of Scope
- No layout/structure changes — purely visual theme
- No new features
- No dark-mode toggle UI (tokens updated but trigger remains as-is)

## Technical Notes
- All shadcn components consume CSS vars, so token swap propagates automatically to ~95% of the UI
- The lo-fi override block in `index.css` is the single biggest source of the wireframe look — removing it instantly restores hi-fi appearance
- Badge variants need explicit additions because `success/warning/info` aren't in shadcn defaults
