export function assetsForCategory(category, assets, collections = []) {
  const filter = category?.filter;
  if (!filter) return [];
  if (filter.type === 'folder') return assets.filter(asset => asset.category === filter.category);
  if (filter.type === 'tags') return assets.filter(asset => filter.tags.every(tag => asset.tags.includes(tag)));
  if (filter.type === 'assets') {
    const byId = new Map(assets.map(asset => [asset.id, asset]));
    return [...new Set(filter.assetIds)].map(id => byId.get(id)).filter(Boolean);
  }
  if (filter.type === 'collection') {
    const collection = collections.find(item => item.id === filter.collectionId);
    return collection ? assets.filter(asset => asset.collectionSlugs.includes(collection.slug)) : [];
  }
  return [];
}

export const assetsForCollection = (collection, assets) => assets.filter(asset => asset.collectionSlugs.includes(collection.slug));
