import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileCatalog, CatalogCompileError } from '../../server/catalog/compiler.js';
import { pipelineConfig } from '../../scripts/asset-pipeline/config.mjs';
import { PipelineReport } from '../../scripts/asset-pipeline/errors.mjs';
import { resolveLocalAssets } from '../../scripts/asset-pipeline/local-adapter.mjs';
import { authoredAssetsFileSchema, authoredCategoriesFileSchema, authoredCollectionsFileSchema } from '../../scripts/asset-pipeline/schema.mjs';

const digest = value => createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex').toUpperCase();
let input; let output;

beforeAll(async () => {
  const [assetsFile, categoriesFile, collectionsFile] = await Promise.all([
    readFile('content/metadata/assets.json', 'utf8').then(JSON.parse).then(value => authoredAssetsFileSchema.parse(value)),
    readFile('content/metadata/categories.json', 'utf8').then(JSON.parse).then(value => authoredCategoriesFileSchema.parse(value)),
    readFile('content/collections/collections.json', 'utf8').then(JSON.parse).then(value => authoredCollectionsFileSchema.parse(value)),
  ]);
  const report = new PipelineReport(); const resolvedAssets = await resolveLocalAssets(assetsFile.assets, pipelineConfig, report, false); report.assertValid();
  input = { assets: assetsFile.assets, categories: categoriesFile.categories, collections: collectionsFile.collections, resolvedAssets }; output = compileCatalog(input);
});

describe('deterministic catalog compiler', () => {
  it('reproduces all 234 pre-extraction manifests byte for byte', () => {
    expect(output.assets).toHaveLength(234); expect(digest(output.assets)).toBe('B151BCB101EEE6A9BC0E5207D394C62A367CE5AA913758B939D1B8F60DA1B24B'); expect(digest(output.categories)).toBe('DF5414FA194B88D222694878B92DA50712F3AFD90FF67561FC1CED918ADECEAF'); expect(digest(output.collections)).toBe('F5082707E6C14D8873CA88C9B5547894131EBCDFEA05A48F24FC04DCED6C3A6D');
  });
  it('is stable for identical and shuffled array inputs', () => {
    expect(compileCatalog(input)).toEqual(output); expect(compileCatalog({ assets: [...input.assets].reverse(), categories: [...input.categories].reverse(), collections: [...input.collections].reverse(), resolvedAssets: [...input.resolvedAssets].reverse() })).toEqual(output);
  });
  it('preserves restricted, count, cover, and animation behavior', () => {
    expect(output.assets.find(asset => asset.id === 'nv-166')).toEqual({ id: 'nv-166', title: 'B6df7c961256bcebc4b169c2ddbd96c5', slug: 'b6df7c961256bcebc4b169c2ddbd96c5', sourceFile: 'icons/b6df7c961256bcebc4b169c2ddbd96c5.jpg', previewFile: '/media/previews/nv-166.jpg', src: null, category: 'Icons', collectionSlugs: [], tags: [], width: 320, height: 320, aspectRatio: 1, orientation: 'Square', fileType: 'JPG', mimeType: 'image/jpeg', fileSize: 11307, uploadDate: '2026-06-27', animated: false, requiresDiscordAuth: true });
    expect(output.categories.every(category => category.count >= 0 && typeof category.image === 'string')).toBe(true); expect(output.collections.every(collection => collection.count === collection.assetIds.length)).toBe(true); expect(output.assets.some(asset => asset.animated)).toBe(true);
  });
  it('compiles complete hosted-media facts without a local source file', () => {
    const hosted = compileCatalog({ assets: [{ id: 'nv-hosted', sourceFile: 'hosted/not-local.png', title: 'Hosted', category: 'Icons', collectionSlugs: [], tags: [], requiresDiscordAuth: false }], categories: [], collections: [], resolvedAssets: [{ sourceOrder: 0, sourceFile: 'hosted/not-local.png', sourceHash: 'a'.repeat(64), id: 'nv-hosted', title: 'Hosted', category: 'Icons', width: 640, height: 320, aspectRatio: 2, fileType: 'PNG', mimeType: 'image/png', fileSize: 1234, uploadDate: '2026-08-05', animated: false, previewFile: 'https://cdn.example/preview.png', publicSource: 'https://cdn.example/original.png' }] });
    expect(hosted.assets[0]).toMatchObject({ id: 'nv-hosted', src: 'https://cdn.example/original.png', previewFile: 'https://cdn.example/preview.png', orientation: 'Landscape' });
  });
  it('compiles a hosted restricted original with only its independent public preview',()=>{const hosted=compileCatalog({assets:[{id:'nv-hosted-restricted',sourceFile:'animated/nv-hosted-restricted.gif',title:'Hosted restricted',category:'Animated',collectionSlugs:[],tags:[],requiresDiscordAuth:true,animated:true}],categories:[],collections:[],resolvedAssets:[{sourceOrder:0,sourceFile:'animated/nv-hosted-restricted.gif',sourceHash:'b'.repeat(64),id:'nv-hosted-restricted',title:'Hosted restricted',category:'Animated',width:640,height:320,aspectRatio:2,fileType:'GIF',mimeType:'image/gif',fileSize:1234,uploadDate:'2026-08-06',animated:true,previewFile:'https://res.cloudinary.com/example/image/upload/v2/neuevault/previews/animated/nv-hosted-restricted.png',publicSource:null,generatedFields:{previewUrl:'https://res.cloudinary.com/example/image/upload/v2/neuevault/previews/animated/nv-hosted-restricted.png',cloudinaryDeliveryType:'authenticated',originalDelivery:{resourceType:'image',deliveryType:'authenticated'}}}]});expect(hosted.assets[0]).toMatchObject({requiresDiscordAuth:true,src:null,animated:true,previewUrl:expect.stringContaining('/previews/'),cloudinaryDeliveryType:'authenticated',originalDelivery:{deliveryType:'authenticated'}});expect(JSON.stringify(hosted.assets[0])).not.toContain('/restricted/');});
});

