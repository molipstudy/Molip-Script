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
