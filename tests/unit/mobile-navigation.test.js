import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMobileNavigation } from '../../src/components/mobileNavigation.js';

class FakeTarget {
  constructor() {
    this.listeners = new Map();
    this.attributes = new Map();
    this.classList = {
      values: new Set(),
      toggle: (name, force) => force ? this.classList.values.add(name) : this.classList.values.delete(name),
      contains: name => this.classList.values.has(name),
    };
    this.innerHTML = '';
    this.focused = false;
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener); this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  emit(type, event = {}) { for (const listener of this.listeners.get(type) || []) listener(event); }
  listenerCount(type) { return this.listeners.get(type)?.size || 0; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  contains(target) { return target === this; }
  focus() { this.focused = true; }
}

class FakeMedia extends FakeTarget {
  constructor(matches = false) { super(); this.matches = matches; }
  setMatches(matches) { this.matches = matches; this.emit('change', { matches }); }
}

const setup = ({ canHandleEscape = () => true } = {}) => {
  const document = new FakeTarget();
  const toggle = new FakeTarget();
  const panel = new FakeTarget();
  const media = new FakeMedia(false);
  vi.stubGlobal('document', document);
  const navigation = createMobileNavigation({
    toggle,
    panel,
    desktopMedia: media,
    canHandleEscape,
    renderIcon: icon => `<svg data-name="${icon}"></svg>`,
  });
  return { document, toggle, panel, media, navigation };
};

afterEach(() => vi.unstubAllGlobals());

describe('mobile navigation lifecycle', () => {
  it('starts closed and toggles its label, icon, expanded state, and dismiss listeners', () => {
    const fixture = setup();
    expect(fixture.toggle.getAttribute('aria-label')).toBe('Open menu');
    expect(fixture.toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.toggle.innerHTML).toContain('menu');
    fixture.toggle.emit('click');
    expect(fixture.navigation.isOpen()).toBe(true);
    expect(fixture.panel.classList.contains('open')).toBe(true);
    expect(fixture.toggle.getAttribute('aria-label')).toBe('Close menu');
    expect(fixture.toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.toggle.innerHTML).toContain('close-menu');
    expect(fixture.document.listenerCount('keydown')).toBe(1);
    expect(fixture.document.listenerCount('pointerdown')).toBe(1);
    fixture.toggle.emit('click');
    expect(fixture.navigation.isOpen()).toBe(false);
    expect(fixture.document.listenerCount('keydown')).toBe(0);
    expect(fixture.document.listenerCount('pointerdown')).toBe(0);
  });

  it('handles Escape only while open and returns focus to the toggle', () => {
    const fixture = setup();
    const closedEvent = { key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() };
    fixture.document.emit('keydown', closedEvent);
    expect(closedEvent.preventDefault).not.toHaveBeenCalled();
    fixture.toggle.emit('click');
    const event = { key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() };
    fixture.document.emit('keydown', event);
    expect(fixture.navigation.isOpen()).toBe(false);
    expect(fixture.toggle.focused).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
  });

  it('keeps inside and toggle pointer events open while an outside pointer closes without focus', () => {
    const fixture = setup(); fixture.toggle.emit('click');
    fixture.document.emit('pointerdown', { target: fixture.panel, composedPath: () => [fixture.panel] });
    expect(fixture.navigation.isOpen()).toBe(true);
    fixture.document.emit('pointerdown', { target: fixture.toggle, composedPath: () => [fixture.toggle] });
    expect(fixture.navigation.isOpen()).toBe(true);
    const outside = {};
    fixture.document.emit('pointerdown', { target: outside, composedPath: () => [outside] });
    expect(fixture.navigation.isOpen()).toBe(false);
    expect(fixture.toggle.focused).toBe(false);
  });

  it('closes for navigation without focus restoration and clears state at the desktop breakpoint', () => {
    const fixture = setup(); fixture.toggle.emit('click');
    expect(fixture.navigation.closeForNavigation()).toBe(true);
    expect(fixture.toggle.focused).toBe(false);
    fixture.toggle.emit('click'); fixture.media.setMatches(true);
    expect(fixture.navigation.isOpen()).toBe(false);
    expect(fixture.toggle.getAttribute('aria-expanded')).toBe('false');
    fixture.media.setMatches(false);
    expect(fixture.navigation.isOpen()).toBe(false);
  });

  it('does not duplicate listeners and removes all owned listeners on cleanup', () => {
    const fixture = setup();
    fixture.toggle.emit('click');
    expect(fixture.document.listenerCount('keydown')).toBe(1);
    fixture.navigation.closeForNavigation(); fixture.toggle.emit('click');
    expect(fixture.document.listenerCount('keydown')).toBe(1);
    fixture.navigation.destroy();
    expect(fixture.document.listenerCount('keydown')).toBe(0);
    expect(fixture.document.listenerCount('pointerdown')).toBe(0);
    expect(fixture.toggle.listenerCount('click')).toBe(0);
    expect(fixture.media.listenerCount('change')).toBe(0);
  });

  it('leaves Escape to an active dialog owner', () => {
    const fixture = setup({ canHandleEscape: () => false }); fixture.toggle.emit('click');
    const event = { key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() };
    fixture.document.emit('keydown', event);
    expect(fixture.navigation.isOpen()).toBe(true);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
