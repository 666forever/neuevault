import { iconRegistry } from '../icons/registry.js';
import { escapeHtml } from '../utils/escape.js';

export const iconSizes = Object.freeze({ compact: 12, standard: 16, medium: 20, large: 24 });

function resolveIcon(name) {
  const icon = iconRegistry[name];
  if (icon) return icon;
  if (import.meta.env.DEV) throw new Error(`Unknown icon registry name: ${name}`);
  return null;
}

export function Icon(name, { size = 'standard', className = '', decorative = true, title = '' } = {}) {
  const icon = resolveIcon(name);
  if (!icon) return '<span class="icon icon-missing" aria-hidden="true"></span>';
  if (!(size in iconSizes)) {
    if (import.meta.env.DEV) throw new Error(`Unsupported icon size: ${size}`);
    size = 'standard';
  }
  const classes = ['icon', `icon-${size}`, className].filter(Boolean).map(escapeHtml).join(' ');
  const accessibleTitle = decorative ? '' : String(title || '').trim();
  if (!decorative && !accessibleTitle && import.meta.env.DEV) throw new Error(`Standalone icon "${name}" requires a title.`);
  const accessibility = decorative
    ? 'aria-hidden="true" focusable="false"'
    : `role="img" aria-label="${escapeHtml(accessibleTitle)}" focusable="false"`;
  return `<svg class="${classes}" viewBox="${icon.viewBox}" ${accessibility} xmlns="http://www.w3.org/2000/svg">${accessibleTitle ? `<title>${escapeHtml(accessibleTitle)}</title>` : ''}${icon.body}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(placeholder => {
    const template = document.createElement('template');
    template.innerHTML = Icon(placeholder.dataset.icon, {
      size: placeholder.dataset.iconSize || 'standard',
      className: placeholder.className,
    });
    placeholder.replaceWith(template.content.firstElementChild);
  });
}
