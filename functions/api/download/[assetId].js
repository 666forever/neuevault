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
  const upstream = await fetch(location, { redirect: 'follow' });
  if (!upstream.ok || !upstream.body) return errorResponse(502, 'Protected original could not be delivered.');

  // Proxy the authenticated response so Cloudinary delivery identifiers and signed URLs stay server-only.
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${asset.id}.${String(asset.fileType).toLowerCase()}"`,
    'Content-Type': upstream.headers.get('Content-Type') || asset.mimeType || 'application/octet-stream',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  });
  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength) headers.set('Content-Length', contentLength);
  return new Response(upstream.body, { status: 200, headers });
}
