import { AdminError } from './errors.js';
import { createGitHubAppProvider } from './github-app-provider.js';
export { CANONICAL_PATHS, GENERATED_PATHS, validCommitSha } from './catalog-paths.js';
import { CANONICAL_PATHS } from './catalog-paths.js';

export function adminGitProvider({ env = {}, data = {} } = {}) {
  if (data.adminGitProvider && typeof data.adminGitProvider.readHead === 'function') return data.adminGitProvider;
  if (data.githubAppProvider) return data.githubAppProvider;
  if (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_APP_INSTALLATION_ID) return createGitHubAppProvider({ env });
  return null;
}

export function requireGitProvider(context) {
  const provider = adminGitProvider(context); if (!provider) throw new AdminError(503,'admin_git_unavailable','Catalog publication is unavailable.'); return provider;
}

export function createCatalogReadProvider(gitProvider) {
  return { async read(){
    const baseCommitSha=await gitProvider.readHead();
    const snapshot=await gitProvider.readSnapshot(baseCommitSha);
    const generatedById=new Map((snapshot.generated?.assets||[]).map(asset=>[asset.id,asset]));
    const assets=snapshot.assetsFile.assets.map(asset=>{
      const generated=generatedById.get(asset.id)||{};
      return {...asset,previewUrl:generated.previewUrl||generated.previewFile||null,previewSources:Array.isArray(generated.previewSources)?generated.previewSources:[]};
    });
    return {baseCommitSha,source:'github',readOnly:false,catalog:{assets,categories:snapshot.categoriesFile.categories,collections:snapshot.collectionsFile.collections}};
  } };
}
