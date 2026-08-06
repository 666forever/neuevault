import { randomToken } from '../crypto.js';
import { compileCatalog } from '../catalog/compiler.js';
import { reconstructHostedAssetFacts } from '../catalog/hosted-adapter.js';
import { AdminError } from './errors.js';
import { CANONICAL_PATHS, GENERATED_PATHS, requireGitProvider, validCommitSha } from './git-provider.js';
import { publicIdFor, providerSupportsRestrictedUploads, requireCloudinaryProvider, restrictedOriginalPublicIdFor, restrictedPreviewPublicIdFor, UPLOAD_LIMITS } from './cloudinary-provider.js';
import { requireUploadStore } from './upload-store.js';

const encoder=new TextEncoder();
const json=value=>`${JSON.stringify(value,null,2)}\n`;
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const stable=value=>JSON.stringify(canonical(value));
const hex=bytes=>[...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('');
const digest=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(typeof value==='string'?value:stable(value))));
const safeKey=value=>typeof value==='string'&&/^[A-Za-z0-9._:-]{8,128}$/.test(value);
const categories=new Set(['Icons','Banners','Animated','Wallpapers']);
const cleanText=(value,max=120)=>String(value||'').trim().replace(/[\u0000-\u001f]/g,'').slice(0,max);
const cleanTags=value=>Array.isArray(value)?[...new Set(value.map(item=>cleanText(item,40).toLowerCase()).filter(Boolean))].slice(0,30):[];
const mimeFor=format=>format==='jpg'||format==='jpeg'?'image/jpeg':`image/${format}`;
const fileTypeFor=format=>format==='jpg'||format==='jpeg'?'JPG':format.toUpperCase();

