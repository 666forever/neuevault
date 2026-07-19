import { describe, expect, it, vi } from 'vitest';
import { signPayload, verifyPayload } from '../../server/crypto.js';
import { safeReturnPath } from '../../server/http.js';
import { protectedDownloadUrl } from '../../server/cloudinary.js';
import { onRequestGet as sessionHandler } from '../../functions/api/auth/session.js';
import { SESSION_COOKIE } from '../../server/auth.js';
import { getTrustedAsset } from '../../server/assets.js';
import { onRequest as downloadHandler } from '../../functions/api/download/[assetId].js';
import { onRequestGet as discordStartHandler } from '../../functions/api/auth/discord.js';
import { onRequestGet as discordCallbackHandler } from '../../functions/api/auth/discord/callback.js';
import { STATE_COOKIE } from '../../server/auth.js';

describe('production authentication boundary', () => {
  it('signs sessions and rejects tampering', async () => {
    const token = await signPayload({ user: { id: '1' }, exp: 9_999_999_999 }, 'a sufficiently long test secret');
    expect((await verifyPayload(token, 'a sufficiently long test secret')).user.id).toBe('1');
    expect(await verifyPayload(`${token}x`, 'a sufficiently long test secret')).toBeNull();
  });
  it('accepts only local return paths', () => {
    expect(safeReturnPath('/asset/nv-1/readable')).toBe('/asset/nv-1/readable');
    expect(safeReturnPath('https://evil.example')).toBe('/'); expect(safeReturnPath('//evil.example')).toBe('/');
  });
  it('canonicalizes apex OAuth before creating a host-only state cookie', async () => {
    const response = await discordStartHandler({ request: new Request('https://pfseeker.com/api/auth/discord?returnTo=%2Fbanners'), env: {} });
    expect(response.status).toBe(302); expect(response.headers.get('Location')).toBe('https://www.pfseeker.com/api/auth/discord?returnTo=%2Fbanners');
    expect(response.headers.get('Set-Cookie')).toBeNull();
  });
  it('creates state only on the callback host and rejects malformed or expired callbacks', async () => {
    const env = { SESSION_SECRET: 'a sufficiently long test secret for oauth state', DISCORD_CLIENT_ID: 'id', DISCORD_CLIENT_SECRET: 'secret', DISCORD_REDIRECT_URI: 'https://www.pfseeker.com/api/auth/discord/callback' };
    const start = await discordStartHandler({ request: new Request('https://www.pfseeker.com/api/auth/discord?returnTo=%2Ficons'), env });
    expect(start.headers.get('Set-Cookie')).toContain(`${STATE_COOKIE}=`); expect(start.headers.get('Set-Cookie')).not.toContain('Domain=');
    const malformed = await discordCallbackHandler({ request: new Request('https://www.pfseeker.com/api/auth/discord/callback?code=x&state=x'), env });
    expect(malformed.status).toBe(400);
    const expiredToken = await signPayload({ nonce: 'n', returnPath: '/', exp: 1 }, env.SESSION_SECRET);
    const expired = await discordCallbackHandler({ request: new Request('https://www.pfseeker.com/api/auth/discord/callback?code=x&state=n', { headers: { Cookie: `${STATE_COOKIE}=${encodeURIComponent(expiredToken)}` } }), env });
    expect(expired.status).toBe(400); expect(expired.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
  it('returns only the minimum browser session shape', async () => {
    const secret = 'a sufficiently long test secret';
    const token = await signPayload({ user: { id: '1', displayName: 'Archivist', avatarUrl: null }, csrf: 'csrf', exp: 9_999_999_999 }, secret);
    const request = new Request('https://www.pfseeker.com/api/auth/session', { headers: { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}` } });
    const response = await sessionHandler({ request, env: { SESSION_SECRET: secret, DISCORD_CLIENT_ID: 'id', DISCORD_CLIENT_SECRET: 'secret', DISCORD_REDIRECT_URI: 'https://www.pfseeker.com/api/auth/discord/callback' } });
    const data = await response.json(); expect(data).toMatchObject({ authenticated: true, user: { id: '1', displayName: 'Archivist', avatarUrl: null } });
    expect(JSON.stringify(data)).not.toMatch(/access_token|refresh_token/);
  });
  it('creates a short-lived authenticated Cloudinary URL without exposing the API secret', async () => {
    const asset = { cloudinaryPublicId: 'neuevault/restricted/icons/nv-1', cloudinaryDeliveryType: 'authenticated', fileType: 'PNG', originalDelivery: { resourceType: 'image' } };
    const url = await protectedDownloadUrl(asset, { CLOUDINARY_CLOUD_NAME: 'cloud', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'do-not-expose' }, 100);
    expect(url).toContain('type=authenticated'); expect(url).toContain('expires_at=400'); expect(url).toContain('timestamp=100'); expect(url).not.toContain('do-not-expose');
  });
  it('keeps the protected delivery identifier server-only', () => {
    const asset = getTrustedAsset('nv-166');
    expect(asset).toMatchObject({ id: 'nv-166', requiresDiscordAuth: true, src: null, cloudinaryDeliveryType: 'authenticated' });
    expect(asset.cloudinaryPublicId).toBeTruthy();
  });
  it('proxies protected downloads without exposing a signed delivery redirect', async () => {
    const secret = 'a sufficiently long test secret';
    const token = await signPayload({ user: { id: '1' }, csrf: 'csrf', exp: 9_999_999_999 }, secret);
    const request = new Request('https://www.pfseeker.com/api/download/nv-166', {
      headers: { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}` },
    });
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(jpeg, {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(jpeg.byteLength) },
    }));
    const response = await downloadHandler({
      request,
      params: { assetId: 'nv-166' },
      env: {
        SESSION_SECRET: secret,
        DISCORD_GUILD_ID: '',
        DISCORD_ALLOWED_ROLE_IDS: '',
        CLOUDINARY_CLOUD_NAME: 'cloud',
        CLOUDINARY_API_KEY: 'key',
        CLOUDINARY_API_SECRET: 'do-not-expose',
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('Location')).toBeNull();
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="nv-166.jpg"');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(jpeg);
    fetchMock.mockRestore();
  });
});
