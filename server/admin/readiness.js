import { authConfigured } from '../auth.js';
import { AdminError } from './errors.js';
import { adminCapabilities, adminEnvironment, adminProviderCompleteness } from './capabilities.js';
import { adminGitProvider } from './git-provider.js';
import { adminCloudinaryProvider } from './cloudinary-provider.js';
import { deploymentVerifier, DEPLOYMENT_TARGET } from './deployment-verifier.js';

const REQUIRED_TABLES = ['admin_audit_log', 'd1_migrations', 'delegated_admins', 'publication_jobs', 'upload_jobs'];
const REQUIRED_INDEXES = ['admin_audit_created', 'publication_actor_idempotency', 'publication_commit_pending', 'upload_jobs_actor_idempotency', 'upload_commit_pending'];
const DIGEST = /^[a-f0-9]{64}$/i;

const unavailable = () => new AdminError(503, 'admin_readiness_failed', 'Production readiness could not be verified.');

async function marker(context) {
  if (context.data?.catalogMarker) return context.data.catalogMarker;
  const response = await fetch(`${DEPLOYMENT_TARGET.markerUrl}?readiness=${Date.now()}`, {
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    cache: 'no-store',
  });
  const type = response.headers.get('Content-Type') || '';
  if (!response.ok || !type.toLowerCase().includes('application/json')) throw unavailable();
  const body = await response.json().catch(() => null);
  if (body?.version !== 1 || !DIGEST.test(String(body.catalogDigest || ''))) throw unavailable();
  return body;
}

async function d1Ready(db) {
  if (!db?.prepare) throw unavailable();
  const schema = await db.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%'").all();
  const migrations = await db.prepare('SELECT COUNT(*) AS count FROM d1_migrations').first();
  const entries = Array.isArray(schema?.results) ? schema.results : [];
  const tables = new Set(entries.filter(value => value.type === 'table').map(value => value.name));
  const indexes = new Set(entries.filter(value => value.type === 'index').map(value => value.name));
  return Number(migrations?.count) === 4 && REQUIRED_TABLES.every(value => tables.has(value)) && REQUIRED_INDEXES.every(value => indexes.has(value));
}

export async function verifyProductionReadiness(context) {
  const { env = {}, data = {} } = context;
  if (adminEnvironment(env) !== 'production' || env.ADMIN_PRODUCTION_WRITES_ENABLED !== 'false') throw unavailable();
  if (!authConfigured(env)) throw unavailable();
  if (!await d1Ready(env.ADMIN_DB)) throw unavailable();

  const git = adminGitProvider(context);
  const cloudinary = adminCloudinaryProvider(context);
  const cloudflare = deploymentVerifier(context);
  if (!git || !cloudinary || !cloudflare) throw unavailable();

  const head = await git.readHead();
  const snapshot = await git.readSnapshot(head);
  if (snapshot.assetsFile?.assets?.length !== 234 || snapshot.categoriesFile?.categories?.length !== 4 || snapshot.collectionsFile?.collections?.length !== 4) throw unavailable();

  const restricted = snapshot.cloudinarySync?.assets?.['nv-166'];
  const publicAsset = snapshot.assetsFile.assets.find(asset => !asset.requiresDiscordAuth && snapshot.cloudinarySync?.assets?.[asset.id]?.original);
  const publicResource = publicAsset && snapshot.cloudinarySync.assets[publicAsset.id].original;
  if (!restricted?.original || !restricted?.preview || !publicResource) throw unavailable();
  await cloudinary.verifyResource({ publicId: publicResource.publicId, deliveryType: publicResource.deliveryType, version: publicResource.version });
  await cloudinary.verifyResource({ publicId: restricted.original.publicId, deliveryType: 'authenticated', version: restricted.original.version });
  await cloudinary.verifyResource({ publicId: restricted.preview.publicId, deliveryType: 'upload', version: restricted.preview.version });

  const liveMarker = await marker(context);
  const deployment = await cloudflare.verify({ commitSha: head, catalogDigest: liveMarker.catalogDigest });
  if (deployment?.state !== 'live' || deployment.deployedCommitSha?.toLowerCase() !== head.toLowerCase()) throw unavailable();

  const completeness = adminProviderCompleteness(context);
  const catalog = adminCapabilities(env, { fullyConfigured: completeness.catalogWrites });
  const uploads = adminCapabilities(env, { fullyConfigured: completeness.uploads });
  const restrictedUploads = adminCapabilities(env, { fullyConfigured: completeness.restrictedUploads });
  const mutationCapabilities = {
    manageDelegatedAdmins: catalog.canWrite,
    writeCatalog: catalog.canWrite,
    uploadAssets: uploads.canWrite,
    uploadRestrictedAssets: restrictedUploads.canWrite,
  };
  if (Object.values(mutationCapabilities).some(Boolean)) throw unavailable();

  return {
    ready: true,
    environment: 'production',
    checks: {
      ownerConfigured: true,
      discordConfigured: true,
      d1Schema: true,
      githubRead: true,
      githubTargetFixed: true,
      cloudinaryRead: true,
      cloudflareDeploymentRead: true,
      marker: true,
      zeroProviderMutations: true,
    },
    writeGateDisabled: true,
    catalog: { assets: 234, categories: 4, collections: 4 },
    capabilities: mutationCapabilities,
  };
}
