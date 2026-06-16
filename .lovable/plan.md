## Login Screen + Auth Flow (Mock)

A simple, common login screen for all roles, with a tooltip showing demo credentials, a persistent mock auth session, and full profile/logout functionality in the app header.

This stays consistent with the prototype (mock data, no real backend). Auth is simulated via `localStorage`, mirroring the existing `RoleContext` pattern.

---

### 1. New `AuthContext` (`src/contexts/AuthContext.tsx`)

Lightweight mock auth provider:
- State: `user: { name, email, role } | null`, `isAuthenticated`
- Methods: `login(email, password)`, `logout()`
- Persistence: `localStorage` key `lms-auth`
- On `login`: validates against demo credentials map → sets user + syncs `RoleContext` role
- On `logout`: clears storage, resets role, navigates to `/login`

Demo credentials (one per role, shared password `demo123`):
- `agent@smartlms.com` → Agent
- `manager@smartlms.com` → Manager
- `cluster@smartlms.com` → Cluster Head
- `admin@smartlms.com` → Data Admin

Wired into `App.tsx` above `RoleProvider` (or alongside, with role sync via effect).

### 2. New Login Page (`src/pages/LoginPage.tsx`) — route `/login`

Clean, centered card layout matching landing page aesthetics (white surface, indigo accent, Inter, soft radial bg):
- Logo + "Sign in to Smart LMS" heading
- Email + Password inputs
- "Sign in" primary button
- Below the form: an `Info` icon + "View demo credentials" with a `Tooltip` (hover/focus) listing all 4 role logins and the shared password, plus "click to autofill" quick-pick chips for each role
- Inline error toast on bad credentials
- On success → navigate to `/app`

### 3. Route protection

Update `src/components/RouteGuard.tsx`:
- If `!isAuthenticated` and route is not `/` or `/login` → `<Navigate to="/login" replace />`
- Keep existing role-based check after auth check

Update `src/App.tsx`:
- Add `<Route path="/login" element={<LoginPage />} />` outside `AppLayout`
- Wrap providers with `AuthProvider`

Update `src/pages/LandingPage.tsx`:
- "Enter LMS" CTA → if authenticated go to `/app`, else go to `/login`
- Add a secondary "Sign in" link in header when unauthenticated

### 4. Header profile menu (`src/components/AppLayout.tsx`)

Replace the static `AV` avatar circle with a `DropdownMenu`:
- Trigger: avatar with user initials (derived from `user.name`)
- Content:
  - Header block: name, email, role badge
  - `Profile` (opens a simple Profile dialog/sheet showing name, email, role, joined-at — read-only for prototype)
  - `Settings` (links to `/system-config` if permitted, otherwise hidden)
  - Divider
  - `Sign out` → calls `logout()` → redirects to `/login`

Role badge in header continues to show current role (still switchable via sidebar role-switcher for prototype demo purposes; switching role updates the mock user's role too so menu stays in sync).

### 5. Sidebar adjustment (`src/components/AppSidebar.tsx`)

Footer: add small "Signed in as {name}" line above the version string (collapsed: hidden).

---

### Files

**Created**
- `src/contexts/AuthContext.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/ProfileMenu.tsx` (avatar dropdown used in header)

**Modified**
- `src/App.tsx` — add `AuthProvider`, `/login` route
- `src/components/RouteGuard.tsx` — auth gate before role gate
- `src/components/AppLayout.tsx` — swap static avatar for `ProfileMenu`
- `src/components/AppSidebar.tsx` — show signed-in user in footer
- `src/pages/LandingPage.tsx` — CTA routes through `/login` when unauthenticated
- `src/lib/permissions.ts` — allow `/login` for all (unauth fallthrough)

### Notes / decisions

- Pure prototype auth (no Supabase). Easy to swap later.
- Role-switcher kept (per project memory: "Always include a role-switcher"), but switching role now also updates the active mock user so profile menu stays consistent.
- Demo credentials displayed via tooltip + clickable chips for fast role testing.
