import { requireAdmin } from '../../../server/admin/authorization.js';
import { adminProviderCompleteness, requireAdminWriteCapability } from '../../../server/admin/capabilities.js';
import { adminCloudinaryProvider } from '../../../server/admin/cloudinary-provider.js';
import { adminJson } from '../../../server/admin/errors.js';
import { adminGitProvider } from '../../../server/admin/git-provider.js';
import { validateMutationRequest } from '../../../server/admin/request.js';
import { adminHandler } from '../../../server/admin/response.js';
import { createUploadJob } from '../../../server/admin/uploads.js';
import { uploadStore } from '../../../server/admin/upload-store.js';
export function onRequest(context){const {request,env}=context;return adminHandler(request,async requestId=>{const admin=await requireAdmin(request,env);const completeness=adminProviderCompleteness(context);requireAdminWriteCapability(env,{fullyConfigured:Boolean(completeness.uploads&&adminGitProvider(context)&&adminCloudinaryProvider(context)&&uploadStore(context))});const body=await validateMutationRequest(request,admin.session,{methods:['POST'],maxBytes:32768});const result=await createUploadJob(context,{admin,requestId,idempotencyKey:request.headers.get('Idempotency-Key'),body,allowRestricted:Boolean(completeness.restrictedUploads)});return adminJson(result,result.replayed?200:201);});}
