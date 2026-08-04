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
  alt: '/media/previews/nv-002.jpg',
  coverAnimated: '/media/originals/nv-001.gif',
  altGif: '/media/originals/nv-002.gif',
  restricted: false,
};

describe('collection-card blueprint contract', () => {
  it('renders one semantic anchor with real metadata and decorative media', () => {
    const html = collectionCard(fixture);
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="/collections/editorial-set"');
    expect(html).toContain('class="cover-media collection-media-frame media-default"');
    expect(html).toContain('class="cover-media collection-media-frame media-alternate"');
    expect(html).toContain('class="cover-static"');
    expect(html).toContain('class="cover-static cover-alternate"');
    expect(html).toContain('data-alternate-src="/media/previews/nv-002.jpg"');
    expect(html).toContain('data-animated-src="/media/originals/nv-001.gif"');
    expect(html).toContain('data-animated-src="/media/originals/nv-002.gif"');
    expect(html.match(/alt=""/g)).toHaveLength(4);
    expect(html).toContain('<h3>Editorial set</h3>');
    expect(html).toContain('<p>12 A deliberately long editorial description.</p>');
    expect(html).not.toContain('category-card');
    expect(html).not.toContain('aria-label');
  });

  it('allows playback only for safe public animated originals', () => {
    expect(animatedCoverUrl({ animated: true, requiresDiscordAuth: false, src: '/media/originals/public.gif' })).toBe('/media/originals/public.gif');
    expect(animatedCoverUrl({ animated: true, requiresDiscordAuth: true, src: null })).toBe('');
    expect(animatedCoverUrl({ animated: false, requiresDiscordAuth: false, src: '/media/originals/static.jpg' })).toBe('');
    expect(collectionCard({ ...fixture, alt: '' })).not.toContain('data-alternate-src');
  });

  it('keeps collection geometry distinct from category reveal behavior', () => {
    expect(css).toMatch(/--collection-section-max:\s*1440px/);
    expect(css).toMatch(/--collection-grid-gap:\s*15px/);
    expect(css).toMatch(/--collection-card-padding:\s*5px/);
    expect(css).toMatch(/--collection-card-radius:\s*20px/);
    expect(css).toMatch(/--collection-media-radius:\s*15px/);
    expect(css).toMatch(/--collection-media-ratio:\s*41\s*\/\s*44/);
    expect(css).toMatch(/--collection-meta-padding-inline:\s*24px/);
    expect(css).toMatch(/--collection-heading-grid-gap:\s*30px/);
    expect(css).toMatch(/--collection-crossfade-duration:\s*1s/);
    expect(css).toMatch(/\.section\.collection-section\s*\{[\s\S]*?--collection-section-gutter/);
    expect(css).toMatch(/\.collection-grid\s*\{[\s\S]*?repeat\(3,\s*1fr\)/);
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.collection-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
    expect(css).toMatch(/\.collection-card\s*\{[\s\S]*?border:\s*0/);
    expect(css).not.toMatch(/\.collection-card:is\(:hover, :focus-visible, :focus-within\)\s*\{[\s\S]*?(?:translate|scale)/);
    expect(css).toMatch(/\.collection-media-frame\s*\{[\s\S]*?transform:\s*none/);
    expect(css).not.toMatch(/\.collection-card:is\(:hover, :focus-visible, :focus-within\) \.collection-media-frame/);
    expect(css).toMatch(/\.collection-card \.media-default,[\s\S]*?\.collection-card \.media-alternate\s*\{[\s\S]*?opacity var\(--collection-crossfade-duration\) var\(--ease-standard\)/);
    expect(css).not.toMatch(/\.collection-card[^}]*category-media/);
    expect(css).toMatch(/\.collection-card \.media-alternate\s*\{\s*opacity:\s*0/);
    expect(css).toMatch(/\.collection-card\.cover-playing \.media-default\s*\{\s*opacity:\s*0/);
    expect(css).toMatch(/\.collection-card\.cover-playing \.media-alternate\s*\{\s*opacity:\s*1/);
    expect(css).not.toMatch(/\.category-card[^}]*collection-/);
  });

  it('keeps touch and reduced-motion cards static and visible', () => {
    expect(cardsSource).toContain('if (!card || reducedMotion || !hoverCapable) return;');
  });

  it('loads the deterministic alternate before crossfade and cleans sources on disposal', () => {
    expect(cardsSource).toMatch(/if \(!alternate\.src\) alternate\.src = alternate\.dataset\.alternateSrc/);
    expect(cardsSource).toMatch(/alternate\.complete && alternate\.naturalWidth/);
    expect(cardsSource).toMatch(/card\.classList\.add\('cover-playing'\)/);
    expect(cardsSource).toMatch(/card\.classList\.remove\('cover-playing'\)/);
    expect(cardsSource).toContain("document.addEventListener('visibilitychange', visibilityChange)");
    expect(cardsSource).toContain("document.removeEventListener('visibilitychange', visibilityChange)");
    expect(cardsSource).toContain("alternateAnimated?.removeAttribute('src')");
    expect(cardsSource).toContain("defaultAnimated?.removeAttribute('src')");
    expect(cardsSource).toContain("card.__startAnimatedCover = startDefault");
    expect(cardsSource).toContain("const stopAll = () => { stopAlternate(); defaultAnimated?.removeAttribute('src'); }");
  });

  it('preserves static geometry when previews or animation fail', () => {
    expect(css).toMatch(/\.collection-cover\s*\{[\s\S]*?aspect-ratio:\s*var\(--collection-media-ratio\)/);
    expect(css).toMatch(/\.image-error\s*\{[\s\S]*?min-height:\s*180px/);
    expect(imagesSource).toMatch(/image\.classList\.contains\('cover-animated'\) \|\| image\.classList\.contains\('cover-alternate'\)[\s\S]*?image\.remove\(\)/);
    expect(css).toMatch(/\.collection-card \.cover-animated\[src\]\s*\{\s*opacity:\s*1/);
    expect(imagesSource).toMatch(/cover-alternate[\s\S]*?cover-playing[\s\S]*?image\.remove\(\)/);
  });
});
