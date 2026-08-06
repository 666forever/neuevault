import { requireAdmin } from '../../../server/admin/authorization.js';
import { verifyProductionReadiness } from '../../../server/admin/readiness.js';
import { adminJson } from '../../../server/admin/errors.js';
import { requireMethod } from '../../../server/admin/request.js';
import { adminHandler } from '../../../server/admin/response.js';

export function onRequest(context) {
  const { request, env } = context;
  return adminHandler(request, async requestId => {
    requireMethod(request, ['GET']);
    await requireAdmin(request, env, { ownerOnly: true });
    return adminJson({ ...await verifyProductionReadiness(context), requestId });
  });
}
