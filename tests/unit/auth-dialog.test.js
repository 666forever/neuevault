import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const auth = read('src/overlays/AuthDialog.js');
const css = read('styles.css');
const html = read('index.html');

describe('authentication dialog surface contract', () => {
  it('keeps distinct labelled dialog semantics and native nested scrolling', () => {
    expect(html).toContain('id="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"');
    expect(auth).toContain('<div class="auth-dialog-card" data-lenis-prevent>');
    expect(auth).toContain('<h2 id="auth-title">');
    expect(css).toMatch(/\.auth-dialog-card\s*\{[\s\S]*?overflow:\s*auto[\s\S]*?overscroll-behavior:\s*contain/);
  });

  it('uses the approved compact geometry without merging modal domains', () => {
    expect(css).toContain('--auth-dialog-max-width: 440px');
    expect(css).toContain('--auth-dialog-padding: 32px');
    expect(css).toContain('--auth-dialog-radius: var(--radius-modal)');
    expect(css).toMatch(/\.auth-dialog-card\s*\{[\s\S]*?width:\s*min\(var\(--auth-dialog-max-width\), 100%\)/);
    expect(auth).not.toContain('modal-shell');
  });

  it('preserves configured, loading, authenticated, unavailable, and error-safe actions', () => {
    for (const label of [
      'Checking authentication',
      'Signed in',
      'Sign in with Discord',
      'Authentication unavailable',
      'Connect with Discord',
      'Discord sign-in unavailable',
      'Sign out',
    ]) {
      expect(auth).toContain(label);
    }
    expect(auth).toContain('disabled: !configured || loading');
    expect(auth).not.toMatch(/DISCORD_CLIENT_SECRET|SESSION_SECRET|access_token|refresh_token/);
  });

  it('keeps focus ownership and restoration on the originating restricted action', () => {
    expect(auth).toContain("this.element.querySelector('.auth-close').focus()");
    expect(auth).toContain("this.assetModal.element.querySelector('.download-action')?.focus()");
    expect(auth).toContain("label: 'Close sign-in dialog'");
  });

  it('keeps the auth action width stable through shared control contracts', () => {
    expect(css).toMatch(/\.auth-dialog-card \.button\s*\{[\s\S]*?width:\s*100%[\s\S]*?min-height:\s*var\(--control-height-auth\)/);
    expect(css).toMatch(/\.auth-close\s*\{[\s\S]*?width:\s*var\(--control-height-md\)[\s\S]*?height:\s*var\(--control-height-md\)/);
  });
});
