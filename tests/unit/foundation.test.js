import { describe, expect, it } from 'vitest';
import { canDownloadOriginal, getDisplaySource, isRestricted } from '../../src/data/access.js';
import { filterAssets, sortAssets } from '../../src/utils/filter.js';
import { parseRoute } from '../../src/routing/routes.js';
import { countDescription } from '../../src/utils/content.js';
import { animatedCoverUrl } from '../../src/data/mediaUrls.js';

const assets = [
  { id: 'a', title: 'Night Icon', category: 'Icons', collection: 'one', tags: ['night'], width: 100, height: 100, uploadDate: '2026-01-01', requiresDiscordAuth: false, src: 'https://example.com/a.jpg', preview: 'https://example.com/a-preview.jpg' },
  { id: 'b', title: 'Wide Gothic', category: 'Banners', collection: 'two', tags: ['gothic'], width: 200, height: 100, uploadDate: '2026-02-01', requiresDiscordAuth: true, src: null, preview: 'https://example.com/b-preview.jpg' },
];

describe('filtering and sorting', () => {
  it('filters by stable tag, access, and orientation', () => {
    expect(filterAssets(assets, { tag: 'gothic', access: 'restricted', type: 'Landscape' })).toEqual([assets[1]]);
  });
  it('sorts without mutating the source', () => {
    expect(sortAssets(assets).map(asset => asset.id)).toEqual(['b', 'a']);
    expect(sortAssets(assets, 'title').map(asset => asset.id)).toEqual(['a', 'b']);
    expect(assets[0].id).toBe('a');
  });
});

describe('routes and access', () => {
  it('parses deep links and query values', () => {
    expect(parseRoute('#/asset/nv-005')).toMatchObject({ name: 'asset', params: { id: 'nv-005' } });
    expect(parseRoute('#/search?tag=gothic').query.get('tag')).toBe('gothic');
    expect(parseRoute('#/category/icons')).toMatchObject({ name: 'category', params: { slug: 'icons' } });
  });
  it('never exposes a restricted original', () => {
    expect(isRestricted(assets[1])).toBe(true);
    expect(canDownloadOriginal(assets[1])).toBe(false);
    expect(getDisplaySource(assets[1])).toBe(assets[1].preview);
    expect(canDownloadOriginal(assets[0])).toBe(true);
  });
});

describe('card content and animated cover policy', () => {
  it('prefixes counts without duplicating existing numeric prefixes', () => {
    expect(countDescription(25, 'Anonymous and melancholic icons.')).toBe('25 Anonymous and melancholic icons.');
    expect(countDescription(0, 'Anonymous icon.')).toBe('0 Anonymous icon.');
    expect(countDescription(25, '')).toBe('25');
    expect(countDescription(42, '25 Anonymous icons.')).toBe('42 Anonymous icons.');
    expect(countDescription(1, 'Anonymous and melancholic icon.')).toBe('1 Anonymous and melancholic icon.');
  });
  it('never creates an animated cover URL for restricted media', () => {
    expect(animatedCoverUrl({ animated: true, requiresDiscordAuth: true, src: null })).toBe('');
    expect(animatedCoverUrl({ animated: true, requiresDiscordAuth: false, src: '/media/originals/nv.gif' })).toBe('/media/originals/nv.gif');
  });
});
