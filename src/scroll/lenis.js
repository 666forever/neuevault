import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis = null;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initSmoothScroll() {
  if (lenis || reducedMotion()) return lenis;
  try {
    lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      stopInertiaOnNavigate: true,
      prevent: node => Boolean(node.closest?.('[data-lenis-prevent]')),
    });
  } catch {
    lenis = null;
  }
  return lenis;
}

export function scrollToPosition(value = 0) {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (lenis) { lenis.resize(); lenis.scrollTo(target, { immediate: true, force: true }); }
  else window.scrollTo(0, target);
}

export function scrollToTop() { scrollToPosition(0); }

export function setSmoothScrollLocked(locked) {
  if (!lenis) return;
  if (locked) lenis.stop(); else lenis.start();
}

export function getSmoothScroll() { return lenis; }
