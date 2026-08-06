import { requireAdmin } from '../../../../../server/admin/authorization.js';
import { deploymentVerifier } from '../../../../../server/admin/deployment-verifier.js';
import { adminJson } from '../../../../../server/admin/errors.js';
import { verifyPublicationDeployment } from '../../../../../server/admin/deployment-verification.js';
import { validateMutationRequest } from '../../../../../server/admin/request.js';
import { adminHandler } from '../../../../../server/admin/response.js';
export function onRequest(context){const {request,env,params}=context;return adminHandler(request,async requestId=>{const admin=await requireAdmin(request,env);await validateMutationRequest(request,admin.session,{methods:['POST'],maxBytes:1024});if(!deploymentVerifier(context))return adminJson({error:'Deployment verification is unavailable.',code:'deployment_verifier_unavailable',requestId},503);const publication=await verifyPublicationDeployment(context,{admin,publicationId:params.publicationId,requestId});return adminJson({publication},publication.live?200:202);});}
