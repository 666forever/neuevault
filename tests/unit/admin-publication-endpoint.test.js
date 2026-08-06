import { beforeAll,describe,expect,it } from 'vitest';
import { SESSION_COOKIE } from '../../server/auth.js';
import { signPayload } from '../../server/crypto.js';
import { createLocalAdminCatalogProvider } from '../../scripts/admin/local-catalog-provider.mjs';
import { createMockGitProvider } from '../../server/admin/mock-git-provider.js';
import { createMemoryPublicationStore } from '../../server/admin/publication-store.js';
import { onRequest } from '../../functions/api/admin/publications.js';

const secret='a sufficiently long publication endpoint secret',owner='1137950746751537152',delegated='2237950746751537152',ordinary='3237950746751537152',sha='a'.repeat(40);let snapshot;
beforeAll(async()=>{snapshot=(await createLocalAdminCatalogProvider({baseCommitSha:sha}).read()).snapshot;});
const db=()=>({prepare(sql){return{bind(id){return{first:async()=>id===delegated?{discord_id:id}:null};}};}});
const env=(extra={})=>({SESSION_SECRET:secret,ADMIN_OWNER_DISCORD_ID:owner,ADMIN_DB:db(),ADMIN_ENVIRONMENT:'test',ADMIN_ALLOW_LOCAL_WRITES:'true',...extra});
async function request(id,{origin='https://www.pfseeker.com',csrf='csrf',contentType='application/json',key='request-key-1',body,method='POST'}={}){const token=id?await signPayload({user:{id,displayName:'Admin'},csrf:'csrf',exp:9_999_999_999},secret):null;return new Request('https://www.pfseeker.com/api/admin/publications',{method,headers:{...(token?{Cookie:`${SESSION_COOKIE}=${encodeURIComponent(token)}`}:{ }),Origin:origin,'Content-Type':contentType,'X-CSRF-Token':csrf,'Idempotency-Key':key},body:body===undefined?JSON.stringify({baseCommitSha:sha,mutation:{type:'collection.update',id:'col-001',changes:{title:'Published'}}}):body});}
const call=async(id,options={},environment=env())=>onRequest({request:await request(id,options),env:environment,data:{adminGitProvider:createMockGitProvider({head:sha,snapshot}),publicationStore:createMemoryPublicationStore()}});

describe('catalog publication endpoint integrity',()=>{
  it('independently authorizes owner and delegated while rejecting signed-out and ordinary users',async()=>{expect((await call(null)).status).toBe(401);expect((await call(ordinary)).status).toBe(403);expect((await call(owner)).status).toBe(202);expect((await call(delegated)).status).toBe(202);});
  it('enforces origin, CSRF, JSON, body bounds, base SHA, idempotency, preview, and configuration',async()=>{expect((await call(owner,{origin:'https://evil.example'})).status).toBe(403);expect((await call(owner,{csrf:'bad'})).status).toBe(403);expect((await call(owner,{contentType:'text/plain'})).status).toBe(415);expect((await call(owner,{body:'x'.repeat(33000)})).status).toBe(413);expect((await call(owner,{body:JSON.stringify({baseCommitSha:'bad',mutation:{type:'collection.update',id:'col-001',changes:{title:'x'}}})})).status).toBe(400);expect((await call(owner,{key:'bad'})).status).toBe(400);expect((await call(owner,{},env({ADMIN_ENVIRONMENT:'preview'}))).status).toBe(403);const response=await onRequest({request:await request(owner),env:env({ADMIN_ENVIRONMENT:'production'}),data:{}});expect(response.status).toBe(403);});
  it('uses no-store and never accepts arbitrary repository material',async()=>{const response=await call(owner);expect(response.headers.get('Cache-Control')).toBe('no-store');const body=await response.json();expect(JSON.stringify(body)).not.toMatch(/private|token|content\/metadata|force/i);const arbitrary=await call(owner,{body:JSON.stringify({baseCommitSha:sha,files:[{path:'x',content:'secret'}],mutation:{type:'repo.write'}})});expect(arbitrary.status).toBe(400);});
});
