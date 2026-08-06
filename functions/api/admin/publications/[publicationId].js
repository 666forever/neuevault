import { requireAdmin } from '../../../../server/admin/authorization.js';
import { adminJson } from '../../../../server/admin/errors.js';
import { getPublicationStatus } from '../../../../server/admin/deployment-verification.js';
import { requireMethod } from '../../../../server/admin/request.js';
import { adminHandler } from '../../../../server/admin/response.js';
export function onRequest(context){const {request,env,params}=context;return adminHandler(request,async()=>{requireMethod(request,['GET']);const admin=await requireAdmin(request,env);return adminJson({publication:await getPublicationStatus(context,{admin,publicationId:params.publicationId})});});}
