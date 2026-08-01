import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderAssetCard, renderAssetGrid } from '../../src/components/AssetGrid.js';

const root = path.resolve('.');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const gridSource = await readFile(path.join(root, 'src', 'components', 'AssetGrid.js'), 'utf8');
const imageSource = await readFile(path.join(root, 'src', 'components', 'images.js'), 'utf8');

const asset = (overrides = {}) => ({
  id: 'nv-test',
  title: 'Stable preview',
  preview: '/media/previews/nv-test.jpg',
  previewSrcSet: '/media/previews/nv-test-320.jpg 320w',
  animatedPlayback: '',
  animated: false,
  requiresDiscordAuth: false,
  width: 1200,
  height: 800,
  category: 'Banners',
  ...overrides,
});

describe('asset card and stable masonry contract', () => {
  it('keeps one semantic control, stable identity, intrinsic preview, and logical index', () => {
    const card = renderAssetCard(asset(), 3, 'asset-grid-stable');
    expect(card.match(/<button\b/g)).toHaveLength(1);
    expect(card).toContain('data-asset-id="nv-test"');
    expect(card).toContain('data-asset-index="3"');
    expect(card).toContain('aria-label="Open Stable preview"');
    expect(card).toContain('class="asset-static"');
    expect(card).toContain('width="1200" height="800"');
    expect(card).toContain('alt="Stable preview"');
  });

  it('keeps public animation optional and blocks restricted playback markup', () => {
    const animated = renderAssetCard(asset({
      animated: true,
      animatedPlayback: '/media/originals/nv-test.gif',
    }), 0, 'grid');
    expect(animated).toContain('data-gallery-animated-src="/media/originals/nv-test.gif"');
    expect(animated).toContain('<span class="format-badge">GIF</span>');
    expect(animated).toContain('class="asset-animated" alt=""');

    const restricted = renderAssetCard(asset({
      animated: true,
      animatedPlayback: '',
      requiresDiscordAuth: true,
    }), 0, 'grid');
    expect(restricted).not.toContain('data-gallery-animated-src');
    expect(restricted).toContain('class="lock" aria-label="Restricted original"');
  });

  it('retains malformed bounds and static/animated failure separation', () => {
    const malformed = renderAssetCard(asset({ width: 0, height: 0 }), 0, 'grid');
    expect(malformed).toContain('asset-card malformed-media');
    expect(malformed).not.toMatch(/\swidth="0"\sheight="0"/);
    expect(css).toMatch(/\.malformed-media \.asset-thumb\s*\{[^}]*height:\s*100%/);
    expect(css).toMatch(/\.image-error\s*\{[^}]*min-height:\s*180px/);
    expect(imageSource).toMatch(/classList\.contains\('asset-animated'\)[\s\S]*?classList\.remove\('asset-playing'\)[\s\S]*?image\.remove\(\)[\s\S]*?return/);
  });

  it('uses deterministic positioned masonry with approved desktop and mobile gaps', () => {
    for (const [token, value] of [
      ['--asset-grid-max', '1440px'],
      ['--asset-grid-gutter', '15px'],
      ['--asset-column-gap', '15px'],
      ['--asset-row-gap', '15px'],
      ['--asset-card-radius', 'var\\(--radius-asset\\)'],
    ]) expect(css).toMatch(new RegExp(`${token}:\\s*${value}`));
    expect(css).toMatch(/\.masonry\s*\{[\s\S]*?position:\s*relative;[\s\S]*?width:\s*100%/);
    expect(css).toMatch(/\.asset-card\s*\{[\s\S]*?position:\s*absolute/);
    expect(css).not.toMatch(/\.masonry\s*\{[^}]*columns:/);
  });

  it('caps media scale at 1.025 and gives keyboard focus visual parity', () => {
    expect(css).toMatch(/\.asset-card:is\(:hover, :focus-visible\) img\s*\{[\s\S]*?transform:\s*scale\(1\.025\)[\s\S]*?filter:\s*saturate\(0\.95\)/);
    expect(css.match(/\.asset-card\s*\{([^}]*)\}/)?.[1]).not.toContain('transform:');
    expect(css).toMatch(/\.asset-overlay\s*\{[\s\S]*?min-height:\s*var\(--asset-overlay-min-height\)[\s\S]*?linear-gradient/);
    expect(css).toMatch(/\.asset-card:hover \.asset-overlay,[\s\S]*?\.asset-card:focus-visible \.asset-overlay\s*\{[\s\S]*?opacity:\s*1/);
  });

  it('keeps mobile metadata visible and reduced motion functional', () => {
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.asset-overlay\s*\{[\s\S]*?opacity:\s*1/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition:\s*none !important/);
  });

  it('preserves batching, load-more, observers, cleanup, and modal callback wiring', () => {
    const items = Array.from({ length: 10 }, (_, index) => asset({ id: `nv-${index}`, title: `Asset ${index}` }));
    const grid = renderAssetGrid(items);
    expect(grid.match(/class="asset-card/g)).toHaveLength(8);
    expect(grid).toMatch(/class="[^"]*\bload-more\b[^"]*"/);
    expect(gridSource).toContain('batchSize = 8');
    expect(gridSource).toContain('APPEND_BATCH_SIZE = 16');
    expect(gridSource).toContain("rootMargin: '600px 0px'");
    expect(gridSource).toContain('appendMasonryLayout(state.plan, added)');
    expect(gridSource).toContain('new ResizeObserver');
    expect(gridSource).toContain("image.decode?.()");
    expect(gridSource).toContain('entry.intersectionRatio >= 0.35');
    expect(gridSource).toContain('setTimeout(unload, 220)');
    expect(gridSource).toContain('state?.loader?.disconnect()');
    expect(gridSource).toContain('state?.animator?.disconnect()');
    expect(gridSource).toContain('onOpen(state.items, Number(button.dataset.assetIndex), button)');
  });
});
