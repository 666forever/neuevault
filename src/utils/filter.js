import { isRestricted } from '../data/access.js';

export function filterAssets(assets, { query = '', type = 'All', access = 'all', category = '', tag = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return assets.filter(asset => {
    const orientation = asset.width === asset.height ? 'Square' : asset.width > asset.height ? 'Landscape' : 'Portrait';
    const searchable = [asset.title, asset.category, asset.collection, ...asset.tags].join(' ').toLowerCase();
    return (!needle || searchable.includes(needle))
      && (type === 'All' || asset.category === type || orientation === type)
      && (access === 'all' || (access === 'restricted') === isRestricted(asset))
      && (!category || asset.category.toLowerCase() === category.toLowerCase())
      && (!tag || asset.tags.some(value => value.toLowerCase() === tag.toLowerCase()));
  });
}

export function sortAssets(assets, order = 'new') {
  return [...assets].sort(order === 'title' ? (a, b) => a.title.localeCompare(b.title) : (a, b) => b.uploadDate.localeCompare(a.uploadDate));
}
