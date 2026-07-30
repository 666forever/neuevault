import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const pages = readFileSync(new URL('../../src/pages/pages.js', import.meta.url), 'utf8');
const search = readFileSync(new URL('../../src/pages/searchPage.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

describe('route and editorial surfaces', () => {
  it('keeps one semantic route title and preserves authored archive and About copy', () => {
    expect(pages).toContain('<h1>Collections</h1>');
    expect(pages).toContain('<h1>Recently Added</h1>');
    expect(pages).toContain('<h1>Saved with intent.</h1>');
    expect(pages).toContain('Neuevault is an independently curated visual archive for images worth returning to.');
    expect(search).toContain("const heading = archive && SEARCH_TYPES.includes(initialType)");
  });

  it('preserves collection detail content, real count, tags, and public preview source', () => {
    expect(pages).toContain('safeUrl(collection.cover)');
    expect(pages).toContain('countDescription(collection.count, collection.description)');
    expect(pages).toContain('collection.tags.map');
    expect(pages).toContain('href="/search?tag=${encodeURIComponent(tag)}"');
    expect(pages).not.toContain('collection.src');
  });

  it('keeps back links as real registry-icon links with stable destinations', () => {
    expect(pages).toContain("label: 'Home', icon: 'back', href: '/'");
    expect(pages).toContain("label: 'All collections', icon: 'back', href: '/collections'");
    expect(pages).not.toMatch(/[←↩]/);
  });

  it('distinguishes navigational tags from static restricted metadata', () => {
    expect(pages).toContain('<a class="tag" href="/search?tag=');
    expect(pages).toContain('<span class="tag">Includes restricted originals</span>');
  });

  it('provides semantic loading, empty, error, and Not Found surfaces', () => {
    expect(app).toContain('class="route-state route-loading" role="status" aria-live="polite"');
    expect(app).toContain('class="route-state route-error" role="alert" aria-labelledby="route-error-title"');
    expect(pages).toContain('class="route-state route-empty" aria-labelledby="category-empty-title"');
    expect(pages).toContain('class="route-state route-not-found" aria-labelledby="not-found-title"');
  });

  it('uses scoped route tokens without changing Search or asset-grid contracts', () => {
    for (const token of [
      '--route-content-max',
      '--route-title-max',
      '--route-title-size',
      '--route-title-line',
      '--route-title-tracking',
      '--route-hero-min-height',
      '--route-tag-height',
      '--state-surface-max',
    ]) expect(css).toContain(token);
    expect(search).toContain('variant = \'search\'');
    expect(search).toContain('renderAssetGrid(list)');
    expect(search).toContain('debounce(render, 180)');
  });

  it('contains long editorial text and metadata without transforms or fixed title heights', () => {
    expect(css).toMatch(/\.route-page-title h1,[\s\S]*?overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.tag\s*\{[\s\S]*?flex-wrap|\.tags\s*\{[\s\S]*?flex-wrap:\s*wrap/);
    const routeTitleRule = css.match(/\.route-copy h1,[\s\S]*?\n\}/)?.[0] || '';
    expect(routeTitleRule).not.toMatch(/\n\s*height:/);
    expect(routeTitleRule).not.toMatch(/\n\s*transform:/);
  });
});
