import { getCookie } from './cookies.js';
import { verifyPayload } from './crypto.js';

export const SESSION_COOKIE = 'neuevault_session';
export const STATE_COOKIE = 'neuevault_oauth_state';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export const STATE_SECONDS = 10 * 60;

export function authConfigured(env) {
  const valuesPresent = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI', 'SESSION_SECRET'].every(name => typeof env[name] === 'string' && env[name].length > 0);
  if (!valuesPresent || env.SESSION_SECRET.length < 32) return false;
  try {
    const redirect = new URL(env.DISCORD_REDIRECT_URI);
    return redirect.href === 'https://www.pfseeker.com/api/auth/discord/callback' || (['localhost', '127.0.0.1'].includes(redirect.hostname) && redirect.protocol === 'http:' && redirect.pathname === '/api/auth/discord/callback');
  } catch { return false; }
}

export async function currentSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const session = await verifyPayload(getCookie(request, SESSION_COOKIE), env.SESSION_SECRET);
  if (!session || session.exp <= Math.floor(Date.now() / 1000) || !session.user?.id) return null;
  return session;
}

export function canAccessRestricted(session) {
  return Boolean(session?.user?.id);
}
