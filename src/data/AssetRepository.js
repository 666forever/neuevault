export class StaticAssetRepository {
  #data;
  constructor(data) { this.#data = data; }
  getCategories() { return [...this.#data.categories]; }
  getCollections() { return [...this.#data.collections]; }
  getAssets() { return [...this.#data.assets]; }
  getAsset(id) { return this.#data.assets.find(asset => asset.id === id) ?? null; }
  getCollection(slug) { return this.#data.collections.find(collection => collection.slug === slug) ?? null; }
  getCategory(slug) { return this.#data.categories.find(category => category.slug === slug) ?? null; }
  getAssetsForCategory(category) {
    if (!category?.filter) return [];
    const filter = category.filter;
    if (filter.type === 'folder') return this.#data.assets.filter(asset => asset.category === filter.category);
    if (filter.type === 'tags') return this.#data.assets.filter(asset => filter.tags.every(tag => asset.tags.includes(tag)));
    if (filter.type === 'assets') return filter.assetIds.map(id => this.getAsset(id)).filter(Boolean);
    if (filter.type === 'collection') {
      const collection = this.#data.collections.find(item => item.id === filter.collectionId);
      return collection ? this.#data.assets.filter(asset => asset.collectionSlugs.includes(collection.slug)) : [];
    }
    return [];
  }
}
