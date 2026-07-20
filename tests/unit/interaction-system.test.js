import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

const read = file => readFile(file, 'utf8');

describe('shared interaction system', () => {
  it('defines one tokenized rolling-control primitive with accessible duplicate layers', async () => {
    const [css, source] = await Promise.all([read('styles.css'), read('src/components/rollingControls.js')]);
    for (const token of ['--duration-link-roll: 300ms', '--duration-nav-pill: 150ms', '--delay-hover-intent: 10ms', '--ease-link-roll: cubic-bezier(0.76, 0, 0.24, 1)', '--roll-travel: 40px', '--roll-axis: 49% 50%', '--nav-hover-pill-height: 40px', '--nav-hover-pill-bg: #151515', '--nav-hover-pill-radius: var(--radius-pill)']) expect(css).toContain(token);
    expect(css).not.toContain('--roll-distance');
    expect(css).not.toContain('--delay-hover-intent: 70ms');
    expect(css).toMatch(/\.roll-text-layer:last-child\s*\{\s*transform:\s*translateY\(calc\(var\(--roll-travel\) \* -1\)\)/);
    expect(css).toMatch(/\.roll-icon-layer:last-child\s*\{\s*transform:\s*translateY\(var\(--roll-travel\)\)/);
    expect(css).toMatch(/\.main-nav a::before\s*\{[\s\S]*?height:\s*var\(--nav-hover-pill-height\)[\s\S]*?background:\s*var\(--nav-hover-pill-bg\)[\s\S]*?transition:\s*opacity var\(--duration-nav-pill\) var\(--ease-link-roll\)/);
    expect(css).toMatch(/@keyframes roll-text-in-from-above[\s\S]*?82%\s*\{\s*transform:\s*translateY\(1\.5px\)[\s\S]*?92%\s*\{\s*transform:\s*translateY\(-0\.5px\)[\s\S]*?100%\s*\{\s*transform:\s*translateY\(0\) rotate\(0\)/);
    expect(css).toMatch(/@keyframes roll-icon-in-from-below[\s\S]*?translateY\(-1\.5px\)[\s\S]*?translateY\(0\.5px\)[\s\S]*?translateY\(0\)/);
    expect(css).not.toContain('--control-hover-lift');
    expect(css).not.toMatch(/\.button:hover\s*\{[^}]*transform/);
    expect(css).not.toMatch(/\.main-nav a:hover\s*,\s*\.main-nav a\.active/);
    expect(css).not.toMatch(/\.main-nav a:hover\s*\{\s*color:/);
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
