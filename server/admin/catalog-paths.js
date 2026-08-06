export const CANONICAL_PATHS = Object.freeze({ assets: 'content/metadata/assets.json', categories: 'content/metadata/categories.json', collections: 'content/collections/collections.json', cloudinary: 'content/cloudinary-sync.json' });
export const GENERATED_PATHS = Object.freeze({ assets: 'src/generated/assets.json', categories: 'src/generated/categories.json', collections: 'src/generated/collections.json', version: 'public/catalog-version.json' });
export const validCommitSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
