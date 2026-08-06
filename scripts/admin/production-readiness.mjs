import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { createGitHubAppProvider, GITHUB_TARGET } from '../../server/admin/github-app-provider.js';
import { createCloudinaryProductionProvider, providerSupportsRestrictedUploads } from '../../server/admin/cloudinary-provider.js';
import { DEPLOYMENT_TARGET } from '../../server/admin/deployment-verifier.js';

if (process.argv.length !== 3 || process.argv[2] !== '--read-only') {
  console.error('Production readiness is read-only. Run with --read-only.');
  process.exit(2);
}

if (existsSync('.env')) process.loadEnvFile('.env');

const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};
const json = response => response.json().catch(() => null);
const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '');
const pagesToken = String(process.env.CLOUDFLARE_PAGES_READ_TOKEN || '');

requireCondition(process.env.ADMIN_ENVIRONMENT === 'production', 'ADMIN_ENVIRONMENT must be production.');
requireCondition(process.env.ADMIN_PRODUCTION_WRITES_ENABLED === 'false', 'The production write kill switch must be false.');
requireCondition(/^\d{17,20}$/.test(String(process.env.ADMIN_OWNER_DISCORD_ID || '')), 'The admin owner configuration is unavailable.');

const wrangler = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
const database = wrangler.d1_databases?.find(value => value.binding === 'ADMIN_DB');
requireCondition(database?.database_name === 'neuevault-admin-production', 'The production D1 binding is invalid.');
requireCondition(/^[a-f0-9-]{36}$/i.test(database.database_id), 'The production D1 ID is invalid.');
requireCondition(/^[a-f0-9-]{36}$/i.test(database.preview_database_id), 'The preview D1 ID is invalid.');
requireCondition(database.database_id !== database.preview_database_id, 'Production and preview D1 must be separate.');

function verifyD1(preview = false) {
  const statement = "SELECT (SELECT COUNT(*) FROM d1_migrations) AS migrations, (SELECT COUNT(*) FROM delegated_admins) AS delegated_admins, (SELECT COUNT(*) FROM publication_jobs) AS publication_jobs, (SELECT COUNT(*) FROM upload_jobs) AS upload_jobs";
  const args = ['wrangler', 'd1', 'execute', database.database_name, '--remote', '--command', statement];
  if (preview) args.splice(4, 0, '--preview');
  const command = process.platform === 'win32' ? process.execPath : 'npx';
  const commandArgs = process.platform === 'win32' ? [join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js'), ...args] : args;
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', timeout: 30_000, windowsHide: true });
  requireCondition(result.status === 0, `${preview ? 'Preview' : 'Production'} D1 read failed.`);
  requireCondition(/"migrations"\s*:\s*4/.test(result.stdout), `${preview ? 'Preview' : 'Production'} D1 migrations are incomplete.`);
  return { schemaReady: true, empty: /"delegated_admins"\s*:\s*0/.test(result.stdout) && /"publication_jobs"\s*:\s*0/.test(result.stdout) && /"upload_jobs"\s*:\s*0/.test(result.stdout) };
}

const gitHub = createGitHubAppProvider({ env: process.env });
requireCondition(gitHub, 'The GitHub App provider is unavailable.');
const head = await gitHub.readHead();
const snapshot = await gitHub.readSnapshot(head);

const cloudinary = createCloudinaryProductionProvider({ env: process.env });
requireCondition(cloudinary, 'The Cloudinary provider is unavailable.');
const sync = JSON.parse(readFileSync('content/cloudinary-sync.json', 'utf8'));
const restricted = sync.assets?.['nv-166'];
requireCondition(restricted?.original?.deliveryType === 'authenticated' && restricted?.preview?.deliveryType === 'upload', 'The restricted media identities are unavailable.');
await cloudinary.verifyResource({ publicId: restricted.original.publicId, deliveryType: 'authenticated', version: restricted.original.version });
await cloudinary.verifyResource({ publicId: restricted.preview.publicId, deliveryType: 'upload', version: restricted.preview.version });

requireCondition(/^[a-f0-9]{32}$/i.test(accountId) && pagesToken.length >= 20, 'The Cloudflare Pages reader is unavailable.');
const cloudflareHeaders = { Accept: 'application/json', Authorization: `Bearer ${pagesToken}` };
const projectResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${DEPLOYMENT_TARGET.project}`, { headers: cloudflareHeaders });
const project = await json(projectResponse);
requireCondition(projectResponse.ok && project?.success === true && project.result?.name === DEPLOYMENT_TARGET.project && project.result?.production_branch === DEPLOYMENT_TARGET.branch, 'The Cloudflare Pages target is unavailable.');
const deploymentResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${DEPLOYMENT_TARGET.project}/deployments?env=production&per_page=5`, { headers: cloudflareHeaders });
const deployments = await json(deploymentResponse);
requireCondition(deploymentResponse.ok && deployments?.success === true && Array.isArray(deployments.result), 'Cloudflare deployment reads are unavailable.');

const markerResponse = await fetch(`${DEPLOYMENT_TARGET.markerUrl}?readiness=${Date.now()}`, { headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }, cache: 'no-store' });
const markerType = markerResponse.headers.get('Content-Type') || '';
const marker = markerType.toLowerCase().includes('application/json') ? await json(markerResponse) : null;
const markerReady = markerResponse.ok && marker?.version === 1 && /^[a-f0-9]{64}$/i.test(String(marker.catalogDigest || ''));

const result = {
  mode: 'read-only',
  writesEnabled: false,
  github: { authenticated: true, target: GITHUB_TARGET, headValid: /^[a-f0-9]{40}$/i.test(head), assets: snapshot.assetsFile.assets.length },
  d1: { production: verifyD1(false), preview: verifyD1(true), isolated: database.database_id !== database.preview_database_id },
  cloudinary: { configured: true, resourceVerification: true, restrictedPreviewProvider: providerSupportsRestrictedUploads(cloudinary) },
  cloudflare: { project: project.result.name, branch: project.result.production_branch, deploymentsReadable: true },
  marker: { ready: markerReady, status: markerReady ? 'valid' : 'not_deployed' },
};

console.log(JSON.stringify(result, null, 2));
