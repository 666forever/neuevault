import { requireAdmin } from '../../../server/admin/authorization.js';
import { adminProviderCompleteness, requireAdminWriteCapability } from '../../../server/admin/capabilities.js';
import { adminJson } from '../../../server/admin/errors.js';
import { validateMutationRequest } from '../../../server/admin/request.js';
import { adminHandler } from '../../../server/admin/response.js';
import { adminGitProvider } from '../../../server/admin/git-provider.js';
import { publicationStore } from '../../../server/admin/publication-store.js';
import { publishCatalogMutation } from '../../../server/admin/publication.js';

export function onRequest(context){ const {request,env}=context; return adminHandler(request,async requestId=>{ const admin=await requireAdmin(request,env); const provider=adminGitProvider(context); const store=publicationStore(context); requireAdminWriteCapability(env,{fullyConfigured:Boolean(adminProviderCompleteness(context).catalogWrites&&provider&&store)}); const body=await validateMutationRequest(request,admin.session,{maxBytes:32768}); const result=await publishCatalogMutation(context,{admin,requestId,baseCommitSha:body.baseCommitSha,idempotencyKey:request.headers.get('Idempotency-Key'),mutation:body.mutation}); return adminJson({publication:result},result.replayed?200:202); }); }
