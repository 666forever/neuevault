import { auditInsert } from './audit.js';
import { AdminError } from './errors.js';
import { requireDeploymentVerifier } from './deployment-verifier.js';
import { publicationStore } from './publication-store.js';
import { uploadStore } from './upload-store.js';

const safe = (record, kind) => ({publicationId:kind==='publication'?record.publicationId:record.jobId,status:record.status,action:kind==='publication'?record.action:'asset.create',commitSha:record.commitSha||null,deploymentState:record.deploymentState||null,live:record.status==='live',retryable:Boolean(record.recoverable),failureCode:record.failureCode||null});
async function locate(context,id){const publications=publicationStore(context),uploads=uploadStore(context);const publication=await publications?.get?.(id);if(publication)return {kind:'publication',record:publication,publications,uploads};const upload=await uploads?.get?.(id);if(upload)return {kind:'upload',record:upload,publications,uploads};throw new AdminError(404,'publication_not_found','The publication was not found.');}
export async function getPublicationStatus(context,{admin,publicationId}){const found=await locate(context,publicationId);if(found.record.actorDiscordId!==admin.discordId)throw new AdminError(404,'publication_not_found','The publication was not found.');return safe(found.record,found.kind);}

async function persist(context,found,patch,{admin,requestId,now}) {
  const db=context.env?.ADMIN_DB;
  if(db?.batch&&!context.data?.publicationStore&&!context.data?.uploadStore){
    const statements=[];
    if(found.kind==='publication')statements.push(db.prepare('UPDATE publication_jobs SET status=?, deployment_id=?, deployed_commit_sha=?, failure_code=?, recoverable=?, updated_at=? WHERE publication_id=?').bind(patch.status,patch.deploymentId||null,patch.deployedCommitSha||null,patch.failureCode||null,Number(Boolean(patch.recoverable)),now.toISOString(),found.record.publicationId));
    statements.push(db.prepare(`UPDATE upload_jobs SET status=?, failure_code=?, recoverable=?, updated_at=? WHERE ${found.kind==='upload'?'job_id':'catalog_commit_sha'}=? AND status='deployment_pending'`).bind(patch.status,patch.failureCode||null,Number(Boolean(patch.recoverable)),now.toISOString(),found.kind==='upload'?found.record.jobId:found.record.commitSha));
    statements.push(auditInsert(db,{actorDiscordId:admin.discordId,actorRole:admin.role,action:`publication.verify.${patch.status}`,targetType:'publication',targetId:found.kind==='publication'?found.record.publicationId:found.record.jobId,outcome:patch.status==='live'?'success':'failed',diagnosticCode:patch.failureCode||null,requestId,publicationCommitSha:found.record.commitSha},now));
    await db.batch(statements);return {...found.record,...patch,updatedAt:now.toISOString()};
  }
  const updated=found.kind==='publication'?await found.publications.update(found.record.publicationId,{...patch,updatedAt:now.toISOString()}):await found.uploads.update(found.record.jobId,{...patch,updatedAt:now.toISOString()});
  if(found.kind==='publication'){const related=await found.uploads?.findByCommit?.(found.record.commitSha);if(related?.status==='deployment_pending')await found.uploads.update(related.jobId,{status:patch.status,failureCode:patch.failureCode||null,recoverable:patch.recoverable,updatedAt:now.toISOString()});}
  await (found.kind==='publication'?found.publications:found.uploads).audit?.({actorDiscordId:admin.discordId,actorRole:admin.role,action:`publication.verify.${patch.status}`,targetType:'publication',targetId:found.kind==='publication'?found.record.publicationId:found.record.jobId,outcome:patch.status==='live'?'success':'failed',diagnosticCode:patch.failureCode||null,requestId,publicationCommitSha:found.record.commitSha},now);
  return updated;
}

export async function verifyPublicationDeployment(context,{admin,publicationId,requestId,now=new Date()}){
  const found=await locate(context,publicationId);const record=found.record;
  if(record.actorDiscordId!==admin.discordId)throw new AdminError(404,'publication_not_found','The publication was not found.');
  if(record.status==='live')return safe(record,found.kind);
  if(record.status!=='deployment_pending'||!record.commitSha||!record.catalogDigest)throw new AdminError(409,'publication_not_verifiable','The publication is not ready for deployment verification.');
  const result=await requireDeploymentVerifier(context).verify({commitSha:record.commitSha,catalogDigest:record.catalogDigest});
  if(result.state==='pending')return {...safe({...record,deploymentState:result.deploymentState},found.kind),failureCode:result.failureCode||null};
  if(result.state==='failed'){const updated=await persist(context,found,{status:'failed',failureCode:result.failureCode||'deployment_failed',recoverable:true,deploymentId:result.deploymentId||null},{admin,requestId,now});return safe(updated,found.kind);}
  if(result.state!=='live'||result.deployedCommitSha&&result.deployedCommitSha!==record.commitSha)throw new AdminError(503,'deployment_verification_invalid','Deployment verification returned an invalid result.');
  const updated=await persist(context,found,{status:'live',failureCode:null,recoverable:false,deploymentId:result.deploymentId||null,deployedCommitSha:record.commitSha},{admin,requestId,now});return safe(updated,found.kind);
}
