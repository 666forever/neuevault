import { SESSION_COOKIE, currentSession } from '../../../server/auth.js';
import { clearCookie } from '../../../server/cookies.js';
import { allowedOrigin, errorResponse, json } from '../../../server/http.js';
import { timingSafeTextEqual } from '../../../server/crypto.js';

export async function onRequestPost({ request, env }) {
  if (!allowedOrigin(request)) return errorResponse(403, 'A same-origin request is required.');
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return errorResponse(415, 'A JSON request is required.');
  const session = await currentSession(request, env); const csrf = request.headers.get('X-CSRF-Token');
  if (!session || !csrf || !await timingSafeTextEqual(csrf, session.csrf)) return errorResponse(403, 'The logout request is not authorized.');
  return json({ authenticated: false }, 200, { 'Set-Cookie': clearCookie(SESSION_COOKIE, new URL(request.url).protocol === 'https:') });
}
