## Using the Taruvi Refine Vite starter

This project is a Refine v5 + MUI + TypeScript Vite SPA wired to TaruviBase.
The dev server is already running with hot reload — do NOT run `npm run dev`,
`npm install`, or build commands unless dependencies changed.

Non-negotiables, enforced by `AGENTS.md` (read it first — it is authoritative):

- **Functional app default**: real Taruvi schema + registered Refine
  resources + live data. No mockups unless explicitly requested.
- **Spec first**: write `docs/spec.md` (resources, fields, relations, provider
  meta, page list) before building.
- **UI preflight**: read `UI_Guidelines.md` in full before any UI work; import
  design tokens (`taruviTokens`) from `themeOptions.ts`; never hardcode brand
  hex values; use `*Rounded` icons from `@mui/icons-material`.
- **MUI v7**: `Grid2` does not exist in v7 — `import { Grid } from
  "@mui/material"` IS the new grid (`size={{ xs: 12, md: 6 }}` props). Never
  import `@mui/material/Grid2` or `@mui/material/Unstable_Grid2`, and never
  `bun install` a package SUBPATH — subpaths are not packages.
- **Page anatomy**: every list page is built on
  `src/components/ListPageShell.tsx` (never hand-roll the scaffold) with
  search + server-side filters + active-filter chips + pagination + the 4
  empty states; show pages carry breadcrumb + title + status chip + actions +
  meta + tabs-with-counts; destructive actions get confirmation dialogs;
  never render a blank page during load.
- **User data**: only via the `user` provider and user/role tools — never
  custom identity tables.
- Taruvi config comes from `.env.local` (`TARUVI_SITE_URL`,
  `TARUVI_APP_SLUG`) through Vite defines in `src/taruviClient.ts`. There is
  no API key in the client and none may ever be added.
- Browser errors stream to `logs/frontend.ndjson` — read it instead of asking
  the user to open DevTools.
