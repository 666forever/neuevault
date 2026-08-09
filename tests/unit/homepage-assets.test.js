import { describe, expect, it } from 'vitest';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { HERO_WORDS, selectHeroWord } from '../../src/pages/pages.js';

const root = path.resolve('.');
const permanentAssets = [
  'public/assets/brand/logo28x28.svg',
  'public/assets/icons/signin-discord.svg',
  'public/assets/icons/collections-bookmark.svg',
  'public/assets/icons/bolt.svg',
  'public/assets/video/furina-hero-1080p.mp4',
  'public/assets/video/furina-hero-1440p.mp4',
  'public/assets/video/heronew.gif',
  'public/assets/video/sailor_hero-desktop.mp4',
  'public/assets/video/sailor_hero-mobile.mp4',
  'public/assets/video/heroimage.png',
  'public/assets/icons/microdesign/globe.svg',
  'public/assets/icons/microdesign/spark.svg',
  'public/assets/icons/microdesign/lines.svg',
  'public/assets/icons/microdesign/tilts.svg',
  'public/assets/textures/hero_grain.png',
  'public/fonts/SF-Pro-Rounded-Regular.woff2',
  'public/fonts/SF-Pro-Rounded-Medium.woff2',
  'public/fonts/SF-Pro-Rounded-Semibold.woff2',
  'public/fonts/tbj-neuetra-vf.woff2',
  'public/assets/brand/favicon.ico',
  'public/assets/brand/favicon-16x16.png',
  'public/assets/brand/favicon-32x32.png',
  'public/assets/brand/apple-touch-icon.png',
  'public/assets/brand/site.webmanifest',
];