describe('catalog compiler domain validation and architecture', () => {
  const base = () => ({ assets: [{ id: 'nv-test', sourceFile: 'icons/test.png', title: 'Test', category: 'Icons', collectionSlugs: [], tags: [], requiresDiscordAuth: false }], categories: [], collections: [], resolvedAssets: [{ sourceOrder: 0, sourceFile: 'icons/test.png', sourceHash: 'a'.repeat(64), id: 'nv-test', title: 'Test', category: 'Icons', width: 100, height: 100, aspectRatio: 1, fileType: 'PNG', mimeType: 'image/png', fileSize: 100, uploadDate: '2026-08-05', animated: false, previewFile: '/preview.png', publicSource: '/original.png' }] });
  it.each([
    ['duplicate asset ID', value => { value.assets.push({ ...value.assets[0], sourceFile: 'icons/other.png' }); value.resolvedAssets.push({ ...value.resolvedAssets[0], sourceFile: 'icons/other.png', sourceOrder: 1 }); }],
    ['duplicate category slug', value => { value.categories = [{ id: 'cat-a', slug: 'same', title: 'A', visible: false, order: 0 }, { id: 'cat-b', slug: 'same', title: 'B', visible: false, order: 1 }]; }],
    ['duplicate collection slug', value => { value.collections = [{ id: 'col-a', slug: 'same', title: 'A', description: '', coverAssetId: null, tags: [], featured: false, public: false }, { id: 'col-b', slug: 'same', title: 'B', description: '', coverAssetId: null, tags: [], featured: false, public: false }]; }],
    ['unknown collection membership', value => { value.assets[0].collectionSlugs = ['missing']; }],
    ['invalid category reference', value => { value.assets[0].category = undefined; value.resolvedAssets[0].category = 'Unknown'; }],
    ['invalid cover', value => { value.categories = [{ id: 'cat-a', slug: 'a', title: 'A', coverAssetId: 'missing', visible: true, order: 0 }]; }],
    ['malformed dimensions', value => { value.resolvedAssets[0].width = 0; }],
    ['malformed source hash', value => { value.resolvedAssets[0].sourceHash = 'not-a-sha256'; }],
    ['mismatched resolved identity', value => { value.resolvedAssets[0].id = 'nv-other'; }],
    ['restricted delivery inconsistency', value => { value.assets[0].requiresDiscordAuth = true; }],
  ])('rejects %s with structured errors', (_, mutate) => { const value = base(); mutate(value); expect(() => compileCatalog(value)).toThrow(CatalogCompileError); try { compileCatalog(value); } catch (error) { expect(error.code).toBe('catalog_compile_invalid'); expect(error.errors[0]).toMatchObject({ code: expect.any(String), message: expect.any(String) }); } });
  it('has no Node, filesystem, image, network, provider, time, or random dependency', async () => {
    const source = await readFile('server/catalog/compiler.js', 'utf8'); expect(source).not.toMatch(/^import /m); expect(source).not.toMatch(/node:|sharp|cloudinary|child_process|fetch\(|process\.|Date\.now|Math\.random|writeFile|readFile/);
  });
});
