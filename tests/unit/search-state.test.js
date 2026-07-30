import { describe, expect, it } from 'vitest';
import { filterAssets } from '../../src/utils/filter.js';
import { readSearchState, SEARCH_TYPES } from '../../src/pages/searchPage.js';

const assets = [
  { id: 'nv-1', title: 'Night Banner', category: 'Banners', collection: 'Dark', tags: ['night'], width: 1600, height: 900, requiresDiscordAuth: false },
  { id: 'nv-2', title: 'Portrait Icon', category: 'Icons', collection: 'Faces', tags: ['soft'], width: 800, height: 1200, requiresDiscordAuth: true },
  { id: 'nv-3', title: 'Square Icon', category: 'Icons', collection: 'Faces', tags: [], width: 800, height: 800, requiresDiscordAuth: false },
];

describe('Search state contract', () => {
  it('reads the existing q, type, tag, and category parameters without renaming them', () => {
    const state = readSearchState(new URLSearchParams('q=night&type=Banners&tag=night&category=Banners'));
    expect(state).toEqual({ query: 'night', type: 'Banners', tag: 'night', category: 'Banners' });
  });

  it('preserves current defaults and safe duplicate-parameter handling', () => {
    expect(readSearchState(new URLSearchParams())).toEqual({ query: '', type: 'All', tag: '', category: '' });
    expect(readSearchState(new URLSearchParams('q=first&q=second&type=Icons&type=Banners'))).toMatchObject({ query: 'first', type: 'Icons' });
  });

  it('keeps the approved filter vocabulary and source ordering', () => {
    expect(SEARCH_TYPES).toEqual(['All', 'Icons', 'Banners', 'Animated', 'Wallpapers', 'Portrait', 'Landscape']);
    expect(filterAssets(assets, { query: 'icon', type: 'All' }).map(asset => asset.id)).toEqual(['nv-2', 'nv-3']);
    expect(filterAssets(assets, { type: 'Portrait', access: 'restricted' }).map(asset => asset.id)).toEqual(['nv-2']);
  });

  it('keeps malformed values safe without broadening result inclusion', () => {
    expect(filterAssets(assets, { type: 'Unknown' })).toEqual([]);
    expect(filterAssets(assets, { access: 'unknown' }).map(asset => asset.id)).toEqual(['nv-1', 'nv-3']);
  });
});
