import { AdminError } from './errors.js';
import { adminCloudinaryProvider, providerSupportsRestrictedUploads } from './cloudinary-provider.js';

const ENVIRONMENTS = new Set(['production', 'preview', 'local', 'test']);

export function adminEnvironment(env) {
  const value = String(env.ADMIN_ENVIRONMENT || '').toLowerCase();
  return ENVIRONMENTS.has(value) ? value : null;
}

export function adminCapabilities(env, { fullyConfigured = false } = {}) {
  const environment = adminEnvironment(env); const localWriteOptIn = env.ADMIN_ALLOW_LOCAL_WRITES === 'true'; const productionWriteOptIn = env.ADMIN_PRODUCTION_WRITES_ENABLED === 'true';
  return { environment, readOnly: environment === 'preview', providerReady: Boolean(fullyConfigured), writeEnabled: environment === 'production' ? productionWriteOptIn : localWriteOptIn, canWrite: environment === 'production' ? Boolean(fullyConfigured&&productionWriteOptIn) : (environment === 'local' || environment === 'test') && localWriteOptIn };
}

export function requireAdminWriteCapability(env, options) {
  const capabilities = adminCapabilities(env, options);
  if (!capabilities.environment) throw new AdminError(503, 'admin_environment_unconfigured', 'Administration writes are not configured.');
  if (!capabilities.canWrite) throw new AdminError(403, 'admin_writes_disabled', 'Administration writes are unavailable in this environment.');
  return capabilities;
}

export function adminProviderCompleteness({env={},data={}}={}) {
  const owner=/^\d{17,20}$/.test(String(env.ADMIN_OWNER_DISCORD_ID||''));
  const publicationDatabase=Boolean(data.publicationStore||env.ADMIN_DB?.prepare);const uploadDatabase=Boolean(data.uploadStore||env.ADMIN_DB?.prepare);
  const github=Boolean(data.adminGitProvider||data.githubAppProvider||(/^\d+$/.test(String(env.GITHUB_APP_ID||''))&&/^\d+$/.test(String(env.GITHUB_APP_INSTALLATION_ID||''))&&String(env.GITHUB_APP_PRIVATE_KEY||'').includes('BEGIN PRIVATE KEY')));
  const cloudinaryProvider=adminCloudinaryProvider({env,data});const cloudinary=Boolean(data.adminCloudinaryProvider||data.cloudinaryAdminProvider||(env.CLOUDINARY_CLOUD_NAME&&env.CLOUDINARY_API_KEY&&env.CLOUDINARY_API_SECRET));
  const verifier=Boolean(data.deploymentVerifier||data.cloudflareDeploymentVerifier||(/^[a-f0-9]{32}$/i.test(String(env.CLOUDFLARE_ACCOUNT_ID||''))&&String(env.CLOUDFLARE_PAGES_READ_TOKEN||'').length>=20));
  const environment=adminEnvironment(env);const uploads=Boolean(environment&&owner&&publicationDatabase&&uploadDatabase&&github&&cloudinary);const explicitMock=(environment==='local'||environment==='test')&&data.enableRestrictedUploads===true;const restrictedProvider=providerSupportsRestrictedUploads(cloudinaryProvider);return {environment,owner,database:publicationDatabase,github,cloudinary,verifier,catalogWrites:Boolean(environment&&owner&&publicationDatabase&&github),uploads,restrictedUploads:Boolean(uploads&&restrictedProvider&&(environment==='production'||explicitMock)),deploymentVerification:Boolean(environment&&owner&&publicationDatabase&&verifier)};
}
