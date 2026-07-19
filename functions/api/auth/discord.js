import { authConfigured, STATE_COOKIE, STATE_SECONDS } from '../../../server/auth.js';
import { cookie } from '../../../server/cookies.js';
import { randomToken, signPayload } from '../../../server/crypto.js';
import { DISCORD_AUTHORIZE_URL } from '../../../server/discord.js';
import { errorResponse, safeReturnPath } from '../../../server/http.js';

export async function onRequestGet({ request, env }) {
  if (!authConfigured(env)) return errorResponse(503, 'Authentication is not configured.');
  const nonce = randomToken(); const now = Math.floor(Date.now() / 1000);
  const state = await signPayload({ nonce, returnPath: safeReturnPath(new URL(request.url).searchParams.get('returnTo')), exp: now + STATE_SECONDS }, env.SESSION_SECRET);
  const target = new URL(DISCORD_AUTHORIZE_URL); target.search = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, redirect_uri: env.DISCORD_REDIRECT_URI, response_type: 'code', scope: 'identify', state: nonce });
  return new Response(null, { status: 302, headers: { Location: target.href, 'Set-Cookie': cookie(STATE_COOKIE, state, { maxAge: STATE_SECONDS, secure: new URL(request.url).protocol === 'https:' }), 'Cache-Control': 'no-store' } });
}
