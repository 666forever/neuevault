import { AdminError } from './errors.js';
import { adminEnvironment, adminProviderCompleteness } from './capabilities.js';
import { adminGitProvider, createCatalogReadProvider } from './git-provider.js';
import { publicationStore } from './publication-store.js';

export function adminCatalogProvider({ env, data } = {}) {
  const environment = adminEnvironment(env || {});
  const provider = data?.adminCatalogProvider;
  if (['local', 'test'].includes(environment) && provider && typeof provider.read === 'function') return provider;
  const git = adminGitProvider({env,data}); if (git) return createCatalogReadProvider(git);
  if (!['local', 'test'].includes(environment)) return null;
  return null;
}

export async function readAdminCatalog(context) {
  const provider = adminCatalogProvider(context);
  if (!provider) throw new AdminError(503, 'admin_catalog_unavailable', 'The administration catalog is unavailable.');
  try {
    const result = await provider.read();
    if (!result?.catalog || !Array.isArray(result.catalog.assets) || !Array.isArray(result.catalog.categories) || !Array.isArray(result.catalog.collections)) throw new Error('Invalid catalog provider response.');
    const environment=adminEnvironment(context.env||{}); const publicationConfigured=Boolean(adminProviderCompleteness(context).catalogWrites&&adminGitProvider(context)&&publicationStore(context)); const writable=result.readOnly===false&&(['local','test'].includes(environment)||(environment==='production'&&publicationConfigured));
    return { baseCommitSha: result.baseCommitSha || null, source: result.source || 'local', readOnly: !writable, catalog: result.catalog };
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(503, 'admin_catalog_unavailable', 'The administration catalog is unavailable.');
  }
}