function validateRequest(body,snapshot,{allowRestricted=false}={}){
  if(!validCommitSha(body?.baseCommitSha))throw new AdminError(400,'catalog_base_invalid','A valid catalog base is required.');
  if(!categories.has(body.category))throw new AdminError(400,'upload_category_invalid','Choose a valid category.');
  const restricted=body.requiresDiscordAuth===true;
  if(restricted&&!allowRestricted)throw new AdminError(400,'restricted_upload_disabled','Restricted uploads are not available.');
  const collections=Array.isArray(body.collectionSlugs)?[...new Set(body.collectionSlugs.map(String))]:[];
  const known=new Set(snapshot.collectionsFile.collections.map(value=>value.slug));
  if(collections.some(value=>!known.has(value)))throw new AdminError(400,'upload_collection_invalid','A selected collection is no longer available.');
  const declared=body.declaredFile||{};
  const format=String(declared.format||'').toLowerCase().replace(/^image\//,'');
  if(!UPLOAD_LIMITS.formats.includes(format))throw new AdminError(400,'upload_format_unsupported','Choose a JPEG, PNG, GIF, or WebP image.');
  if(Number(declared.bytes)>UPLOAD_LIMITS.bytes)throw new AdminError(413,'upload_file_too_large','The image exceeds the 25 MiB limit.');
  return {baseCommitSha:body.baseCommitSha,category:body.category,title:cleanText(body.title||body.logicalSourceFilename?.replace(/\.[^.]+$/,''),160)||'Untitled asset',tags:cleanTags(body.tags),collectionSlugs:collections,requiresDiscordAuth:restricted,declaredFile:{format,bytes:Number(declared.bytes)||null,name:cleanText(body.logicalSourceFilename||declared.name,180)}};
}
function allocateId(snapshot,reserved){const ids=[...snapshot.assetsFile.assets.map(value=>value.id),...reserved];let max=0;for(const id of ids){const match=/^nv-(\d+)$/.exec(id);if(match)max=Math.max(max,Number(match[1]));}return `nv-${String(max+1).padStart(3,'0')}`;}
function safeJob(job){return {jobId:job.jobId,assetId:job.proposedAssetId,status:job.status,stage:job.mutation?.stage||job.status,requiresDiscordAuth:Boolean(job.mutation?.requiresDiscordAuth),expiresAt:job.expiresAt,recoverable:Boolean(job.recoverable),failureCode:job.failureCode||null,commitSha:job.commitSha||null};}

export async function createUploadJob(context,{admin,requestId,idempotencyKey,body,allowRestricted=false,now=new Date()}){
  if(!safeKey(idempotencyKey))throw new AdminError(400,'idempotency_key_invalid','A valid idempotency key is required.');
  const git=requireGitProvider(context),cloudinary=requireCloudinaryProvider(context),store=requireUploadStore(context);
  const requestHash=await digest(body),prior=await store.find(admin.discordId,idempotencyKey);
  if(prior){
    if(prior.requestHash!==requestHash)throw new AdminError(409,'idempotency_key_reused','This idempotency key was already used for another upload.');
    if(new Date(prior.expiresAt)<=now)throw new AdminError(410,'upload_job_expired','The upload authorization expired.');
    const authorization=prior.authorization||await cloudinary.createUploadAuthorization({jobId:prior.jobId,assetId:prior.proposedAssetId,publicId:prior.publicId,requiresDiscordAuth:Boolean(prior.mutation?.requiresDiscordAuth),timestamp:Math.floor(new Date(prior.createdAt).getTime()/1000),expiresAt:prior.expiresAt});
    return {job:safeJob(prior),authorization:{...authorization,expectedPublicId:prior.publicId},replayed:true};
  }
  if(await git.readHead()!==body.baseCommitSha)throw new AdminError(409,'catalog_conflict','The catalog changed before the upload began.');
  const snapshot=await git.readSnapshot(body.baseCommitSha),mutation=validateRequest(body,snapshot,{allowRestricted});
  if(mutation.requiresDiscordAuth&&!providerSupportsRestrictedUploads(cloudinary))throw new AdminError(503,'restricted_upload_disabled','Restricted uploads are unavailable.');
  const proposedAssetId=allocateId(snapshot,await store.activeAssetIds());
  const publicId=mutation.requiresDiscordAuth?restrictedOriginalPublicIdFor(mutation.category,proposedAssetId):publicIdFor(mutation.category,proposedAssetId);
  const previewPublicId=mutation.requiresDiscordAuth?restrictedPreviewPublicIdFor(mutation.category,proposedAssetId):null;
  const expires=new Date(now.getTime()+UPLOAD_LIMITS.authorizationSeconds*1000),timestamp=Math.floor(now.getTime()/1000),jobId=randomToken(18);
  const authorization=await cloudinary.createUploadAuthorization({jobId,assetId:proposedAssetId,publicId,requiresDiscordAuth:mutation.requiresDiscordAuth,timestamp,expiresAt:expires.toISOString()});
  const storedMutation={...mutation,...(previewPublicId?{previewPublicId}:{}),stage:'uploading_original'};
  const job={jobId,actorDiscordId:admin.discordId,proposedAssetId,baseCommitSha:body.baseCommitSha,publicId,status:'created',mutation:storedMutation,mutationHash:await digest(storedMutation),idempotencyKey,requestHash,authorization,createdAt:now.toISOString(),updatedAt:now.toISOString(),expiresAt:expires.toISOString(),recoverable:false,cleanupState:'not_eligible'};
  await store.create(job);
  await store.audit?.({actorDiscordId:admin.discordId,actorRole:admin.role,action:'upload.create',targetType:'upload',targetId:job.jobId,outcome:'success',requestId},now);
  return {job:safeJob(job),authorization:{...authorization,expectedPublicId:publicId},replayed:false};
}
export async function getUploadJob(context,{admin,jobId}){const job=await requireUploadStore(context).get(jobId);if(!job||job.actorDiscordId!==admin.discordId)throw new AdminError(404,'upload_job_not_found','The upload job was not found.');return safeJob(job);}

function validateOriginal(resource,job){
  if(!resource||typeof resource!=='object')throw new AdminError(422,'upload_verification_failed','The uploaded image could not be verified.');
  if(resource.publicId!==job.publicId)throw new AdminError(422,'upload_public_id_mismatch','The uploaded image identity did not match the job.');
  const restricted=Boolean(job.mutation.requiresDiscordAuth),expectedType=restricted?'authenticated':'upload';
  if(resource.resourceType!=='image'||resource.deliveryType!==expectedType)throw new AdminError(422,'upload_delivery_invalid','The uploaded resource delivery type is invalid.');
  const format=String(resource.format||'').toLowerCase();
  if(!UPLOAD_LIMITS.formats.includes(format))throw new AdminError(422,'upload_format_unsupported','The uploaded image format is unsupported.');
  for(const [key,limit,code] of [['bytes',UPLOAD_LIMITS.bytes,'upload_file_too_large'],['width',UPLOAD_LIMITS.width,'upload_width_exceeded'],['height',UPLOAD_LIMITS.height,'upload_height_exceeded']])if(!Number.isFinite(Number(resource[key]))||Number(resource[key])<=0||Number(resource[key])>limit)throw new AdminError(422,code,'The uploaded image exceeds an allowed limit.');
  if(Number(resource.width)*Number(resource.height)>UPLOAD_LIMITS.pixels)throw new AdminError(422,'upload_pixels_exceeded','The uploaded image exceeds the 100 megapixel limit.');
  if(!Number.isInteger(Number(resource.version))||!resource.assetId||(!restricted&&!/^https:\/\//.test(resource.secureUrl||'')))throw new AdminError(422,'upload_verification_failed','The uploaded image could not be verified.');
  return {assetId:String(resource.assetId),publicId:resource.publicId,version:Number(resource.version),resourceType:'image',deliveryType:expectedType,format,bytes:Number(resource.bytes),width:Number(resource.width),height:Number(resource.height),pages:Number(resource.pages||1),animated:Boolean(resource.animated)||Number(resource.pages||1)>1,...(!restricted?{secureUrl:resource.secureUrl}:{}),createdAt:resource.createdAt};
}
function validatePreview(resource,job,original){
  if(!resource||resource.publicId!==job.mutation.previewPublicId)throw new AdminError(422,'restricted_preview_identity_invalid','The restricted preview identity is invalid.');
  if(resource.resourceType!=='image'||resource.deliveryType!=='upload')throw new AdminError(422,'restricted_preview_delivery_invalid','The restricted preview delivery is invalid.');
  if(resource.publicId===original.publicId||String(resource.assetId||'')===original.assetId)throw new AdminError(422,'restricted_preview_identity_collision','The restricted preview identity is not independent.');
  const format=String(resource.format||'').toLowerCase();
  if(!['jpg','jpeg','png'].includes(format)||!resource.assetId||!Number.isInteger(Number(resource.version))||!/^https:\/\//.test(resource.secureUrl||''))throw new AdminError(422,'restricted_preview_verification_failed','The restricted preview could not be verified.');
  const width=Number(resource.width),height=Number(resource.height),pages=Number(resource.pages||1);
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>1200||height>1200)throw new AdminError(422,'restricted_preview_dimensions_invalid','The restricted preview dimensions are invalid.');
  if(Boolean(resource.animated)||pages!==1)throw new AdminError(422,'restricted_preview_animated','The restricted preview must be static.');
  const sourceRatio=original.width/original.height,previewRatio=width/height;
  if(Math.abs(sourceRatio-previewRatio)/sourceRatio>.02)throw new AdminError(422,'restricted_preview_aspect_invalid','The restricted preview aspect ratio is invalid.');
  return {assetId:String(resource.assetId),publicId:resource.publicId,version:Number(resource.version),resourceType:'image',deliveryType:'upload',format,bytes:Number(resource.bytes),width,height,pages:1,animated:false,secureUrl:resource.secureUrl,createdAt:resource.createdAt};
}

async function deliveryFacts(job,original,preview=null){
  const restricted=Boolean(job.mutation.requiresDiscordAuth),sourceFile=`${job.mutation.category.toLowerCase()}/${job.proposedAssetId}.${original.format==='jpeg'?'jpg':original.format}`;
  const sourceHash=await digest({provider:'cloudinary',assetId:original.assetId,publicId:original.publicId,version:original.version,bytes:original.bytes,width:original.width,height:original.height,format:original.format});
  const uploadDate=String(original.createdAt||new Date().toISOString()).slice(0,10);
  let previewBase,generatedFields,sync;
  if(restricted){
    previewBase=preview.secureUrl.replace(`/v${preview.version}/`,`/f_auto,q_auto,w_1200,c_limit/v${preview.version}/`);
    generatedFields={previewUrl:previewBase,previewSources:[320,640,960,1200].map(width=>({width,url:preview.secureUrl.replace(`/v${preview.version}/`,`/f_auto,q_auto,w_${width},c_limit/v${preview.version}/`)})),downloadUrl:null,cloudinaryDeliveryType:'authenticated',originalDelivery:{resourceType:'image',deliveryType:'authenticated'}};
    sync={sourceHash,original:{assetId:original.assetId,publicId:original.publicId,version:original.version,format:original.format,bytes:original.bytes,width:original.width,height:original.height,resourceType:'image',deliveryType:'authenticated'},preview:{assetId:preview.assetId,publicId:preview.publicId,version:preview.version,format:preview.format,bytes:preview.bytes,width:preview.width,height:preview.height,resourceType:'image',deliveryType:'upload',secureUrl:preview.secureUrl}};
  }else{
    const transform=original.animated?'pg_1,f_auto,q_auto':'f_auto,q_auto';previewBase=original.secureUrl.replace(`/v${original.version}/`,`/${transform},w_1200,c_limit/v${original.version}/`);
    generatedFields={previewUrl:previewBase,previewSources:[320,640,960,1200].map(width=>({width,url:original.secureUrl.replace(`/v${original.version}/`,`/${transform},w_${width},c_limit/v${original.version}/`)})),downloadUrl:original.secureUrl.replace(`/v${original.version}/`,`/fl_attachment:${job.proposedAssetId}/v${original.version}/`),cloudinaryAssetId:original.assetId,cloudinaryPublicId:original.publicId,cloudinaryVersion:original.version,cloudinaryDeliveryType:'upload',originalDelivery:{url:original.secureUrl,resourceType:'image',deliveryType:'upload'}};
    sync={sourceHash,original:{assetId:original.assetId,publicId:original.publicId,version:original.version,format:original.format,bytes:original.bytes,width:original.width,height:original.height,resourceType:'image',deliveryType:'upload',secureUrl:original.secureUrl}};
  }
  return {authored:{id:job.proposedAssetId,sourceFile,title:job.mutation.title,category:job.mutation.category,collectionSlugs:job.mutation.collectionSlugs,tags:job.mutation.tags,uploadDate,requiresDiscordAuth:restricted,animated:original.animated,sourceHash},resolved:{sourceOrder:Number.MAX_SAFE_INTEGER,sourceFile,sourceHash,id:job.proposedAssetId,title:job.mutation.title,category:job.mutation.category,width:original.width,height:original.height,aspectRatio:Number((original.width/original.height).toFixed(6)),fileType:fileTypeFor(original.format),mimeType:mimeFor(original.format),fileSize:original.bytes,uploadDate,animated:original.animated,previewFile:previewBase,publicSource:restricted?null:original.secureUrl,generatedFields},sync};
}

async function publishVerified(context,job,now){
  const git=requireGitProvider(context),store=requireUploadStore(context),head=await git.readHead();
  if(head!==job.baseCommitSha){await store.update(job.jobId,{status:'publication_pending',failureCode:'catalog_conflict',recoverable:true,updatedAt:now.toISOString()});throw new AdminError(409,'catalog_conflict','The catalog changed while the media was uploaded. Refresh and retry publication.');}
  const snapshot=await git.readSnapshot(head),facts=job.mutation.verifiedFacts;
  if(!facts)throw new AdminError(409,'upload_state_invalid','The verified upload facts are unavailable.');
  const assets=[...snapshot.assetsFile.assets,facts.authored],resolved=[...reconstructHostedAssetFacts(snapshot.assetsFile.assets,snapshot.generated.assets),facts.resolved];
  const compiled=compileCatalog({assets,categories:snapshot.categoriesFile.categories,collections:snapshot.collectionsFile.collections,resolvedAssets:resolved});
  const cloudinary={...(snapshot.cloudinarySync||{version:1,assets:{}}),assets:{...(snapshot.cloudinarySync?.assets||{}),[job.proposedAssetId]:facts.sync}};
  const catalogDigest=await digest({assets:compiled.assets,categories:compiled.categories,collections:compiled.collections});
  const files=[{path:CANONICAL_PATHS.assets,content:json({version:1,assets})},{path:CANONICAL_PATHS.categories,content:json(snapshot.categoriesFile)},{path:CANONICAL_PATHS.collections,content:json(snapshot.collectionsFile)},{path:CANONICAL_PATHS.cloudinary,content:json(cloudinary)},{path:GENERATED_PATHS.assets,content:json(compiled.assets)},{path:GENERATED_PATHS.categories,content:json(compiled.categories)},{path:GENERATED_PATHS.collections,content:json(compiled.collections)},{path:GENERATED_PATHS.version,content:json({version:1,catalogDigest})}];
  await store.update(job.jobId,{status:'publication_pending',mutation:{...job.mutation,stage:'publishing'},catalogDigest,recoverable:true,updatedAt:now.toISOString()});
  const result=await git.createCommit({baseSha:head,files,message:`catalog: asset.create ${job.proposedAssetId}`});
  await store.update(job.jobId,{status:'commit_created',commitSha:result.commitSha,catalogDigest,recoverable:true,updatedAt:now.toISOString()});
  return store.update(job.jobId,{status:'deployment_pending',mutation:{...job.mutation,stage:'deployment_pending'},commitSha:result.commitSha,catalogDigest,recoverable:true,updatedAt:now.toISOString()});
}

export async function finalizeUploadJob(context,{admin,requestId,jobId,idempotencyKey,body,now=new Date()}){
  if(!safeKey(idempotencyKey))throw new AdminError(400,'idempotency_key_invalid','A valid idempotency key is required.');
  const store=requireUploadStore(context);let job=await store.get(jobId);
  if(!job||job.actorDiscordId!==admin.discordId)throw new AdminError(404,'upload_job_not_found','The upload job was not found.');
  const finalizeHash=await digest(body);
  if(job.finalizeKey){if(job.finalizeKey!==idempotencyKey||job.finalizeHash!==finalizeHash)throw new AdminError(409,'idempotency_key_reused','This finalization key was already used differently.');return {...safeJob(job),replayed:true};}
  if(new Date(job.expiresAt)<=now)throw new AdminError(410,'upload_job_expired','The upload authorization expired.');
  if(job.status==='created')job=await store.update(jobId,{status:'uploaded',mutation:{...job.mutation,stage:'verifying_original'},updatedAt:now.toISOString()});
  if(job.status!=='uploaded')throw new AdminError(409,'upload_state_invalid','The upload is not ready for verification.');
  job=await store.update(jobId,{status:'verifying',finalizeKey:idempotencyKey,finalizeHash,mutation:{...job.mutation,stage:'verifying_original'},updatedAt:now.toISOString()});
  try{
    const provider=requireCloudinaryProvider(context),restricted=Boolean(job.mutation.requiresDiscordAuth);
    const original=validateOriginal(await provider.verifyResource({publicId:job.publicId,version:Number(body?.version)||null,deliveryType:restricted?'authenticated':'upload'}),job);
    job=await store.update(jobId,{mutation:{...job.mutation,stage:restricted?'creating_preview':'publishing',verifiedOriginal:original},cloudinaryAssetId:original.assetId,version:original.version,resourceType:original.resourceType,deliveryType:original.deliveryType,format:original.format,bytes:original.bytes,width:original.width,height:original.height,animated:original.animated,recoverable:restricted,cleanupState:restricted?'not_eligible':'cleanup_eligible',updatedAt:now.toISOString()});
    let preview=null;
    if(restricted){
      await provider.createRestrictedPreview({original,previewPublicId:job.mutation.previewPublicId});
      job=await store.update(jobId,{mutation:{...job.mutation,stage:'verifying_preview'},updatedAt:now.toISOString()});
      preview=validatePreview(await provider.verifyResource({publicId:job.mutation.previewPublicId,deliveryType:'upload'}),job,original);
    }
    const facts=await deliveryFacts(job,original,preview);
    job=await store.update(jobId,{status:'verified',mutation:{...job.mutation,stage:'publishing',verifiedFacts:facts},recoverable:true,cleanupState:'not_eligible',updatedAt:now.toISOString()});
    job=await publishVerified(context,job,now);
    await store.audit?.({actorDiscordId:admin.discordId,actorRole:admin.role,action:'asset.create',targetType:'asset',targetId:job.proposedAssetId,outcome:'success',requestId,publicationCommitSha:job.commitSha},now);
    return {...safeJob(job),replayed:false};
  }catch(error){
    if(error instanceof AdminError&&error.code==='catalog_conflict')throw error;
    const mediaAccepted=Boolean(job.mutation?.verifiedOriginal),publicationAccepted=Boolean(job.mutation?.verifiedFacts)||['verified','publication_pending','commit_created'].includes(job.status);
    const code=error instanceof AdminError?error.code:(publicationAccepted?'publication_failed':mediaAccepted?'restricted_preview_unavailable':'upload_verification_failed');
    await store.update(jobId,{status:'failed',failureCode:code,sanitizedFailure:publicationAccepted?'The verified asset could not be published.':mediaAccepted?'The restricted preview could not be completed.':'The uploaded image could not be verified.',recoverable:mediaAccepted||publicationAccepted,cleanupState:mediaAccepted||publicationAccepted?'not_eligible':'cleanup_eligible',updatedAt:now.toISOString()});
    if(error instanceof AdminError)throw error;
    throw new AdminError(503,code,mediaAccepted?'The restricted preview could not be completed.':publicationAccepted?'The verified asset could not be published.':'The uploaded image could not be verified.');
  }
}

export async function retryUploadPublication(context,{admin,requestId,jobId,baseCommitSha,idempotencyKey,now=new Date()}){
  if(!safeKey(idempotencyKey))throw new AdminError(400,'idempotency_key_invalid','A valid idempotency key is required.');
  const store=requireUploadStore(context);let job=await store.get(jobId);
  if(!job||job.actorDiscordId!==admin.discordId)throw new AdminError(404,'upload_job_not_found','The upload job was not found.');
  const retryHash=await digest({baseCommitSha});
  if(job.retryKey){if(job.retryKey!==idempotencyKey||job.retryHash!==retryHash)throw new AdminError(409,'idempotency_key_reused','This retry key was already used differently.');return {...safeJob(job),replayed:true};}
  if(job.status==='deployment_pending')return {...safeJob(job),replayed:true};
  if(!job.recoverable||!job.mutation?.verifiedFacts)throw new AdminError(409,'upload_state_invalid','This upload cannot be retried.');
  if(!validCommitSha(baseCommitSha))throw new AdminError(400,'catalog_base_invalid','A valid catalog base is required.');
  const snapshot=await requireGitProvider(context).readSnapshot(baseCommitSha);
  if(job.mutation.collectionSlugs.some(slug=>!snapshot.collectionsFile.collections.some(value=>value.slug===slug)))throw new AdminError(409,'upload_references_changed','A selected collection changed while the image was uploaded.');
  job=await store.update(jobId,{status:'publication_pending',baseCommitSha,retryKey:idempotencyKey,retryHash,failureCode:null,recoverable:true,mutation:{...job.mutation,stage:'publishing'},updatedAt:now.toISOString()});
  job=await publishVerified(context,job,now);
  await store.audit?.({actorDiscordId:admin.discordId,actorRole:admin.role,action:'asset.create.retry',targetType:'asset',targetId:job.proposedAssetId,outcome:'success',requestId,publicationCommitSha:job.commitSha},now);
  return {...safeJob(job),replayed:false};
}
