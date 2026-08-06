import { requireAdmin } from '../../../server/admin/authorization.js';
import { readAdminCatalog } from '../../../server/admin/catalog-provider.js';
import { adminJson } from '../../../server/admin/errors.js';
import { requireMethod } from '../../../server/admin/request.js';
import { adminHandler } from '../../../server/admin/response.js';

export function onRequest(context) {
  const { request, env } = context;
  return adminHandler(request, async requestId => {
    requireMethod(request, ['GET']);
    await requireAdmin(request, env);
    return adminJson({ ...await readAdminCatalog(context), requestId });
  });
}
