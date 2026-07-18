# Neuevault development and asset ingestion

## Architecture

Neuevault is a Vite application using native JavaScript modules. Pages never import generated JSON directly. `src/data/repository.js` converts generated canonical records into the stable `StaticAssetRepository` interface used by routing, pages, search, grids, and overlays.

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
2. Add one record to `content/metadata/assets.json` with at least `sourceFile`. Add an explicit stable `id` before publishing if the asset will be referenced externally.
3. Add deliberate `tags`, `collectionSlugs`, and optionally `uploadDate`. Category, title, dimensions, file details, orientation, and animation are inferred.
4. Run `npm run generate:assets`.
5. Run `npm run validate:assets` and review every reported error.

When `uploadDate` is omitted, the source file modification date is used. Tags and collection membership are never guessed from filenames.

## Bulk import

1. Batch-copy files into the four category directories.
2. Add corresponding records to `assets.json`. A spreadsheet or script may produce this JSON, but every source path must appear exactly once.
3. Run `npm run validate:assets`. Orphan source files, unsupported files, duplicate IDs/slugs/paths, and missing sources fail validation.
4. Run `npm run generate:assets` after the batch validates.

The generator never overwrites anything in `content/assets`. Preview cache keys include source bytes and preview configuration, so unchanged previews are not regenerated.

## Create a collection

1. Add a unique record to `content/collections/collections.json` with `slug`, `title`, `description`, `coverAssetId`, tags, feature state/order, and public visibility.
2. Add the collection slug to each member asset’s `collectionSlugs` array.
3. Optionally supply `archiveCount` when the full archive count is larger than the local preview set. Otherwise count is generated from members.
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

## Commands

- `npm run dev` — start Vite
- `npm run generate:assets` — validate, generate previews, copy allowed originals, and write manifests
- `npm run validate:assets` — perform the complete ingestion audit without writing output
- `npm run clean:generated` — remove generated manifests, media, and preview cache
- `npm test` — run unit tests
- `npm run test:e2e` — run desktop and mobile Playwright tests
- `npm run build` — create the production bundle

Common failures name the affected file or record: unsupported extension, missing source, orphan source, duplicate ID/slug/path, unknown collection, or missing collection/category cover.

## Authentication boundary

Production authentication remains intentionally disabled. There is no OAuth redirect, session lookup, signed-in user state, sign-out request, or protected-download request. Generated restricted records always have `src: null`, and only their previews enter Vite’s public tree.

The future connection point remains beneath `src/data`: an API-backed repository and trusted download service must own Discord OAuth state/callbacks, HttpOnly sessions, authorization checks, and protected streaming or short-lived signed URLs. Only after that backend exists should the disabled dialog action connect to it. OAuth credentials and storage secrets never belong in this repository’s browser code.

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

Restricted downloads remain disabled. A future trusted backend must authorize a real user and create a short-lived signed Cloudinary URL. Browser code must never sign URLs or receive the API secret.

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

Production authentication, Discord OAuth, sessions, user accounts, signed restricted delivery, and the owner dashboard all remain disabled.
