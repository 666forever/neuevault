import { describe, expect, it } from 'vitest';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const development = await readFile(path.join(root, 'DEVELOPMENT.md'), 'utf8');

describe('public design system', () => {
  it('declares the required primitive, semantic, component, layout, motion, and layer tokens', () => {
    for (const token of [
      '--color-acid', '--gray-900', '--bg-page', '--bg-surface', '--text-primary', '--text-muted',
      '--border-subtle', '--focus-ring', '--font-body', '--font-ui', '--font-brand', '--type-nav-size', '--type-button-size',
      '--space-4', '--radius-card', '--radius-brand', '--radius-pill', '--control-height-sm', '--control-height-field',
      '--icon-md', '--shadow-hero-title', '--duration-normal', '--duration-card', '--duration-fade', '--ease-standard', '--container-nav',
      '--container-page', '--page-gutter', '--section-space', '--brand-gap', '--nav-actions-gap', '--hero-content-max',
      '--tracking-hero-title', '--hero-title-copy-gap', '--type-auth-title-mobile-size', '--z-header', '--z-hero-content',
      '--z-modal', '--z-auth-dialog', '--z-toast',
      '--font-hero-eyebrow', '--hero-frame-max', '--hero-frame-ratio', '--hero-frame-max-height', '--hero-eyebrow-height',
      '--hero-eyebrow-title-gap', '--hero-copy-cta-gap', '--hero-cta-width', '--hero-cta-height', '--hero-cta-radius',
      '--font-category', '--category-grid-max', '--category-grid-gap', '--category-card-ratio', '--category-card-radius',
      '--category-copy-max', '--category-copy-min-height', '--category-count-size', '--category-title-size',
      '--category-copy-line', '--category-copy-weight', '--category-image-rest-opacity', '--category-image-active-opacity',
    ]) expect(css).toMatch(new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`));
  });

  it('uses semantic tokens in representative shared components', () => {
    expect(css).toMatch(/\.button\s*\{[\s\S]*?min-height:\s*var\(--control-height-sm\)/);
    expect(css).toMatch(/\.main-nav\s*\{[\s\S]*?gap:\s*var\(--nav-gap\)/);
    expect(css).toMatch(/\.hero h1\s*\{[\s\S]*?font-size:\s*var\(--type-hero-size\)/);
    expect(css).toMatch(/\.select,[\s\S]*?\.search-input\s*\{[\s\S]*?height:\s*var\(--control-height-field\)/);
    expect(css).toMatch(/\.modal\s*\{[\s\S]*?z-index:\s*var\(--z-modal\)/);
    expect(css).toMatch(/\.auth-dialog\s*\{[\s\S]*?z-index:\s*var\(--z-auth-dialog\)/);
    expect(css).toMatch(/footer\s*\{[\s\S]*?var\(--container-footer\)/);
  });

  it('keeps one canonical rule for formerly duplicated component selectors', () => {
    const count = selector => [...css.matchAll(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`, 'g'))].length;
    expect(count('.asset-card img')).toBe(1);
    expect(count('.modal-actions')).toBe(1);
    expect([...css.matchAll(/@media \(max-width: 700px\)/g)]).toHaveLength(1);
    expect(css).not.toMatch(/--(?:bg|surface|surface-2|line|text|muted|acid|max|ease):/);
  });

  it('retains reduced-motion behavior and resolves every local CSS asset reference', async () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition:\s*none !important/);
    const urls = [...css.matchAll(/url\("(\/[^"?]+)"\)/g)].map(match => match[1]);
    await Promise.all(urls.map(url => expect(access(path.join(root, 'public', url))).resolves.toBeUndefined()));
  });

  it('keeps production authentication, restricted access, and derived counts documented accurately', () => {
    expect(development).toContain('Discord OAuth is configured and active in production');
    expect(development).toContain('Authentication canonicalizes through `www.pfseeker.com`');
    expect(development).toContain('`nv-166` is currently the first production restricted asset');
    expect(development).toContain('public manifest retains `src: null`');
    expect(development).toContain('any authenticated Discord account');
    expect(development).not.toContain('Optionally supply `archiveCount`');
    expect(development).not.toContain('There are currently no restricted assets');
  });

  it('does not use spacing tokens for typography or raw values for named hero layers', () => {
    expect(css).not.toMatch(/font-size:\s*var\(--space-/);
    expect(css).toContain('.auth-dialog-card h2 { font-size: var(--type-auth-title-mobile-size); }');
    expect(css).toMatch(/\.hero-content\s*\{[\s\S]*?z-index:\s*var\(--z-hero-content\)/);
  });

  it('defines the responsive category-card contract without Figma positioning', () => {
    expect(css).toContain('font-family: "Arimo"');
    expect(css).toContain('font-weight: 400 700');
    expect(css).toMatch(/\.category-grid\s*\{[\s\S]*?width:\s*min\(100%, var\(--category-grid-max\)\)[\s\S]*?gap:\s*var\(--category-grid-gap\)/);
    expect(css).toMatch(/\.category-card\s*\{[\s\S]*?aspect-ratio:\s*var\(--category-card-ratio\)[\s\S]*?border-radius:\s*var\(--category-card-radius\)/);
    expect(css).toMatch(/\.category-copy-inner\s*\{[\s\S]*?filter:\s*var\(--category-copy-shadow\)/);
    expect(css).toMatch(/@media \(hover: none\)[\s\S]*?category-card:not\(\.cover-playing\)/);
    expect(css).not.toMatch(/\.category-copy(?:-inner)?\s*\{[^}]*\b(?:left|top):/);
  });

  it('defines the revised responsive hero without the obsolete vignette or tiled grain', () => {
    expect(css).toContain('font-family: "Archivo"');
    expect(css).toContain('font-stretch: 62% 125%');
    expect(css).toMatch(/\.hero\s*\{[\s\S]*?aspect-ratio:\s*var\(--hero-frame-ratio\)[\s\S]*?max-height:\s*var\(--hero-frame-max-height\)[\s\S]*?background:\s*var\(--bg-surface\)/);
    expect(css).toContain('linear-gradient(180deg, rgba(255, 255, 255, 0) -35.43%, rgba(0, 0, 0, 0.33) 36.66%)');
    expect(css).not.toContain('radial-gradient(177.97% 93.94%');
    expect(css).toContain('url("/assets/textures/hero_grain.png") center / 100% 100% no-repeat');
    expect(css).not.toContain('url("/assets/textures/hero-grain-1000px.png")');
  });
});
