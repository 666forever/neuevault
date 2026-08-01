import { describe, expect, it } from 'vitest';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const permanentAssets = [
  'public/assets/brand/logo28x28.svg',
  'public/assets/icons/signin-discord.svg',
  'public/assets/icons/collections-bookmark.svg',
  'public/assets/icons/bolt.svg',
  'public/assets/video/furina-hero-1080p.mp4',
  'public/assets/video/furina-hero-1440p.mp4',
  'public/assets/video/heronew.gif',
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
  it('keeps every migrated asset at its permanent public path', async () => {
    await Promise.all(permanentAssets.map(file => expect(access(path.join(root, file))).resolves.toBeUndefined()));
    await expect(access(path.join(root, 'temp'))).rejects.toThrow();
  });

  it('contains no production references to the temporary directory', async () => {
    const sources = await Promise.all(['index.html', 'app.js', 'styles.css', 'src/pages/pages.js'].map(file => readFile(path.join(root, file), 'utf8')));
    expect(sources.join('\n')).not.toContain('temp/');
    expect(sources.join('\n')).toContain('/fonts/tbj-neuetra-vf.woff2');
    expect(sources.join('\n')).toContain('/assets/brand/logo28x28.svg');
    expect(sources.join('\n')).toContain('/assets/video/heronew.gif');
    expect(sources.join('\n')).not.toContain('/assets/video/hero.gif');
    expect(await readFile(path.join(root, 'src/pages/pages.js'), 'utf8')).not.toContain('furina-hero-');
    expect(sources.join('\n')).not.toContain('/assets/textures/hero-grain-1000px.png');
  });

  it('uses clean navigation, real shared branding, favicons, and requested UI values', async () => {
    const html = await readFile(path.join(root, 'index.html'), 'utf8'); const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(html).toContain('<title>Banners &amp; Icons with intent</title>');
    expect(html).not.toContain('href="#/'); expect(html.match(/brand-logo-shell/g)?.length).toBeGreaterThanOrEqual(2);
    expect(css).toContain('--color-acid: #5865F2'); expect(css).toContain('--nav-item-gap: 2px'); expect(css).toContain('--tracking-nav: 0');
    const manifest = JSON.parse(await readFile(path.join(root, 'public/assets/brand/site.webmanifest'), 'utf8'));
    expect(manifest.icons.every(icon => icon.src.startsWith('/assets/brand/'))).toBe(true);
  });

  it('defines the revised hero copy and preserves its deliberate paragraph break', async () => {
    const pages = await readFile(path.join(root, 'src/pages/pages.js'), 'utf8');
    const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(pages).toContain('<h1>Timeless. Bold. Forever.</h1>');
    expect(pages).toContain('<span>Start digging through alt, emo, dark, soft, strange, cute, messy, and more in the spaces where they all cross.</span> <span>Your identity forms in this borderland.</span>');
    expect(pages).not.toContain('hero-eyebrow');
    expect(css).toMatch(/\.hero-description span\s*\{\s*display:\s*block/);
    expect(css).not.toMatch(/\.hero h1\s*\{[^}]*text-wrap:\s*balance/);
    for (const token of ['--text-hero: 60px', '--hero-content-max: auto', '--hero-title-copy-gap: 24px', '--hero-copy-size: 15px', '--radius-discord-auth: 12px']) expect(css).toContain(token);
    expect(css).toMatch(/\.button\s*\{[\s\S]*?border-radius:\s*var\(--radius-discord-auth\)/);
    expect(css).toMatch(/\.button-light\s*\{\s*background:\s*var\(--color-acid\)/);
    expect(css).toMatch(/\.hero-media\s*\{[\s\S]*?object-fit:\s*fill;[\s\S]*?object-position:\s*center;[\s\S]*?opacity:\s*0\.15/);
    expect(css).toContain('linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%)');
    expect(pages).not.toContain('hero-grain');
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
