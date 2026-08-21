## Template Selection – Taruvi Refine MUI

Use this template when a user wants:
- A **data-driven business app**: admin panel, dashboard, internal tool, CRM, tracker, inventory, approvals, or any CRUD-centric application.
- An app backed by **TaruviBase** (Taruvi Cloud) — datatables, JWT auth, Cerbos role/policy-based access control, file storage buckets, and Python serverless functions come from the connected Taruvi site; no custom backend needs to be built.
- Professional **Material UI** look-and-feel with a pre-built responsive shell (side navigation, auth pages, theming with light/dark mode).
- Real persistence and multi-user auth out of the box (login/register/forgot-password pages are pre-wired to the Taruvi site).

Prefer another template when:
- The user wants a presentation/slide deck, a static marketing page, or a game/visual toy with no data model.
- The user explicitly wants no backend/persistence at all.

Mental model: the backend already exists (TaruviBase). Building an app = defining datatables on the Taruvi site (via Taruvi MCP tools when available), then registering Refine resources and building list/create/edit/show pages with Refine v5 hooks + MUI components. Data flows exclusively through the pre-configured providers from `@taruvi/refine-providers` — never hand-write fetch calls to the Taruvi API.
