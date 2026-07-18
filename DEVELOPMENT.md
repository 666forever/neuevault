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
