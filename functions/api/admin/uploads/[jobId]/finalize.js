import { requireAdmin } from '../../../../../server/admin/authorization.js';
import { adminProviderCompleteness, requireAdminWriteCapability } from '../../../../../server/admin/capabilities.js';
import { adminCloudinaryProvider } from '../../../../../server/admin/cloudinary-provider.js';
import { adminJson } from '../../../../../server/admin/errors.js';
import { adminGitProvider } from '../../../../../server/admin/git-provider.js';
import { validateMutationRequest } from '../../../../../server/admin/request.js';
import { adminHandler } from '../../../../../server/admin/response.js';
import { finalizeUploadJob } from '../../../../../server/admin/uploads.js';
import { uploadStore } from '../../../../../server/admin/upload-store.js';
export function onRequest(context){const {request,env,params}=context;return adminHandler(request,async requestId=>{const admin=await requireAdmin(request,env);requireAdminWriteCapability(env,{fullyConfigured:Boolean(adminProviderCompleteness(context).uploads&&adminGitProvider(context)&&adminCloudinaryProvider(context)&&uploadStore(context))});const body=await validateMutationRequest(request,admin.session,{methods:['POST'],maxBytes:8192});const job=await finalizeUploadJob(context,{admin,requestId,jobId:params.jobId,idempotencyKey:request.headers.get('Idempotency-Key'),body});return adminJson({job},job.replayed?200:202);});}
