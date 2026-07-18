import { existsSync } from 'node:fs';
import { syncCloudinary } from './cloudinary/sync.mjs';
import { CloudinaryTransport } from './cloudinary/transport.mjs';

if (existsSync('.env')) process.loadEnvFile('.env');
const dryRun = process.argv.includes('--dry-run');
try {
  const result = await syncCloudinary({ dryRun, ...(dryRun ? {} : { transport: new CloudinaryTransport() }) });
  if (dryRun) { console.log(`Dry run: ${result.planned.length} upload(s) required.`); for (const item of result.planned) console.log(`  ${item.id}: ${item.deliveryType} ${item.publicId}${item.restrictedPreviewPublicId ? ` + public preview ${item.restrictedPreviewPublicId}` : ''}`); }
  else console.log(`Cloudinary sync complete: ${result.uploaded.length} uploaded, ${result.skipped.length} unchanged.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
