import { AdminError, adminErrorResponse } from './errors.js';
import { createRequestId } from './request.js';

export async function adminHandler(request, operation) {
  const requestId = createRequestId();
  try { return await operation(requestId); }
  catch (error) {
    if (!(error instanceof AdminError)) console.error('Admin request failed.', { requestId, code: 'admin_internal_error' });
    return adminErrorResponse(error, requestId);
  }
}
