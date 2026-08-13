import { describe, expect, it } from 'vitest';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { HERO_WORDS, selectHeroWord } from '../../src/pages/pages.js';

const root = path.resolve('.');
const permanentAssets = [
  'public/assets/brand/logo28x28.svg',
  'public/assets/brand/profileseeker.svg',
  'public/assets/icons/signin-discord.svg',
  'public/assets/icons/collections-bookmark.svg',
  'public/assets/icons/bolt.svg',
  'public/assets/icons/CTA-icons-banners.svg',
  'public/assets/video/furina-hero-1080p.mp4',
  'public/assets/video/furina-hero-1440p.mp4',
  'public/assets/video/heronew.gif',
  'public/assets/video/sailor_hero-desktop.mp4',
  'public/assets/video/sailor_hero-mobile.mp4',
  'public/assets/icons/microdesign/globe.svg',
  'public/assets/icons/microdesign/spark.svg',
  'public/assets/icons/microdesign/lines.svg',
  'public/assets/icons/microdesign/tilts.svg',
  'public/assets/textures/hero_grain.png',
  'public/fonts/SF-Pro-Rounded-Regular.woff2',
  'public/fonts/SF-Pro-Rounded-Medium.woff2',
  'public/fonts/SF-Pro-Rounded-Semibold.woff2',
  'public/fonts/SF-Pro.woff2',
  'public/fonts/SF-Pro-Display-Medium.woff2',
  'public/fonts/SF-Pro-Display-Bold.woff2',
  'public/fonts/HelveticaNowVar.woff2',
  'public/fonts/tbj-neuetra-vf.woff2',
  'public/assets/brand/favicon.ico',
  'public/assets/brand/favicon-16x16.png',
  'public/assets/brand/favicon-32x32.png',
  'public/assets/brand/apple-touch-icon.png',
  'public/assets/brand/site.webmanifest',
];

