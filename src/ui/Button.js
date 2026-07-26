import { Icon } from './Icon.js';
import { escapeHtml } from '../utils/escape.js';

const variants = new Set(['accent', 'light', 'dark', 'neutral', 'text']);
const sizes = new Set(['compact', 'standard', 'large']);

export function Button({
  label,
  icon = '',
  iconClassName = '',
  iconSize = 'medium',
  href = '',
  variant = 'neutral',
  size = 'compact',
  className = '',
  accessibleLabel = '',
  disabled = false,
  attributes = '',
} = {}) {
  const text = String(label || '').trim();
  if (!text) throw new Error('Button requires visible text.');
  if (!variants.has(variant)) throw new Error(`Unsupported Button variant: ${variant}`);
  if (!sizes.has(size)) throw new Error(`Unsupported Button size: ${size}`);
  const tag = href ? 'a' : 'button';
  const classes = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    className,
  ].filter(Boolean).map(escapeHtml).join(' ');
  const semantics = href
    ? ` href="${escapeHtml(href)}"`
    : ` type="button"${disabled ? ' disabled' : ''}`;
  const name = accessibleLabel ? ` aria-label="${escapeHtml(accessibleLabel)}"` : '';
  const iconMarkup = icon ? Icon(icon, { size: iconSize, className: ['button-icon', iconClassName].filter(Boolean).join(' ') }) : '';
  return `<${tag} class="${classes}"${semantics}${name}${attributes ? ` ${attributes}` : ''}>${iconMarkup}<span>${escapeHtml(text)}</span></${tag}>`;
}
