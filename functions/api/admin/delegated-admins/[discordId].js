import { requireAdmin } from '../../../../server/admin/authorization.js';
import { requireAdminWriteCapability } from '../../../../server/admin/capabilities.js';
import { removeDelegatedAdmin } from '../../../../server/admin/delegated-admins.js';
import { adminJson } from '../../../../server/admin/errors.js';
import { requireMethod, requireSameOrigin, requireCsrf } from '../../../../server/admin/request.js';
import { adminHandler } from '../../../../server/admin/response.js';

export function onRequest(context) {
  const { request, env, params } = context;
  return adminHandler(request, async requestId => {
    const admin = await requireAdmin(request, env, { ownerOnly: true });
    requireMethod(request, ['DELETE']);
    requireAdminWriteCapability(env, { fullyConfigured: false });
    requireSameOrigin(request);
    await requireCsrf(request, admin.session);
    return adminJson({ ...await removeDelegatedAdmin(env, admin, requestId, params.discordId), requestId });
  });
}
