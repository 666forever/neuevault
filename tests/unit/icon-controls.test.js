import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconNames, iconRegistry } from '../../src/icons/registry.js';
import { Icon, iconSizes } from '../../src/ui/Icon.js';
import { IconButton } from '../../src/ui/IconButton.js';
import { Button } from '../../src/ui/Button.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('shared icon and control primitives', () => {
  it('provides the complete local semantic icon registry', () => {
    expect(iconNames).toEqual(expect.arrayContaining([
      'download', 'share', 'close', 'previous', 'next', 'back',
      'restricted', 'menu', 'close-menu', 'discord', 'bookmark', 'bolt',
    ]));
    expect(iconSizes).toEqual({ compact: 12, standard: 16, medium: 20, large: 24 });
    for (const icon of Object.values(iconRegistry)) {
      expect(icon.viewBox).toMatch(/^-?\d+(?:\.\d+)? -?\d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)?$/);
      expect(icon.body).toContain('currentColor');
      expect(icon.body).not.toMatch(/<script|https?:|data:image|<image/i);
    }
    expect(iconRegistry.bolt.viewBox).toBe('3 1 18 22');
    expect(iconRegistry.bookmark.viewBox).toBe('0 0 24 24');
  });

  it('renders decorative SVG once without an accessible duplicate', () => {
    const icon = Icon('download', { size: 'medium', className: 'button-icon' });
    expect(icon).toContain('<svg');
    expect(icon).toContain('aria-hidden="true"');
    expect(icon).toContain('focusable="false"');
    expect(icon).not.toContain('<title>');
  });

  it('enforces IconButton names and stable semantic button markup', () => {
    expect(() => IconButton({ icon: 'close', label: '' })).toThrow(/accessible label/);
    const control = IconButton({ icon: 'close', label: 'Close viewer', size: 'standard', disabled: true });
    expect(control).toContain('<button');
    expect(control).toContain('aria-label="Close viewer"');
    expect(control).toContain('icon-button-standard');
    expect(control).toContain(' disabled');
    expect((control.match(/Close viewer/g) || [])).toHaveLength(1);
  });

  it('keeps links and actions semantically distinct in Button', () => {
    const link = Button({ label: 'Home', icon: 'back', href: '/', variant: 'text' });
    const action = Button({ label: 'Copy link', icon: 'share', variant: 'dark' });
    expect(link).toMatch(/^<a /);
    expect(link).toContain('href="/"');
    expect(action).toMatch(/^<button /);
    expect(action).toContain('type="button"');
    expect(action).not.toContain('href=');
  });

  it('removes migrated Unicode, CSS bars, and utility masks from consumers', async () => {
    const files = await Promise.all([
      'app.js', 'index.html', 'src/components/AssetGrid.js', 'src/overlays/AssetModal.js',
      'src/overlays/AuthDialog.js', 'src/pages/pages.js', 'styles.css',
    ].map(file => readFile(path.join(root, file), 'utf8')));
    const source = files.join('\n');
    expect(source).not.toMatch(/[←→↗↓●]/);
    expect(source).not.toContain('>×<');
    expect(source).not.toMatch(/\.menu-toggle span\s*\{/);
    expect(source).not.toMatch(/assets\/icons\/(?:signin-discord|collections-bookmark|bolt)\.svg/);
    expect(source).toContain('assets/brand/logo28x28.svg');
  });
});
