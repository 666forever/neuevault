import { Icon } from './Icon.js';
import { escapeHtml } from '../utils/escape.js';

const sizes = new Set(['compact', 'standard', 'large']);
const shapes = new Set(['circle', 'rounded-square']);

export function IconButton({
  icon,
  label,
  size = 'standard',
  shape = 'circle',
  className = '',
  disabled = false,
  attributes = '',
} = {}) {
  const accessibleLabel = String(label || '').trim();
  if (!accessibleLabel) throw new Error('IconButton requires a nonempty accessible label.');
  if (!sizes.has(size)) throw new Error(`Unsupported IconButton size: ${size}`);
  if (!shapes.has(shape)) throw new Error(`Unsupported IconButton shape: ${shape}`);
  const classes = ['icon-button', `icon-button-${size}`, `icon-button-${shape}`, className].filter(Boolean).map(escapeHtml).join(' ');
  return `<button class="${classes}" type="button" aria-label="${escapeHtml(accessibleLabel)}"${disabled ? ' disabled' : ''}${attributes ? ` ${attributes}` : ''}>${Icon(icon, { size: size === 'large' ? 'large' : 'medium' })}</button>`;
}
