# Neuevault front-end foundation

## Structure

Vite serves `index.html` and the native-module entry point `app.js`. Page rendering lives in `src/pages`, route parsing in `src/routing`, reusable grids and cards in `src/components`, dialog behavior in `src/overlays`, data access in `src/data`, and pure helpers in `src/utils`.

`StaticAssetRepository` is the only page-facing data source. A future API repository can implement the same read methods without changing pages. During development, Zod validates the static data, including the rule that restricted assets have no public original `src`.

Full-archive counts come from category and collection metadata. Counts derived from the current static fixture are explicitly labeled “preview assets” or “preview results.” Progressive grids render immediately in batches; there is no simulated network delay.

## Remaining mock behavior

- The asset, collection, and category records are static fixtures in `data.js`.
- Public originals are remote image URLs and download directly without an account.
- Restricted previews are public remote image URLs.
- `protectedDownloadPath` values are future contracts only. The front end never calls them.
- No owner upload workflow exists yet.

## Authentication boundary

Production authentication is intentionally disabled. `integrations.discord.enabled` remains `false`; there is no OAuth redirect, session lookup, signed-in user state, sign-out request, or protected-download request. Restricted asset records must keep `src: null`, and access helpers always choose `preview` for them.

The future connection point is a trusted API-backed repository and download service beneath `src/data`. That backend must own Discord OAuth state and callback handling, HttpOnly sessions, authorization checks, and protected file streaming or short-lived signed URLs. Only after those server capabilities exist should the disabled dialog action be connected; no OAuth credentials or storage secrets belong in this front end.

## Commands

- `npm run dev` — local development server
- `npm run build` — production build and module validation
- `npm test` — filtering, sorting, routing, and access-policy unit tests
- `npm run test:e2e` — desktop and mobile browser behavior
