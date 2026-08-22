# AGENTS.md — Taruvi Refine Starter (Think platform)

Authoritative build guidance for the AI agent working on this project. Follow
it exactly; when it conflicts with a generic instinct, this file wins.

## Functional app default

If the user asks to build an app, default to a **functional, production-ready**
app — not a mockup, demo, or MVP. That means: create the Taruvi schema, register
Refine resources in `src/App.tsx`, build real list/create/edit/show flows, and
wire dashboards to **live data** (computed from the system, never hardcoded).
Only build a UI-only prototype if the user explicitly asks for one.

This is a **Refine.dev v5** project (React admin/dashboard framework). Even if
the user asks for plain HTML/CSS/JS, always use React + Refine v5 + MUI +
TypeScript.

## Plan before building

**Clarify only what changes the shape of the build.** If the request doesn't
say whether it needs role-based access control beyond default auth, scheduled
jobs, external API integrations, or reporting beyond a simple filtered list,
ask before planning — these decide whether the backend touches Cerbos
policies, roles, functions, or analytics at all. Don't ask about things a
sensible default covers (field types, layout, naming).

**Write a short spec before building — save it to `docs/spec.md`.** List each
resource, its fields/types/relations, provider `meta` (which
`dataProviderName`, `bucketName`, function slugs), and the page list per
resource (list / show / create-edit / dashboard). Do not skip this on a real
build.

**Scope to what this build needs.** Plain datatables + default auth are the
baseline. Cerbos policies/custom roles only for multi-role access control
(`accessControlProvider` ships commented out for a reason); functions only when
the skill's decision criteria apply; analytics only if reporting was asked
for. An unrequested policy or function is dead weight. When genuinely unsure,
ask.

## Mandatory Taruvi preflight

For anything touching Taruvi, `@taruvi/sdk`, or `@taruvi/refine-providers`,
**activate the relevant skill before writing code** — do not implement from
memory:

- **Backend** (schema, policies, roles/users, buckets, secrets, analytics,
  functions): the `taruvi-app-developer` skill.
- **Frontend** (Refine providers, hooks, list/dashboard/form UX, auth, access
  control): the `taruvi-refine-providers` skill.

The skills are the source of truth for **Refine v5 syntax**, provider `meta`
options, hook return shapes, and production UX patterns. This file does not
duplicate them — open the skill. Use the `tool_taruvi_*` MCP tools to inspect
and change the backend schema; omit optional tool parameters entirely rather
than passing null.

## Mandatory UI / design-system preflight

For anything that renders or styles UI:

1. **Read [`UI_Guidelines.md`](UI_Guidelines.md) in full first** — it is short
   and vendored at the project root; it resolves the design decisions the MUI
   theme can't encode. If the file is missing, stop and tell the user.
2. Import design tokens from [`themeOptions.ts`](themeOptions.ts)
   (`taruviTokens`). **Never** hardcode brand hex values.
3. Prefer plain MUI components — the theme already applies sizes, weights,
   radii, padding, shadows, colors via overrides. Don't re-style with
   `sx`/CSS.
4. Use **`*Rounded`** icon variants:
   `import { AddRounded, DeleteRounded } from "@mui/icons-material"` (the full
   catalog is vendored — root named imports only, never deep paths, real MUI
   icon names only).
5. **Page anatomy is mandatory** (details in the guidelines): every list page
   is built on [`ListPageShell`](src/components/ListPageShell.tsx) — never
   hand-roll the list scaffold — with search + filters + active-filter chips +
   server-side pagination + the 4 empty states; show pages need breadcrumb +
   title + status chip + actions + meta + tabs-with-counts; destructive
   actions need a confirmation dialog; never render a blank page during load.
   Filters push into Refine's server-side `filters[]`, never React state.

## User data access rule (mandatory)

