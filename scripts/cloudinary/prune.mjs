import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { listNamespace } from './remote.mjs';

const fingerprint = candidates => createHash('sha256').update(JSON.stringify(candidates.map(item => item.assetId).sort())).digest('hex');

export async function planCloudinaryPrune({ transport, state }) {
  const referenced = new Set(Object.values(state.assets || {}).flatMap(record => [record.original?.publicId, record.preview?.publicId].filter(Boolean)));
  const remote = await listNamespace(transport); const protectedRestricted = []; const candidates = [];
  for (const resource of remote) {
    if (referenced.has(resource.public_id)) continue;
    const record = { assetId: resource.asset_id, publicId: resource.public_id, deliveryType: resource.type };
    if (resource.type === 'authenticated' || resource.public_id.startsWith('neuevault/restricted/')) protectedRestricted.push(record); else candidates.push(record);
  }
  candidates.sort((a, b) => a.publicId.localeCompare(b.publicId));
  return { version: 1, namespace: 'neuevault/', generatedAt: new Date().toISOString(), fingerprint: fingerprint(candidates), candidates, protectedRestricted };
}

export async function writePrunePlan(file, plan) { await writeFile(file, `${JSON.stringify(plan, null, 2)}\n`); }

export async function executeCloudinaryPrune({ transport, currentPlan, confirmationFile }) {
  if (!confirmationFile) throw new Error('Destructive pruning requires --plan <confirmation-file>. No assets were deleted.');
  const confirmed = JSON.parse(await readFile(confirmationFile, 'utf8'));
  if (confirmed.fingerprint !== currentPlan.fingerprint || JSON.stringify(confirmed.candidates) !== JSON.stringify(currentPlan.candidates)) throw new Error('Prune confirmation is stale or does not exactly match the current proposal. No assets were deleted.');
  if (!currentPlan.candidates.length) return { deleted: [] };
  const ids = currentPlan.candidates.map(item => item.assetId); await transport.deleteByAssetIds(ids); return { deleted: currentPlan.candidates };
}
