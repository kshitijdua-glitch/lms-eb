# Product-Grade QA & Responsive Polish

Goal: remove every visual and behavioural cue that says "prototype". Verified findings below come from a live sweep of 13 routes at 375px and 1280px (no console/page errors, no page-level horizontal overflow — the problems are layout, density and consistency).

## Confirmed issues to fix

1. **Lead Detail is unusable on mobile.** The lead-list rail is a fixed `w-80` column with no breakpoint, so at 375px it fills the screen and pushes the actual lead content off-view. At 1280px the detail grid is `md:grid-cols-3` with equal columns, squeezing the Credit & Obligations column into a narrow strip (score, trade lines and buttons wrap badly).
2. **Dashboards break below `md`.** Several stat rows are fixed `grid-cols-5` / `grid-cols-3` with no smaller breakpoint (Manager and Cluster Head dashboards), producing crushed tiles on phones and tablets.
3. **Tables have no mobile story.** The shared table renders a desktop table at every width, so lead/STB/follow-up lists rely on horizontal scrolling with clipped columns.
4. **Terminology drift.** The STB page still reads "Send to Bank (STB)" and the sidebar "My STB", though the product language is "Submit to Lending Partner". Wording must be uniform across sidebar, headings, buttons, toasts and empty states.
5. **Filter/stat density.** Leads page stat tiles wrap their labels onto two lines at 375px, and stage chips plus three filter selects stack into a tall, unpolished block instead of a compact filter bar/sheet.
6. **Ad-hoc colors.** Lead Detail and Follow-Ups use ~40 hardcoded Tailwind color literals (amber/emerald/rose/violet) instead of semantic tokens, so status colors drift between screens.
7. **Browser/app metadata is wireframe-branded.** Title and description are still "EB-LMS-Wireframe" / "Wireframe EB LMS" — visible in the browser tab during a client demo.

## What will be done

**A. Responsive architecture (375 / 768 / 1280)**
- Lead Detail: collapse the lead rail into a slide-over sheet below `lg`, keep it inline on desktop; restructure the detail grid to a 4/5/3-style asymmetric layout at `xl` so the credit column has real width, single column on mobile with the action bar sticky at the bottom.
- Replace every fixed multi-column grid with a `grid-cols-2 sm: md: lg:` ladder; audit all dashboards, reports and admin pages.
- Add a shared responsive list pattern: card rows below `md`, full table at `md`+ (applied to Leads, STB, Follow-Ups, Group/Org lists, Audit Trail).
- Compact filter bar: search plus a "Filters" sheet on mobile, inline selects on desktop; scrollable single-line stage chips.

**B. Visual consistency and polish**
- Move all status/priority/stage colors into semantic tokens in `index.css` + Tailwind config, and drive the existing soft-pill component from that single map so pills match everywhere.
- Consistent page header pattern (title, count subtitle, one obvious primary action, secondary actions grouped), consistent card padding, borders and typography scale.
- Empty, loading (skeleton) and error states for every list and panel; tooltips plus `aria-label` on all icon-only buttons.
- Fix the app title/description/OG metadata to the real product name.

**C. Functional QA pass**
- Walk each role (Agent, Manager, Cluster Head, Data Admin) through its full menu: dashboard, leads, follow-ups, submissions, reports, admin tools, audit — checking guards, empty data paths, and that every button either acts or is disabled with a reason.
- Verify the lifecycle end to end after the polish: upload → allocation → call logging → bureau pull → partner eligibility → submission → status progression → reports/audit, including persistence across refresh.
- Unify wording (Submit to Lending Partner, Bank Selected) and number/currency formatting (`en-IN`) across all screens.

**D. Perceived performance**
- Route-level lazy loading for the heavy admin/report pages, memoized derived lists on the large lead tables, and skeletons instead of blank frames on first paint.

## Out of scope
Mock data stays (no backend), the role switcher and demo-mode banner stay, and no new features are added — this is correctness, consistency and responsiveness only.

## Verification
Automated sweep of every route at 375, 768 and 1280 checking for overflow, clipped controls and console errors, plus screenshot review of each screen per role before hand-off.
