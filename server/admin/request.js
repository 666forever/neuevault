import { allowedOrigin } from '../http.js';
import { randomToken, timingSafeTextEqual } from '../crypto.js';
import { AdminError } from './errors.js';

export const createRequestId = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : randomToken(18);
export function requireMethod(request, methods) { if (!new Set(methods.map(value => value.toUpperCase())).has(request.method.toUpperCase())) throw new AdminError(405, 'admin_method_not_allowed', 'The request method is not allowed.'); }
export function requireSameOrigin(request) { if (!allowedOrigin(request)) throw new AdminError(403, 'admin_origin_required', 'A same-origin request is required.'); }
export function requireContentType(request, accepted = ['application/json']) {
  const value = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (!value || !accepted.includes(value)) throw new AdminError(415, 'admin_content_type_unsupported', 'The request content type is not supported.');
}
export async function requireCsrf(request, session) {
  const supplied = request.headers.get('X-CSRF-Token');
  if (!supplied || !session?.csrf || !await timingSafeTextEqual(supplied, session.csrf)) throw new AdminError(403, 'admin_csrf_invalid', 'The request is not authorized.');
}
export async function parseBoundedJson(request, { maxBytes = 1_048_576 } = {}) {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw new AdminError(413, 'admin_body_too_large', 'The request body is too large.');
  if (!request.body) throw new AdminError(400, 'admin_body_required', 'A request body is required.');
  const reader = request.body.getReader(); const decoder = new TextDecoder(); let bytes = 0; let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new AdminError(413, 'admin_body_too_large', 'The request body is too large.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(text); } catch { throw new AdminError(400, 'admin_json_invalid', 'The JSON request body is invalid.'); }
}
export async function validateMutationRequest(request, session, { methods = ['POST'], contentTypes = ['application/json'], maxBytes = 1_048_576 } = {}) {
  requireMethod(request, methods); requireSameOrigin(request); requireContentType(request, contentTypes); await requireCsrf(request, session); return parseBoundedJson(request, { maxBytes });
}
