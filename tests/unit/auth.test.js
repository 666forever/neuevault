import { describe, expect, it, vi } from 'vitest';
import { signPayload, verifyPayload } from '../../server/crypto.js';
import { safeReturnPath } from '../../server/http.js';
import { protectedDownloadUrl } from '../../server/cloudinary.js';
import { onRequestGet as sessionHandler } from '../../functions/api/auth/session.js';
import { SESSION_COOKIE } from '../../server/auth.js';

describe('production authentication boundary', () => {
  it('signs sessions and rejects tampering', async () => {
    const token = await signPayload({ user: { id: '1' }, exp: 9_999_999_999 }, 'a sufficiently long test secret');
    expect((await verifyPayload(token, 'a sufficiently long test secret')).user.id).toBe('1');
    expect(await verifyPayload(`${token}x`, 'a sufficiently long test secret')).toBeNull();
  });
  it('accepts only local return paths', () => {
    expect(safeReturnPath('/#/asset/nv-1')).toBe('/#/asset/nv-1');
    expect(safeReturnPath('https://evil.example')).toBe('/'); expect(safeReturnPath('//evil.example')).toBe('/');
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
    expect(url).toContain('type=authenticated'); expect(url).toContain('expires_at=400'); expect(url).not.toContain('do-not-expose');
  });
});
