import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

const read = file => readFile(file, 'utf8');

describe('shared interaction system', () => {
  it('defines one tokenized rolling-control primitive with accessible duplicate layers', async () => {
    const [css, source] = await Promise.all([read('styles.css'), read('src/components/rollingControls.js')]);
    for (const token of ['--duration-link-roll: 300ms', '--delay-hover-intent: 70ms', '--ease-link-roll: cubic-bezier(0.76, 0, 0.24, 1)', '--roll-distance: 100%']) expect(css).toContain(token);
    expect(source).toContain("duplicate.setAttribute('aria-hidden', 'true')");
    expect(source).toContain("'.main-nav > a'");
    expect(source).not.toContain('.category-card');
    expect(source).not.toContain('.modal-close');
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*?roll-text-layer:last-child[\s\S]*?visibility: hidden/);
    expect(css).toMatch(/@media \(hover: none\)[\s\S]*?roll-text-layer:last-child[\s\S]*?visibility: hidden/);
  });

  it('initializes one enhancement-only Lenis instance with modal exclusions', async () => {
    const [pkg, app, scroll, dialog, modal] = await Promise.all([
      read('package.json'), read('app.js'), read('src/scroll/lenis.js'), read('src/overlays/dialog.js'), read('src/overlays/AssetModal.js'),
    ]);
    expect(JSON.parse(pkg).dependencies.lenis).toBeTruthy();
    expect(scroll).toContain("import 'lenis/dist/lenis.css'");
    expect(scroll.match(/new Lenis\(/g)).toHaveLength(1);
    expect(scroll).toContain('autoRaf: true');
    expect(scroll).toContain('anchors: true');
    expect(scroll).toContain('stopInertiaOnNavigate: true');
    expect(scroll).toContain("closest?.('[data-lenis-prevent]')");
    expect(scroll).toMatch(/if \(lenis \|\| reducedMotion\(\)\) return lenis/);
    expect(scroll).toMatch(/catch \{[\s\S]*?lenis = null/);
    expect(app.match(/initSmoothScroll\(\)/g)).toHaveLength(1);
    expect(app).toContain('if (scroll) { scrollToTop(); requestAnimationFrame(scrollToTop); }');
    expect(app).toContain("history.replaceState({ ...history.state, scrollY: window.scrollY }, '')");
    expect(app).toContain('scrollToPosition(event.state?.scrollY || 0)');
    expect(dialog).toContain('setSmoothScrollLocked(locked)');
    expect(modal).toContain('data-lenis-prevent');
  });
});
