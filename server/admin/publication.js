import { randomToken } from '../crypto.js';
import { compileCatalog, CatalogCompileError } from '../catalog/compiler.js';
import { reconstructHostedAssetFacts } from '../catalog/hosted-adapter.js';
import { applyCatalogMutation, normalizeCatalogMutation } from '../catalog/mutations.js';
import { AdminError } from './errors.js';
import { CANONICAL_PATHS, GENERATED_PATHS, requireGitProvider, validCommitSha } from './git-provider.js';
import { requirePublicationStore } from './publication-store.js';

const encoder=new TextEncoder();
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])) : value;
const stable = value => JSON.stringify(canonical(value));
const json = value => `${JSON.stringify(value,null,2)}\n`;
const hex = bytes => [...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256',encoder.encode(typeof value==='string'?value:stable(value))));
const safeKey = value => typeof value==='string' && /^[A-Za-z0-9._:-]{8,128}$/.test(value);

function compileSnapshot(snapshot, mutation) {
  const current={ assets:snapshot.assetsFile.assets, categories:snapshot.categoriesFile.categories, collections:snapshot.collectionsFile.collections };
  const next=applyCatalogMutation(current,mutation); const resolvedAssets=reconstructHostedAssetFacts(next.assets,snapshot.generated.assets);
  const compiled=compileCatalog({ assets:next.assets,categories:next.categories,collections:next.collections,resolvedAssets });
  return { next,compiled };
}

export async function publishCatalogMutation(context,{ admin,requestId,baseCommitSha,idempotencyKey,mutation,now=new Date() }) {
  if (!validCommitSha(baseCommitSha)) throw new AdminError(400,'catalog_base_invalid','A valid catalog base is required.');
  if (!safeKey(idempotencyKey)) throw new AdminError(400,'idempotency_key_invalid','A valid idempotency key is required.');
  let normalized; try { normalized=normalizeCatalogMutation(mutation); } catch(error){ if(error instanceof CatalogCompileError) throw new AdminError(400,error.errors[0].code,error.errors[0].message); throw error; }
  const provider=requireGitProvider(context); const store=requirePublicationStore(context); const mutationHash=await digest({baseCommitSha,mutation:normalized}); const prior=await store.find(admin.discordId,idempotencyKey);
  if(prior){ if(prior.mutationHash!==mutationHash) throw new AdminError(409,'idempotency_key_reused','This idempotency key was already used for another change.'); return { ...prior,replayed:true }; }
  const publicationId=randomToken(18); const createdAt=now.toISOString(); const job={publicationId,actorDiscordId:admin.discordId,action:normalized.type,baseCommitSha,mutationHash,mutation:normalized,idempotencyKey,status:'validating',createdAt}; await store.create(job);
  try {
    if(await provider.readHead()!==baseCommitSha){ await store.update(publicationId,{status:'conflict',failureCode:'catalog_conflict',recoverable:true,updatedAt:createdAt}); throw new AdminError(409,'catalog_conflict','Another catalog change was published first.'); }
    const snapshot=await provider.readSnapshot(baseCommitSha); const {next,compiled}=compileSnapshot(snapshot,normalized); const catalogDigest=await digest({assets:compiled.assets,categories:compiled.categories,collections:compiled.collections});
    const files=[
      {path:CANONICAL_PATHS.assets,content:json({version:1,assets:next.assets})},{path:CANONICAL_PATHS.categories,content:json({version:1,categories:next.categories})},{path:CANONICAL_PATHS.collections,content:json({version:1,collections:next.collections})},
      {path:GENERATED_PATHS.assets,content:json(compiled.assets)},{path:GENERATED_PATHS.categories,content:json(compiled.categories)},{path:GENERATED_PATHS.collections,content:json(compiled.collections)},{path:GENERATED_PATHS.version,content:json({version:1,catalogDigest})},
    ];
    await store.update(publicationId,{status:'catalog_commit_pending',catalogDigest,recoverable:true,updatedAt:createdAt}); const result=await provider.createCommit({baseSha:baseCommitSha,files,message:`catalog: ${normalized.type} ${next.targetId}`});
    await store.update(publicationId,{status:'commit_created',commitSha:result.commitSha,catalogDigest,recoverable:true,updatedAt:createdAt}); const final=await store.update(publicationId,{status:'deployment_pending',commitSha:result.commitSha,catalogDigest,recoverable:true,updatedAt:createdAt}); await store.audit?.({actorDiscordId:admin.discordId,actorRole:admin.role,action:normalized.type,targetType:normalized.type.split('.')[0],targetId:next.targetId,outcome:'success',requestId,publicationCommitSha:result.commitSha},now); await store.audit?.({actorDiscordId:admin.discordId,actorRole:admin.role,action:'publication.commit',targetType:'publication',targetId:publicationId,outcome:'success',requestId,publicationCommitSha:result.commitSha},now); return {...final,publicationId,catalogDigest,replayed:false};
  } catch(error){ if(error instanceof AdminError){ if(error.code==='catalog_conflict'){ await store.update(publicationId,{status:'conflict',failureCode:error.code,recoverable:true,updatedAt:createdAt}); await store.audit?.({actorDiscordId:admin.discordId,actorRole:admin.role,action:'publication.conflict',targetType:'publication',targetId:publicationId,outcome:'rejected',diagnosticCode:'catalog_conflict',requestId},now); } throw error; } await store.update(publicationId,{status:'failed',failureCode:'publication_failed',recoverable:true,updatedAt:createdAt}); throw new AdminError(503,'publication_failed','The catalog change could not be published.'); }
}
