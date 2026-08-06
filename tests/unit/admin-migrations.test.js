import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

const migrationFiles=['0001_admin_foundation.sql','0002_publication_idempotency.sql','0003_upload_idempotency.sql','0004_deployment_verification.sql'];
const applyMigrations=()=>{const db=new DatabaseSync(':memory:');for(const file of migrationFiles)db.exec(readFileSync(`migrations/${file}`,'utf8'));return db;};
const upload=(overrides={})=>({job_id:'job-1',actor_discord_id:'1137950746751537152',proposed_asset_id:'nv-999',base_commit_sha:'a'.repeat(40),status:'created',byte_size:1024,width:1000,height:1000,animated:0,recoverable:0,cleanup_state:'not_eligible',created_at:'2026-08-06T00:00:00Z',updated_at:'2026-08-06T00:00:00Z',expires_at:'2026-08-06T01:00:00Z',...overrides});
const insertUpload=(db,value)=>db.prepare(`INSERT INTO upload_jobs (${Object.keys(value).join(',')}) VALUES (${Object.keys(value).map(()=>'?').join(',')})`).run(...Object.values(value));
const publication=(overrides={})=>({publication_id:'pub-1',actor_discord_id:'1137950746751537152',action:'category.update',base_commit_sha:'a'.repeat(40),mutation_sha256:'b'.repeat(64),status:'validating',recoverable:0,created_at:'2026-08-06T00:00:00Z',updated_at:'2026-08-06T00:00:00Z',...overrides});
const insertPublication=(db,value)=>db.prepare(`INSERT INTO publication_jobs (${Object.keys(value).join(',')}) VALUES (${Object.keys(value).map(()=>'?').join(',')})`).run(...Object.values(value));

describe('administration D1 migrations',()=>{
  it('applies the real migration files in exact order from an empty database',()=>{const db=applyMigrations();const objects=db.prepare("SELECT name,type FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();expect(objects.filter(value=>value.type==='table').map(value=>value.name)).toEqual(['admin_audit_log','delegated_admins','publication_jobs','upload_jobs']);expect(objects.filter(value=>value.type==='index').map(value=>value.name)).toEqual(expect.arrayContaining(['admin_audit_actor_created','admin_audit_created','admin_audit_target_created','publication_actor_idempotency','publication_commit_pending','publication_status_updated','upload_commit_pending','upload_jobs_active_asset_id','upload_jobs_actor_created','upload_jobs_actor_idempotency','upload_jobs_status_updated']));const uploadColumns=db.prepare('PRAGMA table_info(upload_jobs)').all().map(value=>value.name),publicationColumns=db.prepare('PRAGMA table_info(publication_jobs)').all().map(value=>value.name);expect(uploadColumns).toEqual(expect.arrayContaining(['idempotency_key','request_sha256','finalize_idempotency_key','finalize_sha256','retry_idempotency_key','retry_sha256','catalog_digest']));expect(publicationColumns).toEqual(expect.arrayContaining(['idempotency_key','catalog_digest']));db.close();});
  it.each([
    ['bytes above 25 MiB',{byte_size:26214401}],
    ['width above 12000',{width:12001}],
    ['height above 12000',{height:12001}],
    ['area above 100 MP',{width:11000,height:10000}],
    ['invalid upload status',{status:'invalid'}],
  ])('rejects %s without weakening the designed upload constraints',(_label,override)=>{const db=applyMigrations();expect(()=>insertUpload(db,upload(override))).toThrow();db.close();});
  it('accepts representative rows and rejects active reservation and idempotency duplicates',()=>{const db=applyMigrations();insertUpload(db,upload({idempotency_key:'upload-key'}));expect(()=>insertUpload(db,upload({job_id:'job-2',idempotency_key:'other-key'}))).toThrow();insertUpload(db,upload({job_id:'job-3',proposed_asset_id:'nv-998',idempotency_key:'other-key'}));expect(()=>insertUpload(db,upload({job_id:'job-4',proposed_asset_id:'nv-997',idempotency_key:'upload-key'}))).toThrow();insertPublication(db,publication({idempotency_key:'publication-key'}));expect(()=>insertPublication(db,publication({publication_id:'pub-2',idempotency_key:'publication-key'}))).toThrow();expect(()=>insertPublication(db,publication({publication_id:'pub-invalid',idempotency_key:'other-publication',status:'invalid'}))).toThrow();db.close();});
});
