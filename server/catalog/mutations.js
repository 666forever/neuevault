import { CatalogCompileError } from './compiler.js';

const TYPES = new Set(['category.create','category.update','category.delete','collection.create','collection.update','collection.delete']);
const CATEGORY_FIELDS = new Set(['slug','title','description','coverAssetId','visible','order','filter']);
const COLLECTION_FIELDS = new Set(['slug','title','description','coverAssetId','tags','featured','featuredOrder','public','accessNote','assetIds']);
const slug = value => typeof value === 'string' && /^[a-z0-9-]+$/.test(value);
const nextId = (items, prefix) => { const max = Math.max(0, ...items.map(item => new RegExp(`^${prefix}-(\\d+)$`).exec(item.id)?.[1]).filter(Boolean).map(Number)); return `${prefix}-${String(max + 1).padStart(3, '0')}`; };
const fail = (code, message) => { throw new CatalogCompileError([{ code, message, targetId: null }]); };
const cleanChanges = (changes, allowed) => { if (!changes || typeof changes !== 'object' || Array.isArray(changes)) fail('mutation_changes_invalid','Mutation changes are invalid.'); for (const key of Object.keys(changes)) if (!allowed.has(key)) fail('mutation_field_invalid',`Field ${key} cannot be changed.`); return structuredClone(changes); };
function validateChanges(changes,category){
  if('slug'in changes&&!slug(changes.slug))fail('mutation_slug_invalid','Enter a valid slug.'); if('title'in changes&&(typeof changes.title!=='string'||!changes.title.trim()))fail('mutation_title_invalid','Enter a title.'); if('description'in changes&&typeof changes.description!=='string')fail('mutation_description_invalid','Enter a valid description.'); if('coverAssetId'in changes&&changes.coverAssetId!==null&&typeof changes.coverAssetId!=='string')fail('mutation_cover_invalid','Choose a valid cover.');
  for(const key of category?['visible']:['featured','public'])if(key in changes&&typeof changes[key]!=='boolean')fail('mutation_field_invalid',`Field ${key} is invalid.`); if('order'in changes&&(!Number.isInteger(changes.order)||changes.order<0))fail('mutation_order_invalid','Enter a valid order.'); if('featuredOrder'in changes&&changes.featuredOrder!==null&&(!Number.isInteger(changes.featuredOrder)||changes.featuredOrder<0))fail('mutation_order_invalid','Enter a valid featured order.');
  for(const key of ['tags','assetIds'])if(key in changes&&(!Array.isArray(changes[key])||changes[key].some(value=>typeof value!=='string')))fail('mutation_field_invalid',`Field ${key} is invalid.`); if(category&&'filter'in changes){const filter=changes.filter;if(!filter||typeof filter!=='object'||!['folder','tags','assets','collection'].includes(filter.type))fail('mutation_filter_invalid','Choose a valid category filter.');}
}

export function normalizeCatalogMutation(value) {
  if (!value || typeof value !== 'object' || !TYPES.has(value.type)) fail('mutation_type_invalid','Choose a supported catalog mutation.');
  const destructive = value.type.endsWith('.delete'); const changes = destructive ? undefined : cleanChanges(value.changes, value.type.startsWith('category.') ? CATEGORY_FIELDS : COLLECTION_FIELDS);
  if (value.type.endsWith('.create') && value.id !== undefined) fail('mutation_id_forbidden','Stable IDs are allocated by the server.');
  if (!value.type.endsWith('.create') && (typeof value.id !== 'string'||!new RegExp(`^${value.type.startsWith('category.')?'cat':'col'}-[a-z0-9-]+$`).test(value.id))) fail('mutation_id_required','A stable record ID is required.');
  if(changes)validateChanges(changes,value.type.startsWith('category.'));
  if ((destructive || (value.type.endsWith('.update') && changes?.slug)) && value.confirmation !== value.type) fail('mutation_confirmation_required','Explicit confirmation is required.');
  return { type: value.type, ...(value.id ? { id: value.id } : {}), ...(changes ? { changes } : {}), ...(value.confirmation ? { confirmation: value.confirmation } : {}) };
}

export function applyCatalogMutation(catalog, input) {
  const mutation = normalizeCatalogMutation(input); const assets = structuredClone(catalog.assets); const categories = structuredClone(catalog.categories); const collections = structuredClone(catalog.collections);
  const categoryMutation = mutation.type.startsWith('category.'); const list = categoryMutation ? categories : collections; const prefix = categoryMutation ? 'cat' : 'col';
  if (mutation.type.endsWith('.create')) {
    const defaults=categoryMutation?{title:'New category',description:'',coverAssetId:null,visible:false,order:list.length,filter:{type:'assets',assetIds:[]}}:{title:'New collection',description:'',coverAssetId:null,tags:[],featured:false,public:false,accessNote:''};
    const requestedAssets=categoryMutation?null:mutation.changes.assetIds; const record = { id: nextId(list, prefix), ...defaults, ...mutation.changes }; delete record.assetIds;
    if (!slug(record.slug)) fail('mutation_slug_invalid','Enter a valid slug.');
    if(requestedAssets){ const known=new Set(assets.map(asset=>asset.id)); if(requestedAssets.some(id=>!known.has(id))) fail('collection_asset_missing','A selected asset no longer exists.'); for(const asset of assets) if(requestedAssets.includes(asset.id)) asset.collectionSlugs=[...new Set([...asset.collectionSlugs,record.slug])]; }
    list.push(record); return { assets, categories, collections, targetId: record.id, mutation };
  }
  const index = list.findIndex(item => item.id === mutation.id); if (index < 0) fail('mutation_target_missing','The catalog record no longer exists.'); const before = list[index];
  if (mutation.type.endsWith('.delete')) {
    list.splice(index, 1); if (!categoryMutation) for (const asset of assets) asset.collectionSlugs = asset.collectionSlugs.filter(value => value !== before.slug);
    return { assets, categories, collections, targetId: mutation.id, mutation };
  }
  const requestedAssets=categoryMutation?null:mutation.changes.assetIds; const after = { ...before, ...mutation.changes, id: before.id }; delete after.assetIds; if (!slug(after.slug)) fail('mutation_slug_invalid','Enter a valid slug.'); list[index] = after;
  if (!categoryMutation && before.slug !== after.slug) for (const asset of assets) asset.collectionSlugs = asset.collectionSlugs.map(value => value === before.slug ? after.slug : value);
  if(!categoryMutation&&requestedAssets){ const known=new Set(assets.map(asset=>asset.id)); if(requestedAssets.some(id=>!known.has(id))) fail('collection_asset_missing','A selected asset no longer exists.'); for(const asset of assets) asset.collectionSlugs=requestedAssets.includes(asset.id)?[...new Set([...asset.collectionSlugs,after.slug])]:asset.collectionSlugs.filter(value=>value!==after.slug); }
  return { assets, categories, collections, targetId: mutation.id, mutation };
}
