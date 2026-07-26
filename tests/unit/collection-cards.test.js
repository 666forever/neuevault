import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { collectionCard } from '../../src/components/cards.js';
import { animatedCoverUrl } from '../../src/data/mediaUrls.js';

const root = path.resolve('.');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const cardsSource = await readFile(path.join(root, 'src/components/cards.js'), 'utf8');
const imagesSource = await readFile(path.join(root, 'src/components/images.js'), 'utf8');

const fixture = {
  slug: 'editorial-set',
  title: 'Editorial set',
  description: 'A deliberately long editorial description.',
  count: 12,
  cover: '/media/previews/nv-001.jpg',
  coverAnimated: '/media/originals/nv-001.gif',
  restricted: false,
};

describe('collection-card blueprint contract', () => {
  it('renders one semantic anchor with real metadata and decorative media', () => {
    const html = collectionCard(fixture);
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="/collections/editorial-set"');
    expect(html).toContain('class="cover-media collection-media-frame"');
    expect(html).toContain('class="cover-static"');
    expect(html).toContain('class="cover-animated"');
    expect(html.match(/alt=""/g)).toHaveLength(2);
    expect(html).toContain('<h3>Editorial set</h3>');
    expect(html).toContain('<p>12 A deliberately long editorial description.</p>');
    expect(html).not.toContain('category-card');
    expect(html).not.toContain('aria-label');
  });

  it('allows playback only for safe public animated originals', () => {
    expect(animatedCoverUrl({ animated: true, requiresDiscordAuth: false, src: '/media/originals/public.gif' })).toBe('/media/originals/public.gif');
    expect(animatedCoverUrl({ animated: true, requiresDiscordAuth: true, src: null })).toBe('');
    expect(animatedCoverUrl({ animated: false, requiresDiscordAuth: false, src: '/media/originals/static.jpg' })).toBe('');
    expect(collectionCard({ ...fixture, coverAnimated: '' })).not.toContain('data-animated-src');
  });

  it('keeps collection geometry distinct from category reveal behavior', () => {
    expect(css).toMatch(/--collection-card-lift:\s*-4px/);
    expect(css).toMatch(/--collection-media-scale-active:\s*1\.03/);
    expect(css).toMatch(/\.collection-card:is\(:hover, :focus-visible, :focus-within\)\s*\{[\s\S]*?translateY\(var\(--collection-card-lift\)\)/);
    expect(css).toMatch(/\.collection-card:is\(:hover, :focus-visible, :focus-within\) \.collection-media-frame\s*\{[\s\S]*?scale\(var\(--collection-media-scale-active\)\)/);
    expect(css).not.toMatch(/\.collection-card[^}]*category-media/);
    expect(css).not.toMatch(/\.collection-media-frame[^}]*opacity:\s*0/);
  });

  it('keeps touch and reduced-motion cards static and visible', () => {
    expect(css).toMatch(/@media \(hover: none\)[\s\S]*?\.collection-card:is\(:hover, :focus-visible, :focus-within\)\s*\{[\s\S]*?transform:\s*none/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.collection-card:is\(:hover, :focus-visible, :focus-within\)[\s\S]*?transform:\s*none/);
    expect(cardsSource).toContain('if (!card || reducedMotion || !hoverCapable) return;');
  });

  it('loads before crossfade and cleans sources on exit, visibility, and disposal', () => {
    expect(cardsSource).toMatch(/if \(!animated\.src\) animated\.src = animated\.dataset\.animatedSrc/);
    expect(cardsSource).toMatch(/animated\.complete && animated\.naturalWidth/);
    expect(cardsSource).toMatch(/card\.classList\.add\('cover-playing'\)/);
    expect(cardsSource).toMatch(/card\.classList\.remove\('cover-playing'\)[\s\S]*?setTimeout\(\(\) => animated\.removeAttribute\('src'\), 220\)/);
    expect(cardsSource).toContain("document.addEventListener('visibilitychange', visibilityChange)");
    expect(cardsSource).toContain("document.removeEventListener('visibilitychange', visibilityChange)");
    expect(cardsSource).toContain("animated.removeAttribute('src')");
  });

  it('preserves static geometry when previews or animation fail', () => {
    expect(css).toMatch(/\.collection-cover\s*\{[\s\S]*?aspect-ratio:\s*var\(--collection-media-ratio\)/);
    expect(css).toMatch(/\.image-error\s*\{[\s\S]*?min-height:\s*180px/);
    expect(imagesSource).toMatch(/cover-animated[\s\S]*?collection-card[\s\S]*?cover-playing[\s\S]*?image\.remove\(\)[\s\S]*?return/);
  });
});
