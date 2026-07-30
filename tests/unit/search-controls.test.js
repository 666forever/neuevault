import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const search = read('src/pages/searchPage.js');
const css = read('styles.css');

describe('Search controls and state presentation', () => {
  it('uses a Search landmark, persistent labels, and native field semantics', () => {
    expect(search).toContain('<form class="search-panel" role="search">');
    expect(search).toContain('<label class="visually-hidden" for="search-input">Search assets</label>');
    expect(search).toContain('id="search-input" type="search"');
    expect(search).toContain('<label class="visually-hidden" for="access-filter">Filter by access</label>');
    expect(search).toContain('<select class="select" id="access-filter">');
  });

  it('exposes each filter state exactly once and updates it on activation', () => {
    expect(search).toContain('aria-pressed="${filter === initialType}"');
    expect(search).toContain("app.querySelector('.filter[aria-pressed=\"true\"]')?.setAttribute('aria-pressed', 'false')");
    expect(search).toContain("button.setAttribute('aria-pressed', 'true')");
    expect(search).not.toMatch(/tabindex="-1"/);
  });

  it('uses the bounded Search geometry and coherent field/pill contracts', () => {
    for (const token of [
      '--search-page-max: 1180px',
      '--search-control-radius: var(--radius-pill)',
      '--search-control-padding-inline: 18px',
      '--search-filter-height: 36px',
      '--search-filter-padding-inline: 14px',
      '--search-filter-gap: 8px',
    ]) expect(css).toContain(token);
    expect(css).toMatch(/\.search-content\s*\{[\s\S]*?width:\s*min\(100%, var\(--search-page-max\)\)[\s\S]*?margin-inline:\s*auto/);
  });

  it('keeps native submit behavior inert and does not introduce History mutations', () => {
    expect(search).toContain("addEventListener('submit', event => event.preventDefault())");
    expect(search).not.toMatch(/history\.(?:pushState|replaceState)/);
  });

  it('presents a stable, labelled Search empty state without a dashed placeholder', () => {
    expect(search).toContain('class="search-empty" aria-labelledby="search-empty-title"');
    expect(search).toContain('<h2 id="search-empty-title">No matching assets</h2>');
    expect(search).toContain('<p>No assets match these filters.</p>');
    expect(css).toMatch(/\.search-empty\s*\{[\s\S]*?background:\s*var\(--bg-surface\)[\s\S]*?border:\s*var\(--border-subtle\)[\s\S]*?border-radius:\s*var\(--search-empty-radius\)/);
  });
});
