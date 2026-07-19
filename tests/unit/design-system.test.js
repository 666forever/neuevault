import { describe, expect, it } from 'vitest';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');

describe('public design system', () => {
  it('declares the required primitive, semantic, component, layout, motion, and layer tokens', () => {
    for (const token of [
      '--color-acid', '--gray-900', '--bg-page', '--bg-surface', '--text-primary', '--text-muted',
      '--border-subtle', '--focus-ring', '--font-body', '--font-ui', '--font-brand', '--type-nav-size', '--type-button-size',
      '--space-4', '--radius-card', '--radius-brand', '--radius-pill', '--control-height-sm', '--control-height-field',
      '--icon-md', '--shadow-hero-title', '--duration-normal', '--duration-card', '--duration-fade', '--ease-standard', '--container-nav',
      '--container-page', '--page-gutter', '--section-space', '--z-header', '--z-modal', '--z-auth-dialog', '--z-toast',
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
});
