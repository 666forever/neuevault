import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generateAssets } from './asset-pipeline/generator.mjs';
import { pipelineConfig } from './asset-pipeline/config.mjs';
import { exists, readJson } from './asset-pipeline/filesystem.mjs';
import { backupAssetControlFiles } from './asset-update/backup.mjs';
import { reconcileAssetMetadata } from './asset-update/reconcile.mjs';
import { printAssetUpdateReport } from './asset-update/report.mjs';
import { cloudinaryOriginalPublicId, cloudinaryPreviewPublicId, expectedDeliveryType } from './cloudinary/identity.mjs';
import { syncCloudinary, syncStatePath } from './cloudinary/sync.mjs';
import { CloudinaryTransport } from './cloudinary/transport.mjs';
import { verifyCloudinary } from './cloudinary/verify.mjs';

const dryRun = process.argv.includes('--dry-run');
const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
const runNpm = args => new Promise((resolve, reject) => {
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: process.cwd(), stdio: 'inherit', shell: false });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} exited with code ${code}`)));
});
const localCloudPlan = async assets => {
  const state = await exists(syncStatePath) ? await readJson(syncStatePath) : { assets: {} }; const planned = []; const skipped = [];
  for (const asset of assets) {
    const previous = state.assets?.[asset.id]; const expectedId = cloudinaryOriginalPublicId(asset); const expectedType = expectedDeliveryType(asset);
    if (previous && previous.sourceHash === asset.sourceHash && previous.original?.publicId === expectedId && previous.original?.deliveryType === expectedType) skipped.push(asset.id);
    else planned.push({ id: asset.id, publicId: expectedId, deliveryType: expectedType, restrictedPreviewPublicId: asset.requiresDiscordAuth ? cloudinaryPreviewPublicId(asset) : null });
  }
  return { planned, skipped };
};
const assertRestrictedBoundary = async () => {
  const assets = JSON.parse(await readFile(path.join(pipelineConfig.generatedRoot, 'assets.json'), 'utf8')); const invalid = assets.filter(asset => asset.requiresDiscordAuth && (asset.src !== null || asset.previewUrl?.includes('/restricted/') || asset.previewUrl?.includes('/authenticated/')));
  if (invalid.length) throw new Error(`Restricted-original exposure violation: ${invalid.map(asset => asset.id).join(', ')}`);
  console.log(`Restricted exposure audit passed (${assets.filter(asset => asset.requiresDiscordAuth).length} restricted records).`);
};

try {
  const reconciliation = await reconcileAssetMetadata(); const cloudPlan = await localCloudPlan(reconciliation.assetsFile.assets);
  if (dryRun) { printAssetUpdateReport(reconciliation.report, cloudPlan, { dryRun: true }); console.log('Dry-run complete. No files or remote resources were modified.'); process.exit(0); }
  if (reconciliation.report.editorialReview.length) { printAssetUpdateReport(reconciliation.report, cloudPlan); throw new Error('Editorial review is required. No files were modified and Cloudinary was not contacted.'); }
  if (existsSync('.env')) process.loadEnvFile('.env');
  const transport = new CloudinaryTransport();
  const backup = await backupAssetControlFiles(); console.log(`Backup created: ${backup}`);
  await Promise.all([writeJson(path.join(pipelineConfig.metadataRoot, 'assets.json'), reconciliation.assetsFile), writeJson(path.join(pipelineConfig.metadataRoot, 'categories.json'), reconciliation.categoriesFile), writeJson(path.join(pipelineConfig.collectionRoot, 'collections.json'), reconciliation.collectionsFile)]);
  const cloud = await syncCloudinary({ transport }); await verifyCloudinary({ transport });
  await generateAssets({ writeOutput: false });
  await runNpm(['test']); await runNpm(['run', 'test:e2e']); await runNpm(['run', 'build']); await runNpm(['run', 'audit:cloudinary-secrets']); await assertRestrictedBoundary();
  printAssetUpdateReport(reconciliation.report, cloud); console.log('Asset update completed successfully.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
