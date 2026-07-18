export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function safeUrl(value, { allowRelative = true } = {}) {
  if (allowRelative && /^\/(?!\/)/.test(String(value))) return String(value);
  try {
    const url = new URL(String(value));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export const slugify = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const debounce = (callback, delay = 180) => {
  let timer;
  const debounced = (...args) => { clearTimeout(timer); timer = setTimeout(() => callback(...args), delay); };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};
