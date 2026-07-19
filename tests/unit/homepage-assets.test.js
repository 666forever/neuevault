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
  'public/assets/textures/hero-grain-1000px.png',
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
  });

  it('uses clean navigation, real shared branding, favicons, and requested UI values', async () => {
    const html = await readFile(path.join(root, 'index.html'), 'utf8'); const css = await readFile(path.join(root, 'styles.css'), 'utf8');
    expect(html).toContain('<title>Banners &amp; Icons with intent</title>');
    expect(html).not.toContain('href="#/'); expect(html.match(/brand-logo-shell/g)?.length).toBeGreaterThanOrEqual(2);
    expect(css).toContain('--color-acid: #c2f13c'); expect(css).toContain('--nav-gap: 38px'); expect(css).toContain('--tracking-nav: -0.05px');
    const manifest = JSON.parse(await readFile(path.join(root, 'public/assets/brand/site.webmanifest'), 'utf8'));
    expect(manifest.icons.every(icon => icon.src.startsWith('/assets/brand/'))).toBe(true);
  });
});
