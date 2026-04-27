## Goal
Redesign **Lead Detail page** (`src/pages/LeadDetailPage.tsx`) to match the uploaded reference — clean, spacious, modern, with clear segmentation and breathing room. The current page is dense and visually busy; the reference uses generous padding, pill badges, simple white cards with subtle borders, and a clear 3-column grid.

## Visual changes (matching the reference)

### 1. Leads sidebar (left)
- Replace dashed borders with clean solid borders (`border-r border-border`).
- Header row: "Leads" label + collapse chevron in a flat container — no busy borders.
- Wider sidebar (`w-80` instead of `w-72`) for breathing room.
- Each lead item: `px-4 py-3.5`, larger spacing.
  - Row 1: Lead name (semibold) + stage pill on the right (e.g. `New`, `Interested`, `Contacted`) using soft tinted backgrounds (`bg-blue-50 text-blue-700`, `bg-amber-50 text-amber-700`, `bg-emerald-50 text-emerald-700`).
  - Row 2: Product name (e.g. "Business Loan") on left, "2d" aging on right — both `text-xs text-muted-foreground`.
- Active lead: soft `bg-primary/5` background + left indigo accent bar.
- Remove the "Stage + Product + days" triple badge stack — it's too noisy.

### 2. Header section
- Replace the dense action bar with the reference layout:
  - **Top row**: "← Back to Leads" (ghost link, left) | spacer | `Log Call` (primary indigo, filled) · `Send to Bank` (outlined) · `EMI Calculator` (outlined) — all in same row, right-aligned.
- **Name row**: Large `text-2xl font-semibold` name + small "Source: Facebook" inline (only for non-agent roles, already gated). Right side: subtle outlined `Edit` button.
- **Status pills row** (directly under name): `New` (soft blue pill) and `Cold` (soft cyan pill) sitting side-by-side as standalone tinted chips — not full Badges. Drop the Lead-ID badge here (move into sidebar/secondary metadata).

### 3. Three-column main grid
Change from current dense layout to balanced **3 equal columns** with `gap-6`:

**Column 1 — Customer Profile (titled "Leads" with user icon in reference)**
- Card title with icon in a tinted square (e.g. small rounded `bg-primary/10` wrapper).
- Drop the section dividers (Contact / Address / Employment / Loan Requirement). Reference shows a single flat key-value list with consistent row spacing (`py-2.5`), label left in muted gray, value right in foreground.
- Keep all current fields, but render as one clean list separated only by hairline `divide-y divide-border/60`.
- Bottom action: full-width primary `Save` button (only when editing) — matches reference's prominent indigo button.

**Column 2 — Credit & Obligations + Bank/NBFC Selection**
- Stack two cards vertically.
- **Credit & Obligations card**: title + icon, "Credit Score" label with input + small `Save` button inline. "Existing Loans" subheader, then loan items as soft outlined mini-cards (rounded, `border bg-muted/30`, `p-3`) showing partner — product / outstanding / EMI / tenure. Footer: full-width dashed `+ Add Existing Loan` button.
- **Bank / NBFC Selection card**: Product Type select + Bank/NBFC select stacked, full-width `+ Add` button (outlined), then selected pairs as soft pill chips with × remove (e.g. `Home Loan → HDFC Bank ⓧ`).

**Column 3 — STB Status + Notes**
- **STB Status card**: title + icon, then list of submissions as a simple two-line row: "HDFC Bank" + "Submitted" pill on right, second line "Home Loan Application" + date.
- **Notes card**: title + icon, textarea "Add a note…" with small `+ Add` primary button below (full width). Past notes listed below as flat rows: bold note text, then "Author · timestamp" muted line.

### 4. Activity History (full-width below the 3-column grid)
- Single full-width card.
- Title "Activity History" + tabs: `All 04 · Call 04 · Follow-up 04 · STB 04` (counts in subtle gray pills, active tab gets indigo underline — not filled background).
- Each event row:
  - Left: small circular tinted icon (`h-8 w-8 rounded-full bg-muted`) with type icon (phone / clock / file / note).
  - Middle: type pill (e.g. `Follow-up` soft blue) + bold event title on same line, then muted description below.
  - Right: status pill (`Pending` amber, `Completed` emerald) + timestamp underneath.
- Generous `py-4 px-5` per row, `divide-y` between rows.

### 5. Spacing & surfaces
- Outer wrapper: `space-y-6`, remove the `-m-6` negative margin trick if it forces tight layout; use proper container padding instead.
- All cards: `shadow-none border border-border rounded-lg` (already mostly there).
- Card headers: `px-5 pt-5 pb-3` with title + leading icon in a tinted square.
- Card content: `px-5 pb-5`.

### 6. Status pill styling (reusable)
Introduce small inline helpers (local to the file, no new component file needed) for consistent soft pills:
- `New` → `bg-blue-50 text-blue-700`
- `Interested` → `bg-emerald-50 text-emerald-700`
- `Contacted` → `bg-amber-50 text-amber-700`
- `Hot` / `Warm` / `Cold` → red / amber / cyan soft tints
- `Submitted` → `bg-emerald-50 text-emerald-700`
- `Pending` → `bg-amber-50 text-amber-700`
- `Completed` → `bg-emerald-50 text-emerald-700`

These replace the current `Badge variant="destructive|default|secondary"` for status — softer and more modern.

## Files to edit
1. `src/pages/LeadDetailPage.tsx` — main redesign (sidebar, header, 3-col grid, activity history, pill styling).

## Out of scope
- Leads list page (`LeadsPage.tsx`) — already updated previously and unchanged.
- No data model changes — purely visual/layout.
- No new shared components — keep refactor contained to the one page.

## Acceptance check
After implementation, navigate to `/leads/lead-1` as an Agent and confirm: clean 3-column grid, spacious sidebar with stage pills, soft status chips under the name, prominent primary `Log Call` button, and activity timeline with circular icons and right-aligned status pills — visually matching the reference.