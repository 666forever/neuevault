import { AdminError } from './errors.js';

const decoder = new TextDecoder();

export async function boundedProviderJson(url, options = {}, {
  timeoutMs = 8_000,
  maxBytes = 1_048_576,
  unavailableCode = 'provider_unavailable',
  invalidCode = 'provider_invalid_response',
  allowedRedirectOrigin = null,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('provider_timeout'), timeoutMs);
  let response;
  try {
    response = await fetch(url, { ...options, signal: controller.signal, redirect: 'manual' });
  } catch {
    clearTimeout(timer);
    throw new AdminError(503, unavailableCode, 'An external administration provider is unavailable.');
  }
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('Location');
    if (!allowedRedirectOrigin || !location || new URL(location, url).origin !== allowedRedirectOrigin) {
      throw new AdminError(503, invalidCode, 'An external administration provider returned an invalid response.');
    }
  }
  const declared = Number(response.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw new AdminError(503, invalidCode, 'An external administration provider returned an invalid response.');
  const reader = response.body?.getReader();
  let size = 0; let text = '';
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { await reader.cancel(); throw new AdminError(503, invalidCode, 'An external administration provider returned an invalid response.'); }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch(error) { if(error instanceof AdminError)throw error;throw new AdminError(503,unavailableCode,'An external administration provider is unavailable.'); }
    finally { reader.releaseLock();clearTimeout(timer); }
  }
  else clearTimeout(timer);
  let body = null;
  if (text) { try { body = JSON.parse(text); } catch { throw new AdminError(503, invalidCode, 'An external administration provider returned an invalid response.'); } }
  return { response, body };
}

export const transientStatus = status => status === 408 || status === 429 || status >= 500;
