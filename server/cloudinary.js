function hex(buffer) { return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join(''); }

export async function protectedDownloadUrl(asset, env, now = Math.floor(Date.now() / 1000)) {
  if (!asset.cloudinaryPublicId || asset.cloudinaryDeliveryType !== 'authenticated' || !asset.fileType) return null;
  const params = { attachment: 'true', expires_at: String(now + 300), format: asset.fileType.toLowerCase(), public_id: asset.cloudinaryPublicId, resource_type: asset.originalDelivery?.resourceType || 'image', type: 'authenticated' };
  const signatureBase = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('&');
  const signature = hex(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(`${signatureBase}${env.CLOUDINARY_API_SECRET}`)));
  const query = new URLSearchParams({ ...params, api_key: env.CLOUDINARY_API_KEY, signature });
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/download?${query}`;
}
