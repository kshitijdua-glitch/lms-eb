# Landing Page Before LMS Access

Add a clean, modern landing page that appears as the first screen at `/`. The actual LMS dashboard moves to `/app` (and existing routes stay where they are). Users click "Enter LMS" on the landing to proceed into the role-based experience.

## What the user sees

A full-bleed, single-screen landing with:
- **Brand header** (top): the existing purple `logo.png` + product name "EB Lending LMS". Right side: an "Enter LMS" button.
- **Hero** (centered): 
  - Eyebrow chip: "Lead Management System"
  - Headline: "One platform for the entire lead lifecycle."
  - Subhead: "Capture, qualify, follow up, and send leads to partner banks — with role-based control across Agents, Managers, Cluster Heads, and Data Admins."
  - Primary CTA "Enter LMS" → navigates to `/app`
  - Secondary ghost link "View Reports" → `/app` (still gated by RouteGuard for non-agents)
- **Feature row** (3 cards, minimal white surfaces, indigo icon accents):
  1. Lead Lifecycle — capture → follow-up → STB
  2. Role-Based Access — Agent / TL / Manager / Cluster Head / Data Admin
  3. Compliance Built-In — PII masking, consent capture, immutable audit trail
- **Footer**: small muted line "Prototype • Mock data" + copyright.

Visual direction follows project memory: white surfaces, indigo accent (`primary`), Inter font, no gradient stat tiles, minimal SaaS aesthetic. Subtle soft radial background tint behind the hero (very light indigo) for modern depth — no heavy gradients.

The landing page does **not** render the sidebar, top header, or role badge — it stands alone.

## Routing changes

```text
Before:                         After:
/  → Index (dashboard)          /        → Landing (no AppLayout)
/leads → ...                    /app     → Index (dashboard, inside AppLayout)
                                /leads, /follow-ups, ... → unchanged
```

- Sidebar "Dashboard" links currently point to `/`. Update them to `/app` so role-based dashboards still work post-landing.
- `AppLayout` should only wrap LMS routes, not the landing. Move `AppLayout` out of the global wrapper and apply it per-route (or wrap a layout route covering everything except `/`).
- `RouteGuard` continues to guard LMS routes; landing is public to all roles.
- Add a small "Back to home" affordance is **not** required — the sidebar logo can link to `/`.

## Technical details

Files to add:
- `src/pages/LandingPage.tsx` — the new landing screen. Uses existing tokens (`bg-background`, `text-foreground`, `primary`), `Button` from `@/components/ui/button`, `Card` for feature tiles, lucide icons (`Users`, `Shield`, `Workflow` or similar). Imports `logoUrl` from `@/assets/logo.png`.

Files to edit:
- `src/App.tsx`:
  - Import `LandingPage`.
  - Restructure routes so `/` renders `<LandingPage />` *outside* `AppLayout`, and all other routes render inside `<AppLayout>`. Simplest approach: two `<Routes>` branches via a layout component, e.g.
    ```tsx
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/*" element={<AppLayout><InnerRoutes /></AppLayout>} />
    </Routes>
    ```
    where `InnerRoutes` contains the existing route list with `/app` mapped to `<Index />` plus all the current `/leads`, `/follow-ups`, etc.
- `src/components/AppSidebar.tsx`: change every `{ title: "Dashboard", url: "/", ... }` entry (agent/manager/clusterHead/admin nav arrays) to `url: "/app"`. Also make the sidebar header logo link to `/` so users can return to landing.
- `src/lib/permissions.ts`: add `/app` to the route rules (allowed for all four roles), keep `/` unguarded (or allow all roles).

No new dependencies. No backend changes. Mock-data behavior is untouched.

## Out of scope

- No auth/login form — this is a public marketing-style landing for the prototype.
- No animations beyond a subtle fade-in (Tailwind `animate-fade-in` if already defined; otherwise plain).
- No changes to dashboards, lead pages, or existing flows.