Taruvi provides built-in user management. **Never** create custom identity
tables (`users`, `auth_users`, `user_roles`, `passwords`, `sessions`), never
access `auth_user` via datatable routes, and never use `resource: "auth_user"`
in Refine hooks. Always use the `user` provider (`dataProviderName: "user"`,
`resource: "users"`) and the user/role MCP tools. If identity data isn't
available to the current role, degrade gracefully in the UI.

## How this platform runs the app

- **No shell, no dev server.** The platform bundles `src/` from the `client`
  field in package.json into `./index.js` (referenced by `public/index.html`)
  and serves `public/` as static assets. After writing or editing files, call
  `deploy_space`, then `get_browser_console_logs` to verify. A building turn
  ends with a successful deploy and a clean console.
- **The browser talks to Taruvi directly** with end-user session tokens. The
  non-secret site URL and app slug come from `./api/taruvi-config`, served by
  the `App` Durable Object (`worker/index.ts`) from platform-injected env.
  The privileged `env.TARUVI_API_KEY` exists only server-side — never write
  it into any file, never log it, never send it to the browser. Client-side
  fetches to your own routes must be **relative** (`./api/...`).
- **Auth is an in-app credential form** (`<AuthPage>` + the allauth-backed
  provider in `src/providers/refineProviders.ts`). Do not replace it with a
  redirect flow — the hosted login cannot render inside the preview iframe.
  Keep protected Taruvi queries behind auth.
- `src/polyfills.ts` must remain the FIRST import of `src/index.tsx`.
- `this.ctx.storage` in the DO is for caches/ephemeral state only; durable
  domain data belongs in Taruvi datatables.

## Dependencies — two tiers

- **Vendor tier (provided):** react, react-dom, MUI (`@mui/material`,
  `@mui/system`, `@mui/lab`, `@mui/x-data-grid`, `@mui/icons-material` in
  full), `recharts`, emotion, all `@refinedev/*`, react-router,
  react-hook-form, `@taruvi/sdk`, `@taruvi/refine-providers`,
  `@taruvi/navkit`, axios — prebuilt under `public/vendor/`, resolved by the
  import map in `public/index.html` (they are the `peerDependencies`). Import
  them normally from package ROOTS. Never add them to `dependencies`, never
  edit `public/vendor/`, never load a second copy of any of them.
- **`dependencies` (new packages):** anything else, exactly pinned; the
  platform installs and bundles it at deploy. A library added here shares the
  vendor React/MUI instances as long as it imports package roots only;
  deep-importers of vendored subpaths belong in the vendor build (operator
  step).

## Repo-specific rules

- **Notifications:** use the existing `useNotificationProvider` from
  `@refinedev/mui` (configured in `src/App.tsx`). No custom snackbars.
- **Form inputs:** normalize nullable API values before passing to MUI
  (`value={field.value ?? ""}`, boolean `checked`).
- **Stable query inputs:** memoize `filters`/`sorters`/`meta`; no inline
  `new Date()`/`Math.random()` in hook args.
- **Resource dir layout:** `src/pages/{resource}/` with `list.tsx` ·
  `create.tsx` · `edit.tsx` · `show.tsx` · `index.ts` barrel; register in
  `src/App.tsx` with `name` = the datatable name.
- **Top navigation:** the Navkit bar (`<Navkit>` in `src/App.tsx`, vendored
  `@taruvi/navkit`) owns branding, theme toggle, and the profile/logout menu
  — never remove it or re-implement those. It keeps `--nav-height` in sync;
  layout CSS depends on that variable. Extra profile-menu entries go in
  `src/navkit/useNavkitProfileMenuItems.tsx`. The sidenav stays the place
  for app navigation links.

## Local development (humans, outside the platform)

Clone the app, then: `npm install`, copy `.env.example` to `.env` (set
`VITE_TARUVI_SITE_URL` + `VITE_TARUVI_APP_SLUG`), `npm run dev`. The vite
toolchain lives in `devDependencies`, which the platform ignores — do not move
anything from `devDependencies` to `dependencies` and do not import from
`vite.config.ts` in app code.
