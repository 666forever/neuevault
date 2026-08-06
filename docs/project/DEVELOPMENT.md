# Neuevault development and asset ingestion

## Architecture

Neuevault is a Vite application using native JavaScript modules. Pages never import generated JSON directly. `src/data/repository.js` converts generated canonical records into the stable `StaticAssetRepository` interface used by routing, pages, search, grids, and overlays.

Public UI styling follows the token hierarchy and component rules in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). New interface work must reuse an existing token and primitive before introducing a new value.

Public smooth scrolling is centralized in `src/scroll/lenis.js` and initialized once from `app.js`; the Content Tool does not load it. Normal route navigation keeps the existing immediate top-reset policy, while Back/Forward and modal URL changes preserve the underlying scroll position. The shared dialog lifecycle pauses and resumes Lenis, and scrollable modal panels carry `data-lenis-prevent` so their native scrolling remains independent of the locked page.

Production keeps the homepage shell, repository, shared cards/grid, router, authentication session client, and Lenis in the entry module. Search/type rendering and the asset/authentication overlays are dynamic feature boundaries. Navigation uses a monotonic route sequence so a slower lazy import cannot overwrite a newer route. A failed hashed chunk triggers at most one same-URL reload through `src/utils/lazy.js`; a second failure renders a retryable in-page error instead of leaving a blank route. Search/type routes show a restrained `aria-live` loading state while their first chunk resolves. No route chunk is speculatively prefetched: uncommon code loads only after explicit navigation or interaction, avoiding competition with the hero and archive media.

The production build enables Vite's manifest and then runs `scripts/generate-cache-headers.mjs`. That script preserves the authored `public/_headers` rules and appends exact entries only for manifest-declared JavaScript and CSS filenames carrying Vite's eight-character content hash. These files receive `Cache-Control: public, max-age=31536000, immutable`. HTML remains revalidating so new deployments propagate promptly; versionless fonts, brand assets, icons, textures, video, previews, and originals retain the Pages default policy. Pages Functions do not receive static `_headers` rules, and `/api/*` continues to send `no-store` from the authored/server policy.

Run `npm run audit:cache-headers` after `npm run build`. It structurally checks every emitted JS/CSS file, rejects stale or duplicate entries, and rejects immutable rules for HTML, APIs, fonts, media, and versionless public asset folders. Inspect production with response headers rather than assuming local Vite behavior: entry, lazy, and CSS responses should show the one-year immutable policy, while HTML should show `max-age=0, must-revalidate`. Old HTML can continue requesting its old content-addressed chunks; the existing one-reload stale-chunk recovery remains the fallback for an unavailable deployment asset. To change this policy later, change the manifest classification and audit together—never broaden it to `/assets/*` unless every matched file is content-addressed.

The archive has three ownership layers:

```text
content/
  assets/
    icons/
    banners/
    animated/
    wallpapers/
  collections/collections.json
  metadata/assets.json
  metadata/categories.json
  generated/preview-cache/       # generated, ignored
public/media/
  previews/                       # generated, publicly served
  originals/                      # generated; public assets only
src/generated/
  assets.json                     # generated canonical manifest
  collections.json                # generated collection manifest
  categories.json                 # generated category manifest
```

Source originals and authored metadata are the source of truth. Files under `public/media`, `src/generated`, and `content/generated` must not be edited manually.

## Canonical asset schema

Every generated asset contains:

- `id`: explicit stable ID, or a content-derived SHA-256 ID when omitted
- `title` and normalized `slug`
- `sourceFile` and deterministic `previewFile`
- `category`, `collectionSlugs`, and deliberately authored `tags`
- `width`, `height`, `aspectRatio`, and `orientation`
- `fileType`, `mimeType`, and byte-valued `fileSize`
- `uploadDate` and `animated`
- `requiresDiscordAuth`
- public `src`, which is always `null` for restricted assets
- optional `protectedDownloadPath`, `attribution`, and `sourceNote`

Explicit IDs are recommended. If an ID is omitted, it is derived from file contents and therefore survives title and filename changes. Array position is never identity.

