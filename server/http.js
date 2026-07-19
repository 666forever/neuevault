export const noStoreHeaders = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' };

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...noStoreHeaders, ...headers } });
}

export const errorResponse = (status, message, headers = {}) => json({ error: message }, status, headers);

export function safeReturnPath(value) {
  const path = String(value || '/');
  return /^\/(?!\/)[^\\\u0000-\u001f\u007f]*$/.test(path) ? path : '/';
}

export function allowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  const url = new URL(request.url);
  const allowed = new Set(['https://www.pfseeker.com', 'https://pfseeker.com', 'https://neuevault.pages.dev']);
  if (url.protocol === 'https:' && url.hostname.endsWith('.neuevault.pages.dev')) allowed.add(url.origin);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') allowed.add(url.origin);
  return allowed.has(origin);
}