describe('homepage presentation assets', () => {
  it('selects exactly one supported hero word from the initial random sample', () => {
    expect(HERO_WORDS).toEqual(['Banners', 'Icons']);
    expect(selectHeroWord(() => 0)).toBe('Banners');
    expect(selectHeroWord(() => 0.99)).toBe('Icons');
  });

  it('keeps every migrated asset at its permanent public path', async () => {
    await Promise.all(permanentAssets.map(file => expect(access(path.join(root, file))).resolves.toBeUndefined()));
    await expect(access(path.join(root, 'temp'))).rejects.toThrow();
  });

  it('uses a tight ProfileSeeker artwork viewBox without changing the paths', async () => {
    const svg = await readFile(path.join(root, 'public/assets/brand/profileseeker.svg'), 'utf8');
    expect(svg).toContain('viewBox="36.37 28.89 94.2 108.67"');
    expect(svg.match(/<path\b/g)).toHaveLength(5);
  });

  it('contains no production references to the temporary directory', async () => {
    const sources = await Promise.all(['index.html', 'app.js', 'styles.css', 'src/pages/pages.js'].map(file => readFile(path.join(root, file), 'utf8')));
    expect(sources.join('\n')).not.toContain('temp/');
    expect(sources.join('\n')).toContain('/fonts/tbj-neuetra-vf.woff2');
    expect(sources.join('\n')).toContain('/assets/brand/profileseeker.svg');
    expect(sources.join('\n')).not.toContain('/assets/video/heroimage.png');
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
    expect(html).not.toContain('href="#/');
    expect(html).toContain('<span class="profile-brand-strong">Profile</span><span class="profile-brand-medium">seeker.com</span>');
    expect(html).toContain('aria-label="Profileseeker.com home"');
    const primaryNav = html.match(/<nav class="main-nav"[\s\S]*?<div class="mobile-nav-actions">/)?.[0] || '';
    expect([...primaryNav.matchAll(/<a href="([^"]+)" data-nav="([^"]+)">([^<]+)<\/a>/g)].map(match => match.slice(1))).toEqual([
      ['/icons', 'icons', 'Icons'], ['/banners', 'banners', 'Banners'], ['/wallpapers', 'wallpapers', 'Wallpapers'], ['/collections', 'collections', 'Collections'],
    ]);
    expect(css).toContain('--color-acid: #FF1050'); expect(css).toContain('--color-discord: #5865F2'); expect(css).toContain('--nav-item-gap: 2px'); expect(css).toContain('--tracking-nav: 0');
    expect(css).toMatch(/\.site-header\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?background:\s*var\(--color-black\)/);
    const manifest = JSON.parse(await readFile(path.join(root, 'public/assets/brand/site.webmanifest'), 'utf8'));
    expect(manifest.icons.every(icon => icon.src.startsWith('/assets/brand/'))).toBe(true);
  });

  it('defines the requested split hero and preserves its deliberate desktop line structure', async () => {
    const pages = await readFile(path.join(root, 'src/pages/pages.js'), 'utf8');
    const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(pages).toContain('<p class="hero-eyebrow"><span class="hero-eyebrow-logo" aria-hidden="true"></span><span>pfseeker &copy;</span></p>');
    expect(pages).toContain("export const HERO_WORDS = Object.freeze(['Banners', 'Icons'])");
    expect(pages).toContain('<h1><span>Probably the Best</span><span>${escapeHtml(heroWord)} on the Internet.</span></h1>');
    expect(pages).toContain('<span>Start digging through alt, emo, dark, soft, strange, cute, messy, and more</span> <span>in the spaces where they all cross. Your identity forms in this</span> <span>borderland.</span>');
    expect(css).toMatch(/\.hero-description > span\s*\{[\s\S]*?display:\s*block/);
    expect(css).not.toMatch(/\.hero h1\s*\{[^}]*text-wrap:\s*balance/);
    expect(css).toMatch(/\.hero-layout\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5,[\s\S]*?gap:\s*80px/);
    expect(css).toMatch(/\.hero-layout\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(var\(--nav-shell-gutter\) \* 2\)\),\s*var\(--container-wide\)\)/);
    expect(css).toMatch(/\.hero-heading\s*\{\s*grid-column:\s*span 3/);
    expect(css).toMatch(/\.hero-details\s*\{[\s\S]*?grid-column:\s*span 2/);
    expect(css).toMatch(/\.hero\s*\{[\s\S]*?padding-block:\s*128px/);
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*?gap:\s*32px/);
    expect(pages).not.toContain("className: 'hero-sign-in");
    expect(pages).not.toContain("label: 'Sign in'");
    expect(pages).toContain('const heroRoute = `/${heroWord.toLowerCase()}`');
    expect(pages).toContain("label: heroWord, icon: 'cta-category'");
    expect(pages).toContain('href: heroRoute');
    expect(pages).toContain("label: 'Collections', icon: 'bolt', href: '/collections'");
    expect(css).toContain('--collection-section-space-before: 0px');
    expect(css).toMatch(/\.category-grid\s*\{[\s\S]*?margin-top:\s*200px/);
  });

  it('reserves six homepage collection slots without creating fake collection data', async () => {
    const pages = await readFile(path.join(root, 'src/pages/pages.js'), 'utf8');
    expect(pages).toContain('collections.filter(collection => collection.featured).slice(0, 6)');
    expect(pages).toContain('Math.max(0, 6 - featured.length)');
    expect(pages).toContain('class="collection-card collection-card-empty" aria-hidden="true"');
    expect(pages).not.toMatch(/collection-card-empty[^\n]*href=/);
  });

  it('renders collections before categories on the homepage', async () => {
    const pages = await readFile(path.join(root, 'src/pages/pages.js'), 'utf8');
    const homeMarkup = pages.match(/app\.innerHTML = `([\s\S]*?)`;\s*mount\(\);/)?.[1] || '';
    expect(homeMarkup.indexOf('${collectionSection}')).toBeGreaterThan(-1);
    expect(homeMarkup.indexOf('${categorySection')).toBeGreaterThan(homeMarkup.indexOf('${collectionSection}'));
    expect(homeMarkup.indexOf('Recently Added')).toBeGreaterThan(homeMarkup.indexOf('${categorySection'));
  });

  it('places the Featured Collections action below its grid', async () => {
    const pages = await readFile(path.join(root, 'src/pages/pages.js'), 'utf8');
    expect(pages).toContain('<h2>Featured Collections</h2>');
    expect(pages).toContain('<div class="collection-section-action"><a class="text-link section-head-action" href="/collections">Browse more</a></div>');
    const section = pages.match(/const collectionSection = `([\s\S]*?)`;/)?.[1] || '';
    expect(section.indexOf('collection-section-action')).toBeGreaterThan(section.indexOf('collection-grid'));
  });

  it('uses the requested local hero and brand faces without italic production references', async () => {
    const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(css).toMatch(/SF-Pro-Rounded-Regular\.woff2[\s\S]*?font-weight:\s*400/);
    expect(css).toMatch(/SF-Pro-Rounded-Medium\.woff2[\s\S]*?font-weight:\s*500/);
    expect(css).toMatch(/SF-Pro-Rounded-Semibold\.woff2[\s\S]*?font-weight:\s*600/);
    expect(css).toMatch(/tbj-neuetra-vf\.woff2[\s\S]*?font-weight:\s*100 900/);
    expect(css).toMatch(/SF-Pro\.woff2[\s\S]*?font-weight:\s*100 900/);
    expect(css).toMatch(/SF-Pro-Display-Medium\.woff2[\s\S]*?font-weight:\s*500/);
    expect(css).toMatch(/SF-Pro-Display-Bold\.woff2[\s\S]*?font-weight:\s*700/);
    expect(css).toMatch(/HelveticaNowVar\.woff2[\s\S]*?font-weight:\s*100 900/);
    expect(css).not.toMatch(/Arimo|Archivo|Inter/);
    expect(css).not.toContain('Italic-VariableFont');
    expect(css).toContain('font-synthesis: none');
    expect(css).toContain('text-rendering: optimizeLegibility');
  });
});
