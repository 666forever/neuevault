import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');

describe('footer and application shell', () => {
  it('owns one ordered header, main, footer shell', () => {
    expect(html.match(/<header\b/g)).toHaveLength(1);
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html.match(/<footer\b/g)).toHaveLength(1);
    expect(html.indexOf('<header')).toBeLessThan(html.indexOf('<main'));
    expect(html.indexOf('<main')).toBeLessThan(html.indexOf('<footer'));
    expect(css).toMatch(/body\s*\{[\s\S]*?min-height:\s*100vh[\s\S]*?display:\s*flex[\s\S]*?flex-direction:\s*column/);
    expect(css).toMatch(/#app\s*\{[\s\S]*?flex:\s*1 0 auto/);
    expect(css).toMatch(/\.site-footer\s*\{[\s\S]*?flex:\s*0 0 auto/);
    expect(css).not.toMatch(/\.site-footer\s*\{[^}]*position:\s*(?:fixed|absolute)/);
  });

  it('uses the existing brand once with singular semantics', () => {
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
    expect(footer).toContain('aria-label="pfseeker home"');
    expect(footer).toContain('class="brand-wordmark">pfseeker</span>');
    expect(footer.match(/aria-label="pfseeker home"/g)).toHaveLength(1);
    expect(footer).toContain('aria-hidden="true"');
    expect(footer).toContain('class="footer-profile-logo"');
    expect(footer).toContain('id="footer-pfseeker-title">pfseeker</h2>');
    expect(footer).toContain('Independently curated. Built for discovery.');
    expect(footer).toContain('&copy; 2026 pfseeker');
    expect(footer).not.toContain('Neuevault');
  });

  it('publishes only real internal route groups with no placeholders', () => {
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
    expect(footer.match(/<nav\b/g)).toHaveLength(2);
    expect(footer.match(/<ul>/g)).toHaveLength(2);
    for (const href of [
      '/recent', '/icons', '/banners', '/animated', '/wallpapers',
      '/collections', '/search', '/about',
    ]) expect(footer).toContain(`href="${href}"`);
    expect(footer).not.toMatch(/(?:coming soon|placeholder|href="#")/i);
    expect(footer).not.toMatch(/target=|rel=/);
  });

  it('uses the approved footer type, width, gutter, and responsive contracts', () => {
    expect(css).toMatch(/--type-footer-size:\s*13px/);
    expect(css).toMatch(/--type-footer-line:\s*18px/);
    expect(css).toMatch(/--footer-max:\s*var\(--container-footer\)/);
    expect(css).toMatch(/--footer-space-before:\s*128px/);
    expect(css).toMatch(/--footer-gutter:\s*16px[\s\S]*?--footer-space-before:\s*80px/);
    expect(css).toMatch(/\.footer-group a\s*\{[\s\S]*?min-height:\s*32px/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition:\s*none !important/);
  });
});
