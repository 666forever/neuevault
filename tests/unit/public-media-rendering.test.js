import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderAssetCard } from '../../src/components/AssetGrid.js';
import { categoryCard } from '../../src/components/cards.js';

const asset = overrides => ({ id: 'nv-gif', title: 'Animated', preview: '/media/previews/nv-gif.webp', animatedPlayback: '/media/originals/nv-gif.gif', animated: true, requiresDiscordAuth: false, width: 320, height: 240, category: 'Animated', ...overrides });

describe('public animated media rendering', () => {
  it('renders a lazy animated layer only for public playback sources', () => {
    const card = renderAssetCard(asset(), 0, 'grid');
    expect(card).toContain('data-gallery-animated-src="/media/originals/nv-gif.gif"');
    expect(card).not.toContain('style=');
    expect(card).toContain('width="320" height="240"');
    expect(renderAssetCard(asset({ requiresDiscordAuth: true, animatedPlayback: '' }), 0, 'grid')).not.toContain('data-gallery-animated-src');
  });

  it('uses the same shared category card classes for every stable ID', () => {
    const first = categoryCard({ id: 'cat-001', slug: 'one', title: 'One', count: 0, description: '', image: '/one.jpg' });
    const fourth = categoryCard({ id: 'cat-004', slug: 'four', title: 'Four', count: 0, description: '', image: '/four.jpg', coverAnimated: '/four.gif' });
    expect(first).toContain('class="category-card"'); expect(fourth).toContain('class="category-card"');
    expect(first).toContain('aria-label="One"'); expect(first).toContain('class="category-copy-inner"');
    expect(fourth).not.toContain('cat-004'); expect(fourth).not.toContain('style=');
  });

  it('contains no positional category opacity or brightness exception', async () => {
    const css = await readFile(path.resolve('styles.css'), 'utf8');
    expect(css).not.toMatch(/\.category-card\s*:(?:nth-child|last-child)/);
  });
});
