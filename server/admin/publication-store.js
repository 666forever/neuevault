import { AdminError } from './errors.js';
import { writeAuditEvent } from './audit.js';

export function publicationStore({ env = {}, data = {} } = {}) {
  if (data.publicationStore) return data.publicationStore;
  const db = env.ADMIN_DB; if (!db?.prepare) return null;
  return {
    async find(actorDiscordId, idempotencyKey) { return rowToPublication(await db.prepare('SELECT * FROM publication_jobs WHERE actor_discord_id = ? AND idempotency_key = ? LIMIT 1').bind(actorDiscordId,idempotencyKey).first()); },
    async get(publicationId) { return rowToPublication(await db.prepare('SELECT * FROM publication_jobs WHERE publication_id = ? LIMIT 1').bind(publicationId).first()); },
    async create(value) { await db.prepare('INSERT INTO publication_jobs (publication_id, actor_discord_id, action, base_commit_sha, mutation_sha256, mutation_json, idempotency_key, status, recoverable, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)').bind(value.publicationId,value.actorDiscordId,value.action,value.baseCommitSha,value.mutationHash,JSON.stringify(value.mutation),value.idempotencyKey,value.status,value.createdAt,value.createdAt).run(); return value; },
    async update(publicationId, patch) { const current=await this.get(publicationId);if(!current)throw new AdminError(404,'publication_not_found','The publication was not found.');const next={...current,...patch};await db.prepare('UPDATE publication_jobs SET status = ?, commit_sha = ?, catalog_digest = ?, deployment_id = ?, deployed_commit_sha = ?, failure_code = ?, recoverable = ?, updated_at = ? WHERE publication_id = ?').bind(next.status,next.commitSha||null,next.catalogDigest||null,next.deploymentId||null,next.deployedCommitSha||null,next.failureCode||null,next.recoverable?1:0,next.updatedAt,publicationId).run(); return next; },
    async audit(event,now){ await writeAuditEvent(db,event,now); },
  };
}

export function requirePublicationStore(context) { const store=publicationStore(context); if (!store) throw new AdminError(503,'admin_database_unavailable','Administration is temporarily unavailable.'); return store; }

export function createMemoryPublicationStore() {
  const values=[]; const audits=[]; return { values,audits, async find(actor,key){ return values.find(item=>item.actorDiscordId===actor&&item.idempotencyKey===key)||null; },async get(id){return values.find(item=>item.publicationId===id)||null;}, async create(value){ values.push(structuredClone(value)); return value; }, async update(id,patch){ const item=values.find(value=>value.publicationId===id);if(!item)throw new AdminError(404,'publication_not_found','The publication was not found.'); Object.assign(item,structuredClone(patch)); return structuredClone(item); },async audit(event){audits.push(structuredClone(event));} };
}

const rowToPublication=row=>row&&({publicationId:row.publication_id,actorDiscordId:row.actor_discord_id,action:row.action,baseCommitSha:row.base_commit_sha,mutationHash:row.mutation_sha256,mutation:row.mutation_json?JSON.parse(row.mutation_json):null,idempotencyKey:row.idempotency_key,status:row.status,commitSha:row.commit_sha,catalogDigest:row.catalog_digest,deploymentId:row.deployment_id,deployedCommitSha:row.deployed_commit_sha,failureCode:row.failure_code,recoverable:Boolean(row.recoverable),createdAt:row.created_at,updatedAt:row.updated_at});
