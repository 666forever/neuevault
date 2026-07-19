import { SESSION_COOKIE, SESSION_SECONDS, STATE_COOKIE, authConfigured } from '../../../../server/auth.js';
import { clearCookie, cookie, getCookie } from '../../../../server/cookies.js';
import { randomToken, signPayload, timingSafeTextEqual, verifyPayload } from '../../../../server/crypto.js';
import { exchangeDiscordCode, fetchDiscordUser } from '../../../../server/discord.js';
import { errorResponse } from '../../../../server/http.js';

export async function onRequestGet({ request, env }) {
  const secure = new URL(request.url).protocol === 'https:'; const clearState = clearCookie(STATE_COOKIE, secure);
  if (!authConfigured(env)) return errorResponse(503, 'Authentication is not configured.');
  const url = new URL(request.url); const code = url.searchParams.get('code'); const supplied = url.searchParams.get('state');
  const state = await verifyPayload(getCookie(request, STATE_COOKIE), env.SESSION_SECRET);
  if (!code || !supplied || !state || state.exp <= Math.floor(Date.now() / 1000) || !await timingSafeTextEqual(supplied, state.nonce)) return errorResponse(400, 'The sign-in request is invalid or expired.', { 'Set-Cookie': clearState });
  try {
    const accessToken = await exchangeDiscordCode(code, env); const user = await fetchDiscordUser(accessToken); const now = Math.floor(Date.now() / 1000);
    const session = await signPayload({ user, csrf: randomToken(), iat: now, exp: now + SESSION_SECONDS }, env.SESSION_SECRET);
    const headers = new Headers({ Location: `/${state.returnPath.replace(/^\//, '')}`, 'Cache-Control': 'no-store' });
    headers.append('Set-Cookie', clearState); headers.append('Set-Cookie', cookie(SESSION_COOKIE, session, { maxAge: SESSION_SECONDS, secure }));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error(JSON.stringify({ message: 'Discord OAuth callback failed', error: error instanceof Error ? error.message : 'Unknown error' }));
    return errorResponse(502, 'Discord sign-in could not be completed.', { 'Set-Cookie': clearState });
  }
}