Supported source formats are JPEG, PNG, GIF, and WebP. [Sharp](https://sharp.pixelplumbing.com/) reads dimensions and animation metadata and creates previews; its prebuilt binaries are installed through npm, so a separate native image tool is normally unnecessary.

## Add one image

1. Copy the original into the matching directory under `content/assets`.
2. Preview the complete reconciliation with `npm run assets:update -- --dry-run`.
3. Run `npm run assets:update` when the report is clean and Cloudinary credentials are configured.

The update command allocates the next numeric `nv-###` ID and creates metadata automatically. Category, title, dimensions, file details, orientation, animation, hash, and upload date are inferred. New records default to public access with empty tags and collection membership. Normal imports do not require JSON editing.

Existing titles, tags, collections, upload dates, and restricted states are preserved. Subjective tags and collection assignments are never inferred. Add those later only when editorial curation is intentional.

When `uploadDate` is omitted, the source file modification date is used. Tags and collection membership are never guessed from filenames.

## Bulk import

1. Batch-copy files into the four category directories.
2. Run `npm run assets:update -- --dry-run` and review allocated IDs, cryptographic duplicates, filename collisions, removals, and cover issues.
3. Run `npm run assets:update`. It backs up control files, writes reconciled metadata, regenerates previews/manifests, synchronizes and verifies Cloudinary, validates assets, and runs unit tests, Playwright, the production build, secret audit, and restricted-exposure audit.

The generator never overwrites anything in `content/assets`. Preview cache keys include source bytes and preview configuration, so unchanged previews are not regenerated.

Before any real update, timestamped copies of asset metadata, category metadata, collection metadata, and Cloudinary synchronization state are written beneath `content/backups`. Dry-run performs no writes and does not contact Cloudinary.

A missing source is removed automatically only when its prior cryptographic hash proves it was previously scanned, or when a source-aligned legacy placeholder is being replaced by a real archive import. If a removed cover has no single objectively safe replacement, the real update stops and reports the affected collection or category instead of choosing randomly.

## Edit categories and collections locally

Run `npm run manage:content`, then open the printed `127.0.0.1` address. This starts a loopback-only content tool; it is not included in the Vite application or production build.

The manager supports creating, editing, and deleting categories and collections; selecting covers; searching assets; editing collection membership; and building categories from a source folder, tags, explicit asset IDs, or a collection’s stable ID. Stable `cat-*` and `col-*` IDs are allocated once and are read-only in the interface. Titles, descriptions, ordering, visibility, feature state, tags, counts, and slugs remain authored content.

Asset counts are derived, not manually authored. `archiveCount` has been removed from category and collection source JSON; generated manifests contain `count`, calculated from the current local archive. For collections, this is the number of assets whose `collectionSlugs` includes the collection slug. For categories, it is the number matched by the configured folder, all required tags, explicit asset IDs, or stable collection ID. Empty records generate a count of zero. If an external archive total is needed later, it must use a separate field such as `externalArchiveCount`.

The sticky picker counter distinguishes assets checked in the currently visible, filtered picker from the total assignment that will be saved. Searching and filtering never clear working selections. “Select all visible” and “Clear visible selection” affect only the filtered result; “Clear all selection” affects the complete assignment. The editor and save header show the computed total that will be written to the generated manifest.

Saving performs schema and reference validation, creates a timestamped backup of `assets.json`, `categories.json`, `collections.json`, and `cloudinary-sync.json`, atomically replaces the three authored metadata files, then regenerates previews and manifests. Source assets are never deleted by the manager. A collection slug rename migrates asset memberships by stable collection ID; deleting a collection removes those memberships. Published slug changes and destructive actions require confirmation.

Hidden categories and non-public collections may be empty and have no cover. Visible/public records require an existing cover. Restricted assets are safe covers because only their generated preview is exposed; their original remains `src: null`. The former demo records remain ordinary authored records and are currently hidden/non-public, so they can be edited or deleted without being recreated.

The public homepage and archive routes render only visible categories, public collections, and featured public collections. If none exist, those homepage sections are omitted and the collections page shows a restrained empty state. Generated files remain outputs and must not be edited manually.

## Create a collection

1. Add a unique record to `content/collections/collections.json` with `slug`, `title`, `description`, `coverAssetId`, tags, feature state/order, and public visibility.
2. Add the collection slug to each member asset’s `collectionSlugs` array.
3. Do not author `archiveCount`. Collection counts are always derived from current membership, and category counts are always derived from their configured matching rules.
4. Run generation and validation. Missing covers, missing explicitly referenced assets, duplicate slugs, and unknown asset collection slugs fail.

Featured collections sort by `featuredOrder`, then slug, so ordering is deterministic. A restricted cover is safe because collection covers always resolve to generated public previews, never originals.

## Mark an asset restricted

Set `requiresDiscordAuth` to `true` in the authored asset record. An inactive future `protectedDownloadPath` may also be included. On the next generation:

- the canonical `src` becomes `null`;
- the source original remains only in `content/assets`;
- no original is copied to `public/media/originals`;
- a static public preview is generated normally.

The generator rebuilds the public-original directory on every run, preventing a formerly public file from remaining behind after it becomes restricted.

## Preview generation

Previews retain natural aspect ratio and use an inside-fit maximum of 1200×1200. Transparent or animated sources produce WebP previews; other sources produce optimized JPEG previews. Animated originals are preserved unchanged when public, while their gallery preview is static. Output paths are based on stable asset IDs.

Animated dimensions describe one displayed frame, never Sharp’s vertically stacked multi-page image. Generation prefers `pageHeight` and uses `height / pages` only for confirmed GIF/WebP multi-frame metadata with an integral result. Ratios outside the safe `0.05–20` UI range fail validation. Public gallery cards lazily load their animated delivery after reaching the viewport threshold and unload it after leaving the viewport. Public animated category and collection covers keep the static preview until hover or keyboard focus. Restricted media and reduced-motion sessions remain static, and route disposal disconnects both gallery and cover observers.

Collection and category card copy is composed at render time as `count + authored description`. Counts are not written into descriptions, and a pre-existing numeric prefix is replaced to prevent duplicates.

## Commands

- `npm run dev` — start Vite
- `npm run generate:assets` — validate, generate previews, copy allowed originals, and write manifests
- `npm run validate:assets` — perform the complete ingestion audit without writing output
- `npm run clean:generated` — remove generated manifests, media, and preview cache
- `npm run assets:update -- --dry-run` — read-only local/Cloudinary reconciliation plan
- `npm run assets:update` — complete backed-up ingestion, Cloudinary, validation, and test workflow
- `npm run manage:content` — start the local-only category and collection manager
- `npm test` — run unit tests
- `npm run test:e2e` — run desktop and mobile Playwright tests
- `npm run build` — create the production bundle
- `ANALYZE=true npm run build` — generate an ignored `.bundle-analysis/stats.json` Rollup composition report with raw, gzip, and Brotli module sizes (PowerShell: `$env:ANALYZE='true'; npm run build`)
- `npm run audit:bundle` — check the built entry, total gzip, and largest lazy chunk against the documented performance budget
- `npm run audit:cache-headers` — verify exact immutable rules for the current hashed Vite JavaScript and CSS outputs

The bundle audit requires a current `dist`, so run `npm run build` first. Inspect emitted files under `dist/assets` and use the ignored visualizer report to find actual contributors before adding a split. Current budgets live in `scripts/audit-bundle.mjs` and include tolerance above the measured architecture; update them only after an intentional, measured architecture change. Do not raise Vite’s chunk warning limit to hide avoidable growth, and do not create tiny arbitrary chunks merely to satisfy the budget.

Bundle budgets follow the Vite manifest graph. The public graph contains the
entry and every static or dynamic descendant except the `src/admin/AdminPage.js`
boundary. The admin graph starts at that dynamic entry and includes only its
admin-exclusive descendants; shared entry code is counted with the public path.
This classification uses manifest source keys and import relationships rather
than hashed filenames.

Phase 3 measures 487,972 entry bytes / 51,196 gzip bytes and 55,173 gzip bytes
for the complete public graph, effectively unchanged from Phase 2. The public
ceilings remain 490,000 raw entry bytes, 51,500 entry gzip bytes, 55,500 public
graph gzip bytes, and 10,000 raw bytes for the largest public lazy chunk. The
common `AdminPage` shell measures 2,005 gzip bytes, nested owner-only
`AdminAccess` measures 1,943 gzip bytes, and the aggregate admin graph measures
3,948 gzip bytes. Their measured ceilings are 2,100, 2,050, and 4,100 gzip bytes
respectively. These small tolerances record the intentional nested owner-access
capability; they do not permit admin code in the entry or public route graph.
`npm run audit:bundle` fails if the manifest no longer exposes the admin shell as
an entry-level dynamic boundary or if either graph exceeds its budget. Total
emitted JavaScript remains reported for information but is not a public-load
proxy because mutually exclusive lazy routes are not downloaded together.

Common failures name the affected file or record: unsupported extension, missing source, orphan source, duplicate ID/slug/path, unknown collection, or missing collection/category cover.

## Authentication boundary

Discord OAuth is configured and active in production. Authentication canonicalizes through `www.pfseeker.com`; signed sessions, CSRF-protected logout, and protected delivery are active. Required credentials remain server-only encrypted Cloudflare Pages secrets and never enter browser code. Generated restricted records always have `src: null`, and only their previews enter Vite’s public tree.

The production connection point is the Pages Functions layer in `functions/api`, supported by server-only modules in `server`. It owns Discord OAuth state/callbacks, HttpOnly sessions, authorization checks, and short-lived signed delivery URLs. OAuth credentials and storage secrets never belong in this repository’s browser code.

## Administration foundation

Phase 1 of the administration architecture is server-only and exposes no admin
route or API endpoint. Future administration code uses the `ADMIN_DB` D1 binding
for delegated administrator records, sanitized audit events, and temporary
upload/publication job state. Repository JSON remains the canonical catalog.

The planned databases are `neuevault-admin-production` and
`neuevault-admin-preview`. Their real database IDs are intentionally absent from
the repository; when provisioned, both environments expose their respective
database through `ADMIN_DB`. Migrations live in `migrations/` and will eventually
be applied with Wrangler's D1 migration command after the relevant environment's
database has been explicitly selected. Unit tests use prepared-statement and
batch mocks and require no Cloudflare resource.

`ADMIN_OWNER_DISCORD_ID` is a required server-side variable. It is validated as
a decimal Discord ID and is never converted to a number. Missing or malformed
owner configuration fails all admin authorization closed, including delegated
access. The owner bypasses D1 lookup; non-owner sessions must match a row in
`delegated_admins`, and D1 lookup failure denies access. No browser-provided
identity participates in authorization.

Future mutation handlers must use the shared same-origin, CSRF, method,
content-type, bounded-body, request-ID, sanitized-error, and no-store helpers.
`ADMIN_ENVIRONMENT` classifies `production`, `preview`, `local`, or `test`.
Preview is always read-only. Production writes additionally require the future
feature's complete configuration; local/test writes require the explicit
`ADMIN_ALLOW_LOCAL_WRITES=true` opt-in. Missing classification fails writes
closed.

Administration retention is 180 days for audit events and 30 days for terminal,
non-recoverable jobs. Temporary mutation JSON is redacted after seven days only
for terminal, non-recoverable records. Active, pending, failed-but-recoverable,
and cleanup-eligible media jobs are not automatically deleted. Phase 1 provides
retention SQL helpers but no cron trigger.

### Read-only administration route

Phase 2 adds a lazy `/admin` route and two read-only Pages Functions:
`GET /api/admin/bootstrap` and `GET /api/admin/catalog`. The route is deliberately
absent from public navigation. It renders a neutral loading state until the
bootstrap Function independently authorizes the signed Discord session. Signed
out, unauthorized, and unavailable responses never request the catalog or render
manager content. Authorized responses expose only the current user's sanitized
identity, owner/delegated role, CSRF token, environment, and capabilities; every
write capability remains false.

The catalog endpoint authorizes independently and returns authored assets,
categories, and collections unchanged behind a read-only response wrapper. Its
provider interface is injectable. `scripts/admin/local-catalog-provider.mjs`
reads repository-authored JSON only for Node-based local/test tooling. Production
and preview fail closed with `admin_catalog_unavailable` until the separately
authorized GitHub `main` provider exists. Canonical JSON is not imported by the
browser admin module, public generated manifests are not treated as editing
input, and D1 remains administration state rather than catalog storage.

For a manual local UI fixture, set exactly one process-level scenario before
starting Vite (PowerShell example):

```powershell
$env:ADMIN_MOCK_SCENARIO='owner'; npm run dev
```

Supported scenarios are `owner`, `delegated`, `unauthorized`, `signed-out`, and
`unavailable`. The mock plugin is `apply: 'serve'`, accepts no browser-selected
identity, and is excluded from production builds. Remove the variable to disable
it. Real authorization behavior is covered with signed-session and mocked-D1
unit fixtures; Playwright intercepts the same read-only response contracts.

Neither Phase 2 endpoint accepts mutations. Unsupported methods receive a
sanitized no-store response. The client does not persist the bootstrap, CSRF
token, or catalog in local/session storage, aborts pending requests on route
disposal, and uses the shared lazy-chunk recovery policy.

### Delegated administrator management

Phase 3 adds owner-only administration-state operations without adding catalog
or media mutation. `GET` and `POST /api/admin/delegated-admins` list or add
delegated Discord IDs; `DELETE /api/admin/delegated-admins/:discordId` removes
one. Every request independently authenticates and requires the permanent owner
from `ADMIN_OWNER_DISCORD_ID`. Delegated administrators can use the read-only
catalog but receive `403` from all three owner-management operations.

IDs remain 17â€“20 digit ASCII decimal strings. Add trims surrounding whitespace,
rejects the permanent owner, and returns `409 delegated_admin_exists` for a
duplicate. Removal rejects the owner and returns
`404 delegated_admin_not_found` when no row exists. Successful add and removal
place the D1 state statement and sanitized audit insert in the same `ADMIN_DB`
batch. Audit actions are `delegated_admin.list`, `delegated_admin.add`, and
`delegated_admin.remove`; audit data excludes CSRF values, cookies, provider
responses, headers, and secrets.

Mutations require an allowed `Origin`, the in-memory bootstrap CSRF token in
`X-CSRF-Token`, JSON for add, a bounded body, and explicit write capability.
Preview and unclassified environments deny writes. Local/test requires
`ADMIN_ALLOW_LOCAL_WRITES=true`; production remains fail-closed in this phase
because delegated-management bootstrap passes no complete production-write
configuration. The permanent owner is never stored in `delegated_admins` and is
never rendered with a remove action.

Owner UI loads the nested `AdminAccess` chunk and authoritative list, validates
one Discord ID, confirms removal, and reloads the server list after successful
mutations. Delegated users receive only a role summary and do not download the
owner-management chunk or call its API. Signed-out, unauthorized, and unavailable
states behave as in Phase 2. No admin response is cached and no CSRF or delegated
state is persisted by the client.

Local Vite scenarios now include `owner-empty`, `owner-multiple`,
`owner-read-failure`, and `owner-batch-failure` in addition to the Phase 2
scenarios. They are process-selected fixtures, reset with the dev server, and do
not accept browser-selected identities. Duplicate, invalid, owner-ID, successful
add/removal, and missing-removal behavior can be exercised against the owner
fixtures. No real D1 database is required. Phase 3 still contains no category,
collection, asset, upload, publication, Cloudinary, or media-deletion endpoint.

## Catalog compilation boundary

The authored catalog remains canonical in `content/metadata/assets.json`,
`content/metadata/categories.json`, and `content/collections/collections.json`.
Generated browser manifests are derived output and must never become an editing
source of truth.

`server/catalog/compiler.js` is the shared deterministic compiler. It accepts
validated authored records plus normalized resolved asset facts and returns the
existing generated `assets`, `categories`, and `collections` shapes. The
compiler performs identity, membership, cover, category-filter, count,
orientation, restricted-delivery, and cross-record validation. It has no file
system, Sharp, network, environment, clock, random, Cloudinary, or other Node
dependency, so the same inputs always produce the same output in Node and a
Workers-compatible runtime.

Resolved asset facts contain the source order/path/hash, stable identity,
dimensions and aspect ratio, file type/MIME/size, upload date, animation flag,
preview reference, and public source (which must be `null` for a restricted
asset). `scripts/asset-pipeline/local-adapter.mjs` is the Node adapter that
reads local source bytes, hashes them, inspects media with Sharp, derives these
facts, and prepares local previews/public originals. File timestamps are only
an adapter fallback; the compiler itself never reads the clock. Future hosted
or Git-backed administration must provide the same complete fact contract and
must not depend on a local source file.

Cloudinary synchronization remains a separate delivery boundary. It may turn
compiled catalog records into hosted delivery records, but upload credentials,
remote calls, signed originals, and provider state do not belong in the shared
compiler. Restricted public records continue to expose no original source.

`npm run generate:assets`, `npm run validate:assets`, and
`npm run assets:update -- --dry-run` retain their existing commands and output
schemas. Compiler tests enforce deterministic ordering, domain failures,
Workers compatibility, a hosted-media fixture, and byte-for-byte parity for all
three generated manifests. Any intentional schema or ordering change must first
update the authored schema contract and then be reviewed as a catalog migration;
do not relax the parity gate merely to accept new output.

### Git-backed category and collection publication

Phase 5 adds the first catalog mutation boundary while leaving asset and media
mutation deferred. Authorized owners and delegated administrators can submit one
typed `category.create`, `category.update`, `category.delete`,
`collection.create`, `collection.update`, or `collection.delete` operation to
`POST /api/admin/publications`. The endpoint independently authenticates,
requires same-origin JSON, CSRF, a bounded body, a request ID, an idempotency
key, explicit write capability, and an exact 40-character base commit SHA. It
never accepts repository paths, arbitrary file contents, parents, authors,
branches, or refs from the browser, and every response is `no-store`.

The server Git provider contract reads the current `main` SHA, reads the four
canonical files at a supplied SHA, and creates one commit followed by a
conditional non-force `main` update. The target repository is permanently
`666forever/neuevault` and the target branch is permanently `main` in the future
GitHub App adapter. The approved credentials are a server-only GitHub App ID,
private key, and installation ID with repository Contents read/write and
Metadata read. Classic and fine-grained PAT fallbacks are not supported. No real
GitHub adapter or credentials are configured in this phase, so production and
preview remain fail-closed; preview is always read-only.

Each request reloads the authoritative base, applies exactly one typed mutation,
allocates new `cat-NNN` or `col-NNN` IDs from that base, reconstructs resolved
asset facts from authored source hashes and committed generated delivery facts,
and invokes the shared compiler. Collection slug changes migrate matching asset
`collectionSlugs`; deletion removes only that collection membership. Destructive
operations and slug changes carry explicit server-validated confirmation intent.
No image bytes, filesystem, Sharp, Cloudinary request, or public generated
manifest is used as an editing source.

A successful CAS creates one commit containing the three canonical authored
files, three derived manifests, and `public/catalog-version.json`. The marker is
`{ version, catalogDigest }`: omitting the commit SHA avoids circular commit
content, while a later deployment verifier can combine the immutable digest with
Cloudflare's deployed commit metadata. Commit creation moves the publication to
`deployment_pending`, never directly to `live`.

`publication_jobs` stores the actor, action, exact base, stable mutation hash,
sanitized mutation, idempotency key, state, resulting commit, sanitized failure,
and timestamps. The same actor/key/hash returns the existing publication; using
the key for different content returns a conflict. States follow the migration:
`validating`, `catalog_commit_pending`, `commit_created`,
`deployment_pending`, `live`, `failed`, and `conflict`. A stale initial head or
final ref race returns `409 catalog_conflict`; the server never merges or force
updates. Audit events cover each typed action, successful commit, and conflict.

The browser editor is a nested lazy admin chunk. Writable environments can edit
category/collection fields, covers, and collection membership; preview and
unconfigured environments retain the read-only presentation. Conflict copy
preserves the current form for review. Live deployment verification remains
explicitly deferred.

### Staged public-asset upload (Phase 6)

Phase 6 adds a local/test-only, server-authorized upload pipeline for new public
JPEG, PNG, GIF, and WebP assets. Production and preview remain fail closed until
the GitHub App provider, `ADMIN_DB`, and a complete server-side Cloudinary
upload/Admin provider are all configured. Restricted uploads remain disabled;
`nv-166` and all existing protected-delivery rules are unchanged. Permanent
Cloudinary deletion is also deferred.

The browser first creates an upload job with same-origin, CSRF, bounded-body,
request-ID, and idempotency protection. The server reserves the next collision-
safe `nv-###` identity from authoritative catalog state plus active jobs and
derives `neuevault/public/{category}/{assetId}`. A signed authorization is valid
for ten minutes and fixes image resource type, `upload` delivery, public ID,
accepted formats, and no-overwrite behavior. Media bytes then travel directly
from the browser to Cloudinary; the API secret never enters the browser.

Finalization does not trust browser MIME, dimensions, size, animation state,
version, or URL. The injectable server provider looks up the exact public ID and
version and enforces 25 MiB, 12,000 px per dimension, 100 megapixels, and the
allowed formats. Verified provider identity is hashed into the hosted source
identity, and trusted resolved facts feed the shared compiler without a local
file. The same conditional one-parent Git commit writes authored assets,
unchanged authored categories/collections, `content/cloudinary-sync.json`, all
three generated manifests, and the catalog version marker. Success ends at
`deployment_pending`.

Upload jobs use the existing lifecycle: `created`, `uploading`, `uploaded`,
`verifying`, `verified`, `publication_pending`, `commit_created`,
`deployment_pending`, `live`, `failed`, `expired`, `cleanup_eligible`, and
`cleaned`. Server code validates every transition. Create, finalize, and retry
requests are independently idempotent. A stale catalog base keeps verified media
recoverable and permits publication retry against a newly reviewed base without
uploading or verifying the bytes again; removed category or collection
references stop that retry. Invalid abandoned media can only be classified
`cleanup_eligible`; this phase performs no deletion.

The upload form is a nested lazy admin chunk and uses native `XMLHttpRequest`
only for byte progress. Navigation aborts the browser transfer and suppresses
stale UI updates, but never promotes a partial upload to verified. Local Vite
owner and delegated fixtures use injectable in-memory Git, upload-job, and
Cloudinary providers and require no real credentials or Cloudflare resource.

The production bundle gate identifies admin capabilities by their Vite manifest
source keys rather than emitted hash names. The loading graph is `AdminPage` to
`AdminCatalogEditor` to `AdminAssetUpload`; the upload module is fetched only
after an authorized writable administrator explicitly opens the upload tool.
`AdminAccess` remains an independent owner-only branch. Public routes,
signed-out/unauthorized administration, and read-only preview do not load the
upload chunk.

Phase 5 measured 5,977 gzip bytes for the aggregate admin graph. After removing
duplicated authenticated request transport, Phase 6 measures approximately
8,321 gzip bytes: 2,300 for the shell, 2,022 for the catalog editor, 1,943 for
owner access, and 2,056 for asset upload. The upload feature therefore uses a
2,125-byte feature budget and the aggregate admin graph uses an 8,450-byte
budget. The shell, editor, and owner budgets are 2,350, 2,050, and 2,000 bytes.
These limits include small build-variation tolerance. Public entry and graph
budgets remain unchanged at 51,500 and 55,500 gzip bytes. Upload code entering
the public graph, the admin shell, or bypassing the catalog-editor interaction
boundary is a bundle-audit failure.

### Production providers and deployment verification (Phase 7)

Phase 7 supplies production-capable server adapters without provisioning or
activating production writes. GitHub is fixed to `666forever/neuevault` on
`main`. The GitHub App requires only repository Contents read/write and
Metadata read, using the server-only `GITHUB_APP_ID`,
`GITHUB_APP_PRIVATE_KEY`, and `GITHUB_APP_INSTALLATION_ID` secrets. The adapter
creates a short-lived RS256 App JWT, exchanges it for an expiring installation
token, and reuses that token only inside the provider instance until shortly
before expiration. Neither credential is returned, logged, audited, or stored
in D1. PAT authentication is unsupported.

Git reads are restricted to the four canonical authored/state files and three
generated manifests. A publication reads the exact base commit and tree,
creates bounded blobs, one tree, and one single-parent commit, then performs a
non-force conditional update of `refs/heads/main`. Repository, branch, paths,
parents, author/committer, and force behavior are never browser-controlled.
Stale heads, ref races, malformed SHAs, unexpected object types, or an
unconfirmed final head fail closed.

The production Cloudinary adapter uses the existing server-only
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET`. Upload authorization signs only the fixed public image
namespace, `upload` delivery, allowed formats, disabled overwrite, and the
ten-minute timestamp. Finalization independently reads the exact resource from
the Admin API and rechecks public ID, resource/delivery type, version, secure
provider URL, format, byte size, dimensions, pixels, and animation/page facts.
The secret and raw provider response never cross the server boundary.

Deployment verification uses `CLOUDFLARE_ACCOUNT_ID` and the server-only
`CLOUDFLARE_PAGES_READ_TOKEN`, whose token should have only the minimum account
permission needed to read Pages deployments. The fixed project is `neuevault`
and production branch is `main`. A publication becomes Live only when both
signals agree: Cloudflare reports a successful production deployment for the
stored Git commit, and a bounded, no-cache request to
`https://www.pfseeker.com/catalog-version.json` returns marker version 1 with
the stored catalog digest. A Git commit alone never means Live. A queued,
building, missing, wrong-commit, superseded, or old-marker result stays
`deployment_pending`; a terminal Pages failure becomes recoverable `failed`.
Temporary provider/marker failures do not create another commit and remain
manually retryable.

`POST /api/admin/publications/:publicationId/verify` independently requires an
authorized administrator, same origin, CSRF, a bounded JSON body, and
`no-store`. The expected SHA and digest come only from D1 job state. The safe
GET status response exposes status, action, a commit indicator/SHA, live state,
retryability, and a sanitized failure code. The lazy admin UI polls with a
bounded increasing interval, stops at Live/failure/disposal or its foreground
attempt limit, and offers manual retry. A successful check refreshes the
authoritative catalog. When a catalog publication and upload job share the
commit, their Live/failure transition is batched together in D1.

Provider calls have bounded body sizes and timeouts. State-changing Git calls
are never automatically retried; transient deployment and marker checks are
retried only through bounded UI verification attempts. Sanitized diagnostics
include `github_unavailable`, `github_auth_failed`, `github_conflict`,
`github_invalid_response`, `cloudinary_unavailable`,
`cloudinary_verification_failed`, `cloudflare_unavailable`,
`deployment_failed`, `catalog_marker_unavailable`,
`catalog_marker_invalid`, and `catalog_marker_mismatch`.

Capability completeness is centralized. Catalog writes require a recognized
environment, valid owner configuration, D1 publication storage, and the
complete GitHub App configuration. Uploads additionally require D1 upload
storage and all three Cloudinary values. Live verification additionally
requires D1 plus both Cloudflare read settings. Missing or malformed pieces
fail closed, and preview remains read-only regardless of credentials. This
phase does not create the GitHub App, D1 database/binding, API token, or secret;
does not apply migrations; and does not enable restricted upload, media
deletion, or a deployment.

The client verification controller is a separate dynamic boundary loaded only
after a successful catalog/upload commit. The measured Phase 7 build keeps the
public entry at 487,972 raw / 51,192 gzip bytes and the public graph at 55,171
gzip bytes. Admin chunks measure 2,382 gzip for the shell, 2,125 for the editor,
1,944 for owner access, 2,196 for upload, and 732 for deployment verification;
the aggregate admin graph is 9,379 gzip bytes. The public budgets remain
unchanged. Source-keyed admin ceilings are 2,450, 2,200, 2,000, 2,275, 800, and
9,600 gzip bytes respectively, preserving small regression tolerance while
ensuring verification cannot enter an ordinary route or the admin shell before
a write interaction.

### Restricted upload capability proof (Phase 8)

Phase 8B implements restricted administration uploads behind the existing lazy
upload boundary, while production remains disabled until its complete provider
and infrastructure gate is provisioned. The capability remains independent of
public `uploadAssets`; preview is always false, and local/test requires the
explicit `ADMIN_MOCK_RESTRICTED_UPLOADS=true` mock opt-in.

Production release verification uses an owner-only, read-only
`GET /api/admin/readiness` boundary. It performs fixed GitHub catalog reads, D1
schema reads, Cloudinary resource reads, Cloudflare Pages deployment reads, and
catalog-marker verification; it returns only sanitized status booleans and
counts with `Cache-Control: no-store`. It exposes no provider mutation method.
Local secret rehydration is unavailable; equivalent provider authentication
must pass in the deployed Cloudflare runtime before release clearance. The
endpoint fails closed unless the production write switch is exactly `false`.

The existing `nv-166` record demonstrates the intended storage identities. Its
authenticated original is `neuevault/restricted/icons/nv-166`; its independently
stored public preview is `neuevault/previews/icons/nv-166` with `upload`
delivery. They have different Cloudinary asset IDs. The browser manifest keeps
`src: null`, publishes only transformed URLs of the preview identity, and omits
the original public ID. The server reconstructs the trusted authenticated
identity from canonical state and the download Function generates a five-minute
authenticated API download, proxies the response, and returns `private,
no-store` without redirecting the browser to Cloudinary.

Read-only requests against the current remote identities confirmed that the
unsigned authenticated original and its unsigned transformation return 401.
Changing its delivery type to `upload`, substituting the preview identity,
changing resource type or extension, and guessing another version did not
retrieve the original. The public preview and its bounded public transform are
retrievable independently. This evidence agrees with Cloudinary's documented
`authenticated` behavior: both the original and derived resources require a
signed URL, and changing the delivery type changes the requested identity rather
than the stored asset.

An explicitly authorized disposable real-account spike subsequently proved the
media capability for JPEG, transparent PNG, animated GIF, and animated WebP.
Each source was uploaded beneath a random
`neuevault/capability-tests/restricted-preview/` namespace as an authenticated
image and independently read through the Admin API. The trusted server generated
a five-minute `private_download_url` for that exact identity and supplied it
directly to a second Cloudinary upload with an incoming first-page,
1200x1200-inside-fit transformation. JPEG remained JPEG; PNG remained PNG and
preserved alpha; GIF and WebP previews were materialized as single-page PNGs.
Every preview had a different public ID and asset ID and used public `upload`
delivery.

For all four formats, direct unsigned authenticated access, unsigned transforms,
guessed versions, changed extensions, changed delivery/resource types, altered
paths, and preview-ID substitution failed to return original bytes. Direct and
bounded public preview delivery succeeded. The signed source URL was used only
in process, carried an explicit five-minute expiry, and was not recorded in the
sanitized evidence. Both disposable namespaces used during the spike were
independently confirmed empty through the Admin API after deletion.

The existing canonical `nv-166` synchronization record still contains the
signed authenticated `secureUrl` returned by its historical sync. It is not
emitted in the browser manifest or used by protected delivery, and `nv-166` was
not rewritten during the spike. Synchronization serialization is hardened for
future restricted uploads: stable original provider identity is retained, but a
restricted original's signed `secureUrl` is omitted; the separate public preview
URL remains available. Existing unchanged state and generated catalog output are
not rewritten by this behavior-neutral rule.

The Phase 8B provider exposes only a narrow `createRestrictedPreview` operation.
It receives verified server facts and a derived preview identity; it does not
accept a browser source URL, transformation, delivery type, namespace, or
format override. The five-minute private source is kept in one provider-local
variable, immediately consumed by the second upload, and never returned,
logged, audited, persisted, or serialized. The fixed incoming transformation
selects the first page and applies `c_limit` at 1200x1200 without buffering the
original through Pages Functions.

Finalization independently verifies the authenticated original, persists only
sanitized stable facts, creates and independently verifies the public static
preview, and only then enters the existing eight-file Git CAS publication. New
restricted canonical state stores no original `secureUrl`; it stores stable
authenticated identity plus the separate public preview state. The compiler
emits `requiresDiscordAuth: true`, `src: null`, and public preview fields. The
existing protected-download Function derives short-lived delivery from trusted
canonical identity, so it does not depend on a stored signed URL. Historical
`nv-166` state remains untouched.

A stale Git base preserves both verified resources and the asset reservation.
Publication retry revalidates editorial references and reuses the stored media
facts without re-uploading the original or regenerating the preview. Preview
creation or verification failure is recoverable but cannot publish any public
original. General-purpose media deletion remains deferred.

## Cloudinary storage

Cloudinary is the production media adapter; the local generated media tree remains the credential-free fixture path for tests and development. Install dependencies with `npm install`, copy `.env.example` to an untracked `.env`, and provide:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

These variables are read only by Node scripts. Never prefix them with `VITE_`, place them in authored metadata, or reference the Cloudinary Admin/Upload SDK from `src`.

### Sync workflow

1. Add or update originals and authored metadata normally.
2. Run `npm run validate:assets`.
3. Preview remote work with `npm run cloudinary:sync -- --dry-run`. This works without credentials and never invents successful responses.
4. With `.env` configured, run `npm run cloudinary:sync`.
5. Run `npm run cloudinary:verify` to compare synchronization state, generated manifests, and remote resources.
6. Commit the generated JSON manifests and `content/cloudinary-sync.json`. Do not commit `.env` or generated `public/media` files.

Synchronization hashes source bytes and compares them with the controlled state file. Unchanged assets are skipped. Changed assets overwrite their deterministic public ID, preserving Cloudinary identity while producing a new version. Uploads retry transient HTTP failures three times with bounded exponential backoff. Normal synchronization never deletes remote assets.

If a run fails partway through, neither synchronization state nor manifests are committed. Some deterministic remote IDs may already have been uploaded; fix the reported failure and rerun. The next run safely overwrites those same IDs.

### Folder and access convention

- Public originals: `neuevault/public/{category}/{assetId}`, delivery type `upload`
- Restricted originals: `neuevault/restricted/{category}/{assetId}`, delivery type `authenticated`
- Restricted public previews: `neuevault/previews/{category}/{assetId}`, delivery type `upload`

Restricted previews are generated locally at reduced size and uploaded as separate Cloudinary assets. Their public IDs and delivery paths are unrelated to restricted originals, so modifying the preview URL cannot reveal the authenticated original. Restricted manifests retain `src: null`; only inactive `protectedDownloadPath` metadata remains.

Public manifests contain the versioned original URL and an attachment delivery URL. Gallery images use `f_auto`, `q_auto`, `c_limit`, and explicit 320/640/960/1200 width variants without cropping. Public animated sources use a static first-frame grid preview while their original remains unchanged for download. Restricted previews are already static independent files.

Restricted downloads are owned by the Pages Function boundary. It authorizes the session, resolves a trusted manifest record, and creates a short-lived signed Cloudinary URL. Browser code never signs URLs or receives the API secret.

### Verification and credential rotation

Run `npm run audit:cloudinary-secrets` after building. It scans `src`, generated manifests, and `dist` for server credential markers. Automated tests also ensure the Cloudinary SDK and credential names do not enter browser source.

To rotate credentials, create a replacement key/secret in Cloudinary, update only the local/deployment secret store, verify sync and remote access, then revoke the old credentials. No manifest changes are required solely for a key rotation.

### Safe pruning

Pruning is dry-run-only by default:

```text
npm run cloudinary:prune -- --dry-run
npm run cloudinary:prune -- --write-plan ./cloudinary-prune-plan.json
npm run cloudinary:prune -- --execute --plan ./cloudinary-prune-plan.json
```

Execution requires an explicit `--execute` flag and an exact, current confirmation plan. A changed or stale plan is rejected. Authenticated assets and anything under `neuevault/restricted/` are excluded from deletion and printed as protected; remove those manually only after a separate source-of-truth and backup review.

Cloudinary upload and Admin API behavior follows the official [Upload API](https://cloudinary.com/documentation/image_upload_api_reference), [Node upload](https://cloudinary.com/documentation/node_image_and_video_upload), and [Admin API](https://cloudinary.com/documentation/admin_api) documentation.

Discord OAuth, signed sessions, and protected delivery are active in production. The owner dashboard remains deferred. `nv-166` is the first production restricted asset; its preview remains public while its original remains behind authenticated delivery.
# Discord authentication and protected originals

Authentication is implemented with Cloudflare Pages Functions under `/api`. Discord uses the OAuth authorization-code flow with the `identify` scope. The server validates a short-lived, signed state cookie, exchanges the code directly with Discord, fetches `/users/@me`, and creates a seven-day signed, HttpOnly session cookie. OAuth tokens and secret values are never returned to browser code.

The production Discord redirect URI is exactly `https://www.pfseeker.com/api/auth/discord/callback`. Local testing may use an explicitly registered localhost URI; arbitrary callback origins and return URLs are rejected. Configure these encrypted Pages secrets in both the intended Preview and Production environments as appropriate:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Never prefix these names with `VITE_`. `.env.example` contains names/placeholders only, while `.env` remains ignored. Run `npm run pages:dev` to exercise the built site and Functions locally.

`GET /api/auth/session` exposes only configuration/authentication state, minimal display identity, and the CSRF value needed for logout. Logout requires same-origin JSON plus that CSRF value. The initial access policy in `server/auth.js` permits any authenticated Discord account; future guild/role rules belong solely in `canAccessRestricted`.

Restricted records continue to require `src: null`. `GET /api/download/:assetId` resolves the stable ID from the generated server-side manifest, verifies the session and access policy, and creates a five-minute signed Cloudinary authenticated-delivery URL. It never accepts a public ID, delivery type, format, filename, or transformation from the client. Public downloads continue to use their existing public Cloudinary URLs without an account.

`nv-166` is currently the first production restricted asset. Its public manifest retains `src: null`, its static preview is public, and its original is delivered only through the authenticated Pages Function. The current access policy permits any authenticated Discord account; future guild or role restrictions must remain server-side in `canAccessRestricted`.
