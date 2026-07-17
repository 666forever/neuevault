export class StaticAssetRepository {
  #data;
  constructor(data) { this.#data = data; }
  getCategories() { return [...this.#data.categories]; }
  getCollections() { return [...this.#data.collections]; }
  getAssets() { return [...this.#data.assets]; }
  getAsset(id) { return this.#data.assets.find(asset => asset.id === id) ?? null; }
  getCollection(slug) { return this.#data.collections.find(collection => collection.slug === slug) ?? null; }
}
