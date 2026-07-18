import { v2 as cloudinary } from 'cloudinary';

export function readCloudinaryCredentials(environment = process.env) {
  const credentials = { cloudName: environment.CLOUDINARY_CLOUD_NAME, apiKey: environment.CLOUDINARY_API_KEY, apiSecret: environment.CLOUDINARY_API_SECRET };
  const missing = Object.entries(credentials).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`Missing Cloudinary credentials: ${missing.join(', ')}. Copy .env.example to .env and supply real server-side values.`);
  return credentials;
}

export class CloudinaryTransport {
  constructor(credentials = readCloudinaryCredentials()) {
    cloudinary.config({ cloud_name: credentials.cloudName, api_key: credentials.apiKey, api_secret: credentials.apiSecret, secure: true });
  }
  upload(file, options) { return cloudinary.uploader.upload(file, options); }
  list({ prefix, type, nextCursor }) { return cloudinary.api.resources({ resource_type: 'image', type, prefix, max_results: 500, ...(nextCursor ? { next_cursor: nextCursor } : {}) }); }
  deleteByAssetIds(assetIds) { return cloudinary.api.delete_resources_by_asset_ids(assetIds, { invalidate: true }); }
}
