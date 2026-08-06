import { createLocalAdminCatalogProvider } from './local-catalog-provider.mjs';
import { createMockGitProvider } from '../../server/admin/mock-git-provider.js';
import { createMockCloudinaryProvider } from '../../server/admin/cloudinary-provider.js';
import { createMemoryUploadStore } from '../../server/admin/upload-store.js';
import { createUploadJob, finalizeUploadJob, getUploadJob, retryUploadPublication } from '../../server/admin/uploads.js';

const scenarios = new Set(['owner', 'owner-empty', 'owner-multiple', 'owner-read-failure', 'owner-batch-failure', 'delegated', 'unauthorized', 'signed-out', 'unavailable']);
const identities = {
  owner: { id: '900000000000000001', displayName: 'Local owner', avatarUrl: null },
  delegated: { id: '900000000000000002', displayName: 'Local delegated admin', avatarUrl: null },
};

function send(response, status, body) {
  response.statusCode = status; response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.setHeader('Cache-Control', 'no-store'); response.end(JSON.stringify(body));
}

export function adminDevMockPlugin({ scenario = process.env.ADMIN_MOCK_SCENARIO, restrictedUploads = process.env.ADMIN_MOCK_RESTRICTED_UPLOADS === 'true' } = {}) {
  if (!scenarios.has(scenario)) return null;
  const provider = createLocalAdminCatalogProvider({ baseCommitSha: 'a'.repeat(40), writable: true });
  const uploadStore=createMemoryUploadStore();const cloudinary=createMockCloudinaryProvider({restrictedEnabled:restrictedUploads});let gitPromise;
  const uploadContext=async()=>{gitPromise??=provider.read().then(value=>createMockGitProvider({head:value.baseCommitSha,snapshot:value.snapshot}));return {env:{},data:{adminGitProvider:await gitPromise,adminCloudinaryProvider:cloudinary,uploadStore,enableRestrictedUploads:restrictedUploads}};};
  const ownerScenario = scenario.startsWith('owner'); const ownerId = identities.owner.id;
  const rows = scenario === 'owner-multiple' ? [{ discordId: '900000000000000010', createdBy: ownerId, createdAt: '2026-08-01T00:00:00.000Z' }, { discordId: '900000000000000011', createdBy: ownerId, createdAt: '2026-08-02T00:00:00.000Z' }] : [];
  const readBody = request => new Promise((resolve, reject) => { let text = ''; request.on('data', value => { text += value; if (text.length > 1024) reject(new Error('too large')); }); request.on('end', () => { try { resolve(JSON.parse(text)); } catch { reject(new Error('invalid json')); } }); });
  return {
    name: 'neuevault-admin-local-mock', apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        if (!pathname.startsWith('/api/admin/')) return next();
        if (scenario === 'signed-out') return send(response, 401, { error: 'Authentication is required.', code: 'admin_authentication_required' });
        if (scenario === 'unauthorized') return send(response, 403, { error: 'Administrator access is not authorized.', code: 'admin_access_denied' });
        if (scenario === 'unavailable') return send(response, 503, { error: 'Administration is unavailable.', code: 'admin_owner_unconfigured' });
        if(pathname==='/api/admin/mock-cloudinary'&&request.method==='POST'){return send(response,200,{public_id:'mock',version:1700000000});}
        if(pathname==='/api/admin/uploads'||pathname.startsWith('/api/admin/uploads/')){
          const admin={discordId:(ownerScenario?identities.owner:identities.delegated).id,role:ownerScenario?'owner':'delegated'};const context=await uploadContext();const parts=pathname.split('/').filter(Boolean);try{
            if(request.method==='POST'&&pathname==='/api/admin/uploads'){const body=await readBody(request);const output=await createUploadJob(context,{admin,requestId:'local-upload',idempotencyKey:request.headers['idempotency-key'],body,allowRestricted:restrictedUploads});output.authorization.uploadUrl='/api/admin/mock-cloudinary';return send(response,output.replayed?200:201,output);}
            const jobId=parts[3];if(request.method==='GET'&&parts.length===4)return send(response,200,{job:await getUploadJob(context,{admin,jobId})});
            if(request.method==='POST'&&parts[4]==='finalize'){const body=await readBody(request);return send(response,202,{job:await finalizeUploadJob(context,{admin,requestId:'local-finalize',jobId,idempotencyKey:request.headers['idempotency-key'],body})});}
            if(request.method==='POST'&&parts[4]==='retry'){const body=await readBody(request);return send(response,202,{job:await retryUploadPublication(context,{admin,requestId:'local-retry',jobId,baseCommitSha:body.baseCommitSha,idempotencyKey:request.headers['idempotency-key']})});}
          }catch(error){return send(response,error.status||500,{error:error.message||'Upload failed.',code:error.code||'admin_internal_error'});}return send(response,405,{error:'The request method is not allowed.',code:'admin_method_not_allowed'});
        }
        if (pathname === '/api/admin/publications') {
          if (request.method !== 'POST') return send(response, 405, { error: 'The request method is not allowed.', code: 'admin_method_not_allowed' });
          if (request.headers['x-csrf-token'] !== 'local-test-csrf') return send(response, 403, { error: 'The request is not authorized.', code: 'admin_csrf_invalid' });
          const body = await readBody(request).catch(() => null); if (!body?.mutation || !/^[a-f0-9]{40}$/.test(body.baseCommitSha || '')) return send(response, 400, { error: 'The catalog change is invalid.', code: 'catalog_base_invalid' });
          return send(response, 202, { publication: { publicationId: 'local-publication', status: 'deployment_pending', commitSha: 'b'.repeat(40), replayed: false } });
        }
        if (pathname === '/api/admin/delegated-admins' || pathname.startsWith('/api/admin/delegated-admins/')) {
          if (!ownerScenario) return send(response, 403, { error: 'Owner access is required.', code: 'admin_owner_required' });
          if (scenario === 'owner-read-failure' && request.method === 'GET') return send(response, 503, { error: 'Administration is temporarily unavailable.', code: 'admin_database_unavailable' });
          if (request.method === 'GET') return send(response, 200, { owner: { id: ownerId, permanent: true }, delegatedAdmins: rows });
          if (scenario === 'owner-batch-failure') return send(response, 503, { error: 'Administration is temporarily unavailable.', code: 'admin_database_unavailable' });
          if (request.headers['x-csrf-token'] !== 'local-test-csrf') return send(response, 403, { error: 'The request is not authorized.', code: 'admin_csrf_invalid' });
          if (request.method === 'POST') { const body = await readBody(request).catch(() => null); const id = typeof body?.discordId === 'string' ? body.discordId.trim() : ''; if (!/^\d{17,20}$/.test(id)) return send(response, 400, { error: 'Enter a valid Discord ID.', code: 'delegated_admin_id_invalid' }); if (id === ownerId) return send(response, 400, { error: 'The permanent owner cannot be delegated.', code: 'delegated_admin_owner_permanent' }); if (rows.some(row => row.discordId === id)) return send(response, 409, { error: 'This Discord ID already has delegated access.', code: 'delegated_admin_exists' }); rows.push({ discordId: id, createdBy: ownerId, createdAt: new Date().toISOString() }); return send(response, 201, { delegatedAdmin: rows.at(-1) }); }
          if (request.method === 'DELETE') { const id = decodeURIComponent(pathname.split('/').at(-1)); const index = rows.findIndex(row => row.discordId === id); if (id === ownerId) return send(response, 400, { error: 'The permanent owner cannot be removed.', code: 'delegated_admin_owner_permanent' }); if (index < 0) return send(response, 404, { error: 'This Discord ID does not have delegated access.', code: 'delegated_admin_not_found' }); rows.splice(index, 1); return send(response, 200, { removed: true, discordId: id }); }
          return send(response, 405, { error: 'The request method is not allowed.', code: 'admin_method_not_allowed' });
        }
        if (request.method !== 'GET') return send(response, 405, { error: 'The request method is not allowed.', code: 'admin_method_not_allowed' });
        if (pathname === '/api/admin/catalog') return send(response, 200, { ...await provider.read(), readOnly: false });
        return send(response, 200, { authenticated: true, role: ownerScenario ? 'owner' : scenario, user: ownerScenario ? identities.owner : identities[scenario], csrfToken: 'local-test-csrf', environment: 'local', readOnly: false, capabilities: { readCatalog: true, readDelegatedAdmins: ownerScenario, writeCatalog: true, manageDelegatedAdmins: ownerScenario, uploadAssets: true, uploadRestrictedAssets: restrictedUploads, deleteMedia: false } });
      });
    },
  };
}
