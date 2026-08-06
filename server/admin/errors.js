import { noStoreHeaders } from '../http.js';

const DEFAULT_MESSAGE = 'The administration request could not be completed.';

export class AdminError extends Error {
  constructor(status, code, message = DEFAULT_MESSAGE) {
    super(message); this.name = 'AdminError'; this.status = status; this.code = code;
  }
}

export function adminJson(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...noStoreHeaders, ...headers } });
}

export function adminErrorResponse(error, requestId) {
  const known = error instanceof AdminError;
  return adminJson({ error: known ? error.message : DEFAULT_MESSAGE, code: known ? error.code : 'admin_internal_error', requestId }, known ? error.status : 500);
}