describe('homepage presentation assets', () => {
  it('selects each approved hero word deterministically without expanding the word set', () => {
    expect(HERO_WORDS).toEqual(['Banners', 'Icons', 'Wallpapers']);
    expect(selectHeroWord(() => 0)).toBe('Banners');
    expect(selectHeroWord(() => 1 / 3)).toBe('Icons');
    expect(selectHeroWord(() => 2 / 3)).toBe('Wallpapers');
  });
  it('keeps every migrated asset at its permanent public path', async () => {
    await Promise.all(permanentAssets.map(file => expect(access(path.join(root, file))).resolves.toBeUndefined()));
    await expect(access(path.join(root, 'temp'))).rejects.toThrow();
  });

  it('contains no production references to the temporary directory', async () => {
    const sources = await Promise.all(['index.html', 'app.js', 'styles.css', 'src/pages/pages.js'].map(file => readFile(path.join(root, file), 'utf8')));
    expect(sources.join('\n')).not.toContain('temp/');
    expect(sources.join('\n')).toContain('/fonts/tbj-neuetra-vf.woff2');
    expect(sources.join('\n')).toContain('/assets/brand/logo28x28.svg');
    expect(sources.join('\n')).toContain('/assets/video/heroimage.png');
    expect(sources.join('\n')).not.toContain('/assets/video/sailor_hero-desktop.mp4');
    expect(sources.join('\n')).not.toContain('/assets/video/sailor_hero-mobile.mp4');
    expect(sources.join('\n')).not.toContain('/assets/video/heronew.gif');
    expect(sources.join('\n')).not.toContain('/assets/video/hero.gif');
    expect(await readFile(path.join(root, 'src/pages/pages.js'), 'utf8')).not.toContain('furina-hero-');
    expect(sources.join('\n')).not.toContain('/assets/textures/hero-grain-1000px.png');
  });

  it('uses clean navigation, real shared branding, favicons, and requested UI values', async () => {
    const html = await readFile(path.join(root, 'index.html'), 'utf8'); const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(html).toContain('<title>Banners &amp; Icons with intent</title>');
    expect(html).not.toContain('href="#/'); expect(html.match(/brand-logo-shell/g)?.length).toBeGreaterThanOrEqual(2);
    const primaryNav = html.match(/<nav class="main-nav"[\s\S]*?<div class="mobile-nav-actions">/)?.[0] || '';
    expect([...primaryNav.matchAll(/<a href="([^"]+)" data-nav="([^"]+)">([^<]+)<\/a>/g)].map(match => match.slice(1))).toEqual([
      ['/icons', 'icons', 'Icons'], ['/banners', 'banners', 'Banners'], ['/wallpapers', 'wallpapers', 'Wallpapers'], ['/collections', 'collections', 'Collections'],
    ]);
    expect(css).toContain('--color-acid: #5865F2'); expect(css).toContain('--nav-item-gap: 2px'); expect(css).toContain('--tracking-nav: 0');
    expect(css).toMatch(/\.site-header\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?background:\s*var\(--color-black\)/);
    const manifest = JSON.parse(await readFile(path.join(root, 'public/assets/brand/site.webmanifest'), 'utf8'));
    expect(manifest.icons.every(icon => icon.src.startsWith('/assets/brand/'))).toBe(true);
  });

  it('defines a stable, testable hero-word selection and preserves its deliberate line structure', async () => {
    const pages = await readFile(path.join(root, 'src/pages/pages.js'), 'utf8');
    const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(pages).toContain("export const HERO_WORDS = Object.freeze(['Banners', 'Icons', 'Wallpapers'])");
    expect(pages).toContain('export function selectHeroWord(random = Math.random)');
    expect(pages).toContain('const heroWord = selectHeroWord(random)');
    expect(pages).toContain('<h1><span>Probably the best</span> <span><span class="hero-title-dynamic">${escapeHtml(heroWord)}</span> on the Internet.</span></h1>');
    expect(pages).toContain('<span>Start digging through alt, emo, dark, soft, strange, cute, messy, and more in the spaces where they all cross.</span> <span>Your identity forms in this borderland.</span>');
    expect(pages).not.toContain('hero-eyebrow');
    expect(css).toMatch(/\.hero-description span\s*\{\s*display:\s*block/);
    expect(css).not.toMatch(/\.hero h1\s*\{[^}]*text-wrap:\s*balance/);
    expect(css).toContain('.hero h1 .hero-title-dynamic { display: inline; }');
    for (const token of ['--text-hero: 76px', '--hero-content-max: auto', '--hero-title-copy-gap: 32px', '--hero-copy-size: 17px', '--hero-copy-cta-gap: 72px', '--hero-cta-radius: 99px', '--hero-cta-gap: 10px', '--hero-cta-icon-width: 16px', '--hero-cta-icon-height: 19px', '--radius-discord-auth: 12px']) expect(css).toContain(token);
    expect(css).toMatch(/\.hero-cta\s*\{[\s\S]*?font-size:\s*17px/);
    expect(css).toMatch(/\.button\s*\{[\s\S]*?border-radius:\s*var\(--radius-discord-auth\)/);
    expect(css).toMatch(/\.button-light\s*\{\s*background:\s*var\(--color-acid\)/);
    expect(css).toMatch(/\.hero-media\s*\{[\s\S]*?object-fit:\s*cover;[\s\S]*?object-position:\s*center;[\s\S]*?opacity:\s*0\.8/);
    expect(css).toContain('linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%)');
    expect(pages).not.toContain('hero-grain');
    for (const asset of ['globe.svg', 'spark.svg', 'lines.svg', 'tilts.svg']) expect(css).toContain(`/assets/icons/microdesign/${asset}`);
    expect(pages).toContain('<img class="hero-media" src="/assets/video/heroimage.png" alt="" aria-hidden="true" decoding="async">');
    expect(css).toMatch(/\.hero-decorations\s*\{[\s\S]*?z-index:\s*2;[\s\S]*?pointer-events:\s*none/);
    expect(css).toMatch(/\.hero-decorations::after\s*\{[\s\S]*?width:\s*min\(390px,[\s\S]*?opacity:\s*0\.1/);
  });

  it('reserves six homepage collection slots without creating fake collection data', async () => {
    const pages = await readFile(path.join(root, 'src/pages/pages.js'), 'utf8');
    expect(pages).toContain('collections.filter(collection => collection.featured).slice(0, 6)');
    expect(pages).toContain('Math.max(0, 6 - featured.length)');
    expect(pages).toContain('class="collection-card collection-card-empty" aria-hidden="true"');
    expect(pages).not.toMatch(/collection-card-empty[^\n]*href=/);
  });

  it('uses the approved local SF Pro Rounded faces without italic production references', async () => {
    const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(css).toMatch(/SF-Pro-Rounded-Regular\.woff2[\s\S]*?font-weight:\s*400/);
    expect(css).toMatch(/SF-Pro-Rounded-Medium\.woff2[\s\S]*?font-weight:\s*500/);
    expect(css).toMatch(/SF-Pro-Rounded-Semibold\.woff2[\s\S]*?font-weight:\s*600/);
    expect(css).toMatch(/tbj-neuetra-vf\.woff2[\s\S]*?font-weight:\s*100 900/);
    expect(css).not.toMatch(/Arimo|Archivo|Inter/);
    expect(css).not.toMatch(/font-weight:\s*(?:700|800|900)\b/);
    expect(css).not.toContain('Italic-VariableFont');
    expect(css).toContain('font-synthesis: none');
    expect(css).toContain('text-rendering: optimizeLegibility');
  });
});
