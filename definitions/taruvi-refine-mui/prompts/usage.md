## Usage – Taruvi Refine MUI

This is a **Refine v5 + React 19 + Material UI v7 + TaruviBase** template.

### MANDATORY: read the bundled Taruvi skills before writing code
This template ships two skill documents. Their full text is already provided to you
in the template's important files — do not implement from memory instead of them:

- `taruvi-app-developer` (activate_skill) — **backend**: provisioning datatables
  and schemas, Cerbos policies, roles/users, buckets, secrets, analytics queries, raw SQL
  (all via the `taruvi_backend` / `taruvi_list_backend_tools` agent tools), and Python
  function bodies for the Taruvi function runtime.
- `taruvi-refine-providers` (activate_skill) — **frontend**: wiring data/auth/
  access-control/storage providers, Refine v5 hooks against Taruvi, list pages,
  dashboards, KPI cards, file managers, and debugging 401/403 and token-refresh issues.

Each SKILL.md routes to deeper module docs under its own `references/` directory
(via `read_skill_resource`, e.g. `references/datatable-schema-patterns.md`).
Read the referenced file before implementing that area — the file tree lists them all.

Build the backend first with the Taruvi tools (create datatables, then seed real data),
then build the Refine UI against that live schema.

Deeper reference also lives in `AGENTS.md` and `UI_Guidelines.md` at the project root.
Non-negotiable rules:

### Architecture
- All backend calls go through the providers wired in `src/App.tsx` from `@taruvi/refine-providers` (data, auth, access-control, storage, app, user). Never call the Taruvi REST API directly, never create axios/fetch clients.
- The Taruvi client is configured in `src/taruviClient.ts` from build-time env (`TARUVI_SITE_URL`, `TARUVI_APP_SLUG`, `TARUVI_API_KEY`). Do not hardcode credentials.
- Add each new entity as: (1) a Taruvi datatable (provision via Taruvi MCP tools if connected), (2) an entry in the `resources` array in `src/App.tsx` with list/create/edit/show routes, (3) pages under `src/pages/<resource>/`.
- Default to a functional production app: real schema, seeded data, working CRUD, dashboards computed from live data — never hardcoded demo values.

### Refine v5 syntax (CRITICAL — v4 syntax will not compile)
- `useList`: `const { result, query: { isLoading } } = useList(...)`; rows are `result.data`.
- `useOne/useShow`: `const { result } = useOne(...)`; the record is `result` (no `.data`).
- Mutations: `const { mutate, mutation: { isPending } } = useUpdate()`.
- Tables: `const { dataGridProps } = useDataGrid({ resource: "x" })` with MUI `<DataGrid {...dataGridProps} />`.
- Renames: `metaData`→`meta`, `sorter`→`sorters`, mutation `isLoading`→`isPending`, `hasPagination:false`→`pagination:{mode:"off"}`.

### UI
- MUI components only (theme overrides already applied via `taruviTokens` in `src/theme/themeOptions.ts`); icons come from the FontAwesome-backed shim in `src/components/icons.tsx` (never add `@mui/icons-material`); keep the existing shell (`src/components/sidenav`), never build a parallel layout.
- User feedback goes through the existing Refine notification provider (`useNotificationProvider` from `@refinedev/mui`) — no custom toasts/snackbars.
- Recharts is available for charts.

### Auth & access control
- Auth pages exist under `src/pages/login|register|forgotPassword` and are wired to the Taruvi site's user base. Access checks use `useCan` / `<CanAccess>` against Cerbos policies defined on the site.
