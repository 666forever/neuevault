export const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
export const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
export const DISCORD_USER_URL = 'https://discord.com/api/users/@me';

export async function exchangeDiscordCode(code, env, fetcher = fetch) {
  const body = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: env.DISCORD_REDIRECT_URI });
  const response = await fetcher(DISCORD_TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new Error('Discord token exchange failed');
  const token = await response.json();
  if (!token.access_token) throw new Error('Discord token response was invalid');
  return token.access_token;
}

export async function fetchDiscordUser(accessToken, fetcher = fetch) {
  const response = await fetcher(DISCORD_USER_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error('Discord user request failed');
  const user = await response.json();
  if (!user.id || !user.username) throw new Error('Discord user response was invalid');
  return { id: String(user.id), displayName: user.global_name || user.username, avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(user.id)}/${encodeURIComponent(user.avatar)}.png?size=128` : null };
}
