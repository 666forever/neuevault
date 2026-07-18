import { describe, expect, it } from 'vitest';
import { assetsForCategory, assetsForCollection, createCategory, createCollection, prepareContentSave } from '../../scripts/content-manager/model.mjs';

const asset = (id, collectionSlugs = []) => ({ id, sourceFile: `icons/${id}.jpg`, title: id, collectionSlugs, tags: [], requiresDiscordAuth: false });
const category = overrides => ({ id: 'cat-001', slug: 'icons', title: 'Icons', description: '', coverAssetId: 'nv-001', visible: true, order: 0, filter: { type: 'assets', assetIds: ['nv-001'] }, ...overrides });
const collection = overrides => ({ id: 'col-001', slug: 'favorites', title: 'Favorites', description: '', coverAssetId: 'nv-001', tags: [], featured: false, public: true, ...overrides });
const state = overrides => ({ assets: [asset('nv-001', ['favorites'])], categories: [category()], collections: [collection()], ...overrides });

describe('content manager model', () => {
  it('allocates stable IDs without reusing the highest existing number', () => {
    expect(createCategory([{ id: 'cat-002' }, { id: 'cat-010' }]).id).toBe('cat-011');
    expect(createCollection([{ id: 'col-004' }]).id).toBe('col-005');
  });

  it('keeps stable IDs when editable titles change', () => {
    const original = state();
    const prepared = prepareContentSave(original, { ...original, categories: [category({ title: 'New title' })] });
    expect(prepared.categoriesFile.categories[0]).toMatchObject({ id: 'cat-001', title: 'New title' });
  });

  it('migrates memberships on a collection slug change', () => {
    const original = state();
    const prepared = prepareContentSave(original, { ...original, collections: [collection({ slug: 'renamed' })] });
    expect(prepared.assetsFile.assets[0].collectionSlugs).toEqual(['renamed']);
    expect(prepared.slugMigrations).toEqual({ favorites: 'renamed' });
  });

  it('removes memberships when a collection is deleted', () => {
    const original = state();
    expect(prepareContentSave(original, { ...original, collections: [] }).assetsFile.assets[0].collectionSlugs).toEqual([]);
  });

  it('allows empty hidden records but rejects broken public covers and duplicate slugs', () => {
    const original = state();
    expect(() => prepareContentSave(original, { ...original, categories: [category({ visible: false, coverAssetId: null, filter: { type: 'assets', assetIds: [] } })], collections: [collection({ public: false, coverAssetId: null })] })).not.toThrow();
    expect(() => prepareContentSave(original, { ...original, collections: [collection({ coverAssetId: 'missing' })] })).toThrow(/requires an existing cover/);
    expect(() => prepareContentSave(original, { ...original, categories: [category(), category({ id: 'cat-002' })] })).toThrow(/Duplicate category slug/);
  });

  it('does not expose a restricted original while using it as a cover reference', () => {
    const original = state({ assets: [{ ...asset('nv-001'), requiresDiscordAuth: true, protectedDownloadPath: '/api/assets/nv-001/download' }] });
    const prepared = prepareContentSave(original, original);
    expect(prepared.assetsFile.assets[0]).not.toHaveProperty('src');
    expect(prepared.categoriesFile.categories[0].coverAssetId).toBe('nv-001');
  });

  it('computes collection counts after assignment, removal, and deletion', () => {
    const working = state({ assets: [asset('nv-001', ['favorites']), asset('nv-002', ['favorites'])] });
    expect(assetsForCollection(working.collections[0], working.assets)).toHaveLength(2);
    working.assets[1].collectionSlugs = [];
    expect(assetsForCollection(working.collections[0], working.assets)).toHaveLength(1);
    const prepared = prepareContentSave(working, { ...working, collections: [] });
    expect(prepared.assetsFile.assets.every(item => item.collectionSlugs.length === 0)).toBe(true);
  });

  it('computes category counts for every filter model and empty categories', () => {
    const assets = [
      { ...asset('nv-001', ['favorites']), category: 'Icons', tags: ['night'] },
      { ...asset('nv-002'), category: 'Banners', tags: ['night', 'wide'] },
    ];
    const collections = [collection()];
    expect(assetsForCategory(category({ filter: { type: 'folder', category: 'Icons' } }), assets, collections)).toHaveLength(1);
    expect(assetsForCategory(category({ filter: { type: 'tags', tags: ['night', 'wide'] } }), assets, collections)).toHaveLength(1);
    expect(assetsForCategory(category({ filter: { type: 'assets', assetIds: ['nv-001', 'missing'] } }), assets, collections)).toHaveLength(1);
    expect(assetsForCategory(category({ filter: { type: 'collection', collectionId: 'col-001' } }), assets, collections)).toHaveLength(1);
    expect(assetsForCategory(category({ filter: { type: 'assets', assetIds: [] } }), assets, collections)).toHaveLength(0);
  });

  it('strips legacy authored archiveCount values from normal saves', () => {
    const original = state(); const candidate = structuredClone(original);
    candidate.categories[0].archiveCount = 3970; candidate.collections[0].archiveCount = 48;
    const prepared = prepareContentSave(original, candidate);
    expect(prepared.categoriesFile.categories[0]).not.toHaveProperty('archiveCount');
    expect(prepared.collectionsFile.collections[0]).not.toHaveProperty('archiveCount');
  });
});
