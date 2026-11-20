# Frontend architecture

The source follows Feature-Sliced Design. Imports flow downward through these layers:

1. `app` — application bootstrap, route synchronization, and top-level controller
2. `pages` — complete route-level screens
3. `widgets` — reusable composed layout such as the application shell
4. `features` — user actions and learning workflows
5. `entities` — script, learning, and community domain models
6. `shared` — Supabase client, generic UI, configuration, and utilities

Each slice exposes cross-slice dependencies through its `index.ts` public API. Files inside a slice may use relative imports to their own `model`, `lib`, and `ui` segments.

`app/App.tsx` only selects and composes screens. Stateful orchestration lives in `app/model/useAppController.ts`; domain calculations belong in the corresponding `entities` or `features` slice.

## Local visitor analytics

`npm run dev` serves `/api/admin-analytics` and `/api/admin-development` through Node-only Vite middleware using the same handler and administrator authorization as production. `.env.local` must contain the Supabase public connection variables and `MOLIP_VERCEL_ANALYTICS_TOKEN`, `MOLIP_VERCEL_PROJECT_ID`, and (for team projects) `MOLIP_VERCEL_TEAM_ID`. Restart the dev server after changing variables. The token is server-only; never rename it with a `VITE_` prefix. No Vercel CLI project link is required for this route. Other Vercel Functions are not emulated by this middleware.

The UI displays production-site Vercel analytics, not localhost traffic. Signup/script summaries additionally require `sql/admin/dashboard-summary-upgrade.sql` in Supabase. A UI preview with fixture data does not verify either live integration.

## Development and deployment tab

`/admin/development` uses an administrator-only server endpoint. It reads the current production target from the Vercel project and separately reads the latest production deployment attempt. A failed/new attempt never replaces the displayed current production target. Existing `MOLIP_VERCEL_ANALYTICS_TOKEN` / project / team settings are reused. An optional `MOLIP_VERCEL_TOKEN` can supply a separate deployment-read token instead.

Recent commits come from the fixed public `molipstudy/Molip-Script` repository's `main` branch. GitHub needs no token for public reads; an optional server-only `MOLIP_GITHUB_READ_TOKEN` can be used if unauthenticated requests reach GitHub's rate limit. No DB migration or webhook is required. Both integrations load on tab entry or manual refresh, and fail independently. Tokens, project settings, commit author emails and raw provider errors are never returned to the browser.
