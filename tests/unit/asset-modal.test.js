import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trapDialogKey } from '../../src/overlays/dialog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const modal = read('src/overlays/AssetModal.js');
const css = read('styles.css');
const html = read('index.html');

describe('asset modal surface contract', () => {
  it('keeps labelled modal semantics and native nested information scrolling', () => {
    expect(html).toContain('id="asset-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"');
    expect(modal).toContain('<aside class="modal-info" data-lenis-prevent>');
    expect(modal).toContain('<h2 id="modal-title">');
    expect(css).toMatch(/\.modal-info\s*\{[\s\S]*?overflow:\s*auto[\s\S]*?overscroll-behavior:\s*contain/);
  });

  it('uses the approved bounded shell, balanced columns, and semantic tokens', () => {
    expect(css).toContain('--asset-modal-max-width: 1180px');
    expect(css).toContain('--asset-modal-max-height: 820px');
    expect(css).toContain('--asset-modal-info-min: 300px');
    expect(css).toContain('--asset-modal-info-width: 380px');
    expect(css).toContain('--asset-modal-control-offset: 16px');
    expect(css).toMatch(/\.modal-shell\s*\{[\s\S]*?width:\s*min\(var\(--asset-modal-max-width\), 100%\)[\s\S]*?height:\s*min\(var\(--asset-modal-max-height\), 94vh\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) clamp\(var\(--asset-modal-info-min\), 32vw, var\(--asset-modal-info-width\)\)/);
  });

  it('preserves cyclic navigation, stable actions, and protected-source boundaries', () => {
    expect(modal).toContain('this.index = (this.index + delta + this.items.length) % this.items.length');
    expect(modal).toContain("label: 'Previous asset'");
    expect(modal).toContain("label: 'Next asset'");
    expect(modal).toContain("label: 'Copy link'");
    expect(modal).toContain("fetch(`/api/download/${encodeURIComponent(asset.id)}`");
    expect(modal).not.toMatch(/cloudinaryPublicId|authenticated\/|restricted\//);
  });

  it('keeps the public, signed-out, signed-in, and unavailable action labels singular', () => {
    for (const label of [
      'Download original',
      'Sign in to download',
      'Download restricted original',
      'Authentication unavailable',
    ]) {
      expect(modal).toContain(label);
    }
  });

  it('contains focus and gives Escape to the active dialog owner', () => {
    const first = { focus: vi.fn() };
    const last = { focus: vi.fn() };
    const dialog = { querySelectorAll: () => [first, last] };
    const escape = { key: 'Escape', preventDefault: vi.fn() };
    const close = vi.fn();
    expect(trapDialogKey(escape, dialog, close)).toBe(true);
    expect(escape.preventDefault).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it('preserves the full-screen mobile stack and bounded media region', () => {
    expect(css).toContain('--asset-modal-mobile-media-height: min(44vh, 420px)');
    expect(css).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.modal-shell\s*\{[\s\S]*?height:\s*100%[\s\S]*?grid-template-columns:\s*1fr[\s\S]*?grid-template-rows:\s*minmax\(220px, var\(--asset-modal-mobile-media-height\)\) minmax\(0, 1fr\)/);
  });
});
