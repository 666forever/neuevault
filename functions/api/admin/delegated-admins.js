import { requireAdmin } from '../../../server/admin/authorization.js';
import { requireAdminWriteCapability } from '../../../server/admin/capabilities.js';
import { addDelegatedAdmin, listDelegatedAdmins } from '../../../server/admin/delegated-admins.js';
import { adminJson } from '../../../server/admin/errors.js';
import { requireMethod, validateMutationRequest } from '../../../server/admin/request.js';
import { adminHandler } from '../../../server/admin/response.js';

export function onRequest(context) {
  const { request, env } = context;
  return adminHandler(request, async requestId => {
    const admin = await requireAdmin(request, env, { ownerOnly: true });
    if (request.method === 'GET') {
      requireMethod(request, ['GET']);
      return adminJson({ ...await listDelegatedAdmins(env, admin, requestId), requestId });
    }
    requireMethod(request, ['POST']);
    requireAdminWriteCapability(env, { fullyConfigured: false });
    const body = await validateMutationRequest(request, admin.session, { methods: ['POST'], maxBytes: 1024 });
    return adminJson({ delegatedAdmin: await addDelegatedAdmin(env, admin, requestId, body?.discordId), requestId }, 201);
  });
}
