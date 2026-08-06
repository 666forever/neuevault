import { AdminError } from './errors.js';
import { boundedProviderJson, transientStatus } from './provider-http.js';
import { CANONICAL_PATHS, GENERATED_PATHS, validCommitSha } from './catalog-paths.js';

export const GITHUB_TARGET = Object.freeze({ owner: '666forever', repository: 'neuevault', branch: 'main' });
const API = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const APPROVED_READS = Object.freeze([
  CANONICAL_PATHS.assets, CANONICAL_PATHS.categories, CANONICAL_PATHS.collections, CANONICAL_PATHS.cloudinary,
  GENERATED_PATHS.assets, GENERATED_PATHS.categories, GENERATED_PATHS.collections,
]);
const APPROVED_WRITES = new Set([...APPROVED_READS, GENERATED_PATHS.version]);
const encoder = new TextEncoder();
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const decodeBase64 = value => Uint8Array.from(atob(value.replace(/\s/g, '')), char => char.charCodeAt(0));
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const validTreeSha = value => validCommitSha(value);

function configuration(env) {
  const appId = String(env.GITHUB_APP_ID || ''); const installationId = String(env.GITHUB_APP_INSTALLATION_ID || ''); const privateKey = String(env.GITHUB_APP_PRIVATE_KEY || '');
  if (!/^\d+$/.test(appId) || !/^\d+$/.test(installationId) || !privateKey.includes('BEGIN PRIVATE KEY')) return null;
  return { appId, installationId, privateKey };
}

