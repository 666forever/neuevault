import { existsSync } from 'node:fs';
import path from 'node:path';
import { readJson } from './asset-pipeline/filesystem.mjs';
import { CloudinaryTransport } from './cloudinary/transport.mjs';
import { executeCloudinaryPrune, planCloudinaryPrune, writePrunePlan } from './cloudinary/prune.mjs';
import { syncStatePath } from './cloudinary/sync.mjs';

if (existsSync('.env')) process.loadEnvFile('.env');
const valueAfter = flag => { const index = process.argv.indexOf(flag); return index >= 0 ? process.argv[index + 1] : null; };
try {
  const transport = new CloudinaryTransport(); const state = await readJson(syncStatePath); const plan = await planCloudinaryPrune({ transport, state });
  console.log(`Proposed public deletions: ${plan.candidates.length}`); for (const item of plan.candidates) console.log(`  ${item.publicId} (${item.assetId})`);
  console.log(`Protected restricted orphans: ${plan.protectedRestricted.length}`); for (const item of plan.protectedRestricted) console.log(`  PROTECTED ${item.publicId}`);
  const output = valueAfter('--write-plan'); if (output) { await writePrunePlan(path.resolve(output), plan); console.log(`Confirmation plan written to ${path.resolve(output)}`); }
  if (process.argv.includes('--execute')) { const result = await executeCloudinaryPrune({ transport, currentPlan: plan, confirmationFile: valueAfter('--plan') }); console.log(`Deleted ${result.deleted.length} public asset(s).`); }
  else console.log('Dry run only. Nothing was deleted.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
