import { setSmoothScrollLocked } from '../scroll/lenis.js';

const selectors = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function syncScrollLock(...dialogs) {
  const locked = dialogs.some(dialog => !dialog.hidden);
  document.body.classList.toggle('modal-open', locked);
  setSmoothScrollLocked(locked);
}

export function trapDialogKey(event, dialog, onEscape) {
  if (event.key === 'Escape') { event.preventDefault(); onEscape(); return true; }
  if (event.key !== 'Tab') return false;
  const focusable = [...dialog.querySelectorAll(selectors)];
  if (!focusable.length) return false;
  const first = focusable[0]; const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  return true;
}