async function importPrivateKey(pem) {
  try {
    const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
    return await crypto.subtle.importKey('pkcs8', decodeBase64(body), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  } catch { throw new AdminError(503, 'github_auth_failed', 'GitHub authentication is unavailable.'); }
}

export async function createGitHubAppJwt(config, now = new Date()) {
  const issuedAt = Math.floor(now.getTime() / 1000) - 30; const expiresAt = issuedAt + 540;
  const header = base64url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64url(encoder.encode(JSON.stringify({ iat: issuedAt, exp: expiresAt, iss: config.appId })));
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', await importPrivateKey(config.privateKey), encoder.encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64url(signature)}`;
}

export function createGitHubAppProvider({ env, now = () => new Date() }) {
  const config = configuration(env); if (!config) return null;
  let cachedToken = null;
  const appHeaders = token => ({ Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': API_VERSION, 'User-Agent': 'neuevault-pages-admin' });
  const installationToken = async () => {
    const current = now();
    if (cachedToken && cachedToken.expiresAt.getTime() - current.getTime() > 60_000) return cachedToken.value;
    const jwt = await createGitHubAppJwt(config, current);
    const { response, body } = await boundedProviderJson(`${API}/app/installations/${config.installationId}/access_tokens`, { method: 'POST', headers: appHeaders(jwt), body: JSON.stringify({ repositories: [GITHUB_TARGET.repository], permissions: { contents: 'write', metadata: 'read' } }) }, { unavailableCode: 'github_unavailable', invalidCode: 'github_invalid_response', maxBytes: 65_536 });
    const repositoryMismatch=Array.isArray(body?.repositories)&&!body.repositories.some(repository=>repository?.name===GITHUB_TARGET.repository&&repository?.owner?.login===GITHUB_TARGET.owner);
    if (!response.ok || !object(body) || typeof body.token !== 'string' || !body.expires_at || body.permissions?.contents!=='write' || (body.permissions?.metadata&&body.permissions.metadata!=='read') || repositoryMismatch) throw new AdminError(503, response.status === 401 || response.status === 403 ? 'github_auth_failed' : 'github_invalid_response', 'GitHub authentication is unavailable.');
    const expiresAt = new Date(body.expires_at); if (!Number.isFinite(expiresAt.getTime())) throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid response.');
    cachedToken = { value: body.token, expiresAt }; return body.token;
  };
  const request = async (path, options = {}, { maxBytes = 1_048_576, mutation = false } = {}) => {
    const token = await installationToken();
    const result = await boundedProviderJson(`${API}${path}`, { ...options, headers: { ...appHeaders(token), ...(options.headers || {}) } }, { unavailableCode: 'github_unavailable', invalidCode: 'github_invalid_response', maxBytes });
    if (result.response.status === 401) cachedToken = null;
    if (!result.response.ok) {
      if (result.response.status === 409 || result.response.status === 422) throw new AdminError(409, 'github_conflict', 'The catalog changed before publication.');
      throw new AdminError(transientStatus(result.response.status) ? 503 : 502, result.response.status === 401 || result.response.status === 403 ? 'github_auth_failed' : mutation ? 'github_unavailable' : 'github_unavailable', 'GitHub is unavailable.');
    }
    return result.body;
  };
  const repo = `/repos/${GITHUB_TARGET.owner}/${GITHUB_TARGET.repository}`;
  const readHead = async () => {
    const body = await request(`${repo}/git/ref/heads/${GITHUB_TARGET.branch}`, {}, { maxBytes: 32_768 });
    if (!object(body) || body.ref !== `refs/heads/${GITHUB_TARGET.branch}` || body.object?.type !== 'commit' || !validCommitSha(body.object.sha)) throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid repository head.');
    return body.object.sha.toLowerCase();
  };
  const readFile = async (path, sha) => {
    if (!APPROVED_READS.includes(path)) throw new AdminError(400, 'github_path_invalid', 'The requested catalog path is not allowed.');
    const body = await request(`${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${sha}`, {}, { maxBytes: 4_500_000 });
    if (!object(body) || body.type !== 'file' || body.path !== path || body.encoding !== 'base64' || !validCommitSha(body.sha) || typeof body.content !== 'string') throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid catalog file.');
    try { return JSON.parse(new TextDecoder().decode(decodeBase64(body.content))); } catch { throw new AdminError(503, 'github_invalid_response', 'GitHub returned invalid catalog JSON.'); }
  };
  return {
    async readHead() { return readHead(); },
    async readSnapshot(sha) {
      if (!validCommitSha(sha)) throw new AdminError(400, 'catalog_base_invalid', 'A valid catalog base is required.');
      const [assetsFile, categoriesFile, collectionsFile, cloudinarySync, assets, categories, collections] = await Promise.all(APPROVED_READS.map(path => readFile(path, sha)));
      if (!Array.isArray(assetsFile?.assets) || !Array.isArray(categoriesFile?.categories) || !Array.isArray(collectionsFile?.collections) || !Array.isArray(assets) || !Array.isArray(categories) || !Array.isArray(collections)) throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid catalog snapshot.');
      return { assetsFile, categoriesFile, collectionsFile, cloudinarySync, generated: { assets, categories, collections } };
    },
    async createCommit({ baseSha, files, message }) {
      if (!validCommitSha(baseSha) || await readHead() !== baseSha) throw new AdminError(409, 'github_conflict', 'The catalog changed before publication.');
      if (!Array.isArray(files) || !files.length || files.some(file => !APPROVED_WRITES.has(file.path) || typeof file.content !== 'string' || file.content.length > 4_000_000)) throw new AdminError(400, 'github_path_invalid', 'The publication contains an invalid catalog file.');
      if (!/^catalog: (category|collection|asset)\.(create|update|delete) [a-z0-9-]+$/i.test(String(message))) throw new AdminError(400, 'github_commit_invalid', 'The publication commit is invalid.');
      const base = await request(`${repo}/git/commits/${baseSha}`, {}, { maxBytes: 65_536 });
      if (!object(base) || base.sha !== baseSha || !validTreeSha(base.tree?.sha)) throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid base commit.');
      const blobs = [];
      for (const file of files) {
        const blob = await request(`${repo}/git/blobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: file.content, encoding: 'utf-8' }) }, { maxBytes: 32_768, mutation: true });
        if (!object(blob) || !validCommitSha(blob.sha)) throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid blob.');
        blobs.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
      }
      const tree = await request(`${repo}/git/trees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base_tree: base.tree.sha, tree: blobs }) }, { maxBytes: 65_536, mutation: true });
      if (!object(tree) || !validTreeSha(tree.sha)) throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid tree.');
      const commit = await request(`${repo}/git/commits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }) }, { maxBytes: 65_536, mutation: true });
      if (!object(commit) || !validCommitSha(commit.sha) || commit.parents?.length !== 1 || commit.parents[0]?.sha !== baseSha || commit.tree?.sha !== tree.sha) throw new AdminError(503, 'github_invalid_response', 'GitHub returned an invalid commit.');
      if (await readHead() !== baseSha) throw new AdminError(409, 'github_conflict', 'The catalog changed before publication.');
      const ref = await request(`${repo}/git/refs/heads/${GITHUB_TARGET.branch}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sha: commit.sha, force: false }) }, { maxBytes: 32_768, mutation: true });
      if (!object(ref) || ref.ref !== `refs/heads/${GITHUB_TARGET.branch}` || ref.object?.type !== 'commit' || ref.object.sha !== commit.sha || await readHead() !== commit.sha) throw new AdminError(503, 'github_invalid_response', 'GitHub did not confirm the published commit.');
      return { commitSha: commit.sha };
    },
  };
}
