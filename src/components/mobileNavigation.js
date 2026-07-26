export function createMobileNavigation({
  toggle,
  panel,
  renderIcon,
  desktopMedia = matchMedia('(min-width: 1200px)'),
  canHandleEscape = () => true,
  onModeChange = () => {},
} = {}) {
  if (!toggle || !panel || typeof renderIcon !== 'function') throw new Error('Mobile navigation requires a toggle, panel, and icon renderer.');

  let open = false;
  let disposed = false;

  const render = () => {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.innerHTML = renderIcon(open ? 'close-menu' : 'menu');
  };

  const removeDismissListeners = () => {
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onPointerDown);
  };

  const close = ({ restoreFocus = false, clearPanelFocus = false } = {}) => {
    if (!open) return false;
    open = false;
    removeDismissListeners();
    render();
    if (clearPanelFocus && panel.contains(document.activeElement)) document.activeElement?.blur();
    if (restoreFocus) toggle.focus();
    return true;
  };

  const onKeydown = event => {
    if (!open || event.key !== 'Escape' || !canHandleEscape()) return;
    event.preventDefault();
    event.stopPropagation();
    close({ restoreFocus: true });
  };

  const onPointerDown = event => {
    if (!open) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.includes(toggle) || path.includes(panel) || toggle.contains(event.target) || panel.contains(event.target)) return;
    close();
  };

  const addDismissListeners = () => {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onPointerDown);
  };

  const setOpen = value => {
    if (disposed || desktopMedia.matches) value = false;
    const next = Boolean(value);
    if (next === open) return open;
    open = next;
    if (open) addDismissListeners(); else removeDismissListeners();
    render();
    return open;
  };

  const onToggle = () => setOpen(!open);
  const onDesktopChange = () => {
    if (desktopMedia.matches) close({ clearPanelFocus: true });
    onModeChange(desktopMedia.matches);
  };

  toggle.addEventListener('click', onToggle);
  desktopMedia.addEventListener('change', onDesktopChange);
  render();

  return {
    closeForNavigation: () => close({ clearPanelFocus: true }),
    isOpen: () => open,
    destroy() {
      if (disposed) return;
      disposed = true;
      removeDismissListeners();
      toggle.removeEventListener('click', onToggle);
      desktopMedia.removeEventListener('change', onDesktopChange);
      open = false;
      render();
    },
  };
}
