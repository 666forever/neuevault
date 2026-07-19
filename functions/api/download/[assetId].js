import { canAccessRestricted, currentSession } from '../../../server/auth.js';
import { getTrustedAsset } from '../../../server/assets.js';
import { protectedDownloadUrl } from '../../../server/cloudinary.js';
import { errorResponse } from '../../../server/http.js';

export async function onRequest({ request, env, params }) {
  if (!['GET', 'POST'].includes(request.method)) return errorResponse(405, 'Method not allowed.');
  const session = await currentSession(request, env); if (!session) return errorResponse(401, 'Sign in is required.');
  if (!canAccessRestricted(session)) return errorResponse(403, 'This account cannot access the original.');
  const asset = getTrustedAsset(String(params.assetId));
  if (!asset?.requiresDiscordAuth || asset.src !== null) return errorResponse(404, 'Restricted original unavailable.');
  if (!['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every(name => env[name])) return errorResponse(503, 'Protected delivery is not configured.');
  const location = await protectedDownloadUrl(asset, env); if (!location) return errorResponse(404, 'Restricted original unavailable.');
  return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
