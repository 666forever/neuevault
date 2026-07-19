const encoder = new TextEncoder();

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes); crypto.getRandomValues(value);
  return toBase64Url(value);
}

export function toBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function equalBytes(left, right) {
  if (typeof crypto.subtle.timingSafeEqual === 'function') return crypto.subtle.timingSafeEqual(left, right);
  const a = new Uint8Array(left); const b = new Uint8Array(right); let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a[index % a.length] || 0) ^ (b[index % b.length] || 0);
  return difference === 0;
}

export async function signPayload(payload, secret) {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${toBase64Url(await hmac(secret, body))}`;
}

export async function verifyPayload(token, secret) {
  try {
    const [body, signature, extra] = String(token || '').split('.');
    if (!body || !signature || extra) return null;
    const [actual, expected] = await Promise.all([crypto.subtle.digest('SHA-256', fromBase64Url(signature)), crypto.subtle.digest('SHA-256', await hmac(secret, body))]);
    if (!equalBytes(actual, expected)) return null;
    return JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
  } catch { return null; }
}

export async function timingSafeTextEqual(left, right) {
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', encoder.encode(String(left))), crypto.subtle.digest('SHA-256', encoder.encode(String(right)))]);
  return equalBytes(a, b);
}
