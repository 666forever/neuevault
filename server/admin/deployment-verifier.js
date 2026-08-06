import { AdminError } from './errors.js';
import { boundedProviderJson } from './provider-http.js';
import { validCommitSha } from './catalog-paths.js';

export const DEPLOYMENT_TARGET = Object.freeze({ project: 'neuevault', branch: 'main', markerUrl: 'https://www.pfseeker.com/catalog-version.json' });
const validDigest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
const config=env=>{
  const accountId=String(env.CLOUDFLARE_ACCOUNT_ID||''),token=String(env.CLOUDFLARE_PAGES_READ_TOKEN||'');
  return /^[a-f0-9]{32}$/i.test(accountId)&&token.length>=20?{accountId,token}:null;
};

export function createCloudflareDeploymentVerifier({env}) {
  const value=config(env);if(!value)return null;
  return { async verify({commitSha,catalogDigest}) {
    if(!validCommitSha(commitSha)||!validDigest(catalogDigest))throw new AdminError(409,'deployment_expectation_invalid','The publication cannot be verified.');
    const endpoint=`https://api.cloudflare.com/client/v4/accounts/${value.accountId}/pages/projects/${DEPLOYMENT_TARGET.project}/deployments?env=production&per_page=25`;
    const {response,body}=await boundedProviderJson(endpoint,{headers:{Accept:'application/json',Authorization:`Bearer ${value.token}`}}, {timeoutMs:8_000,maxBytes:524_288,unavailableCode:'cloudflare_unavailable',invalidCode:'cloudflare_invalid_response'});
    if(!response.ok||body?.success!==true||!Array.isArray(body.result))throw new AdminError(503,'cloudflare_unavailable','Deployment verification is temporarily unavailable.');
    const deployments=body.result.filter(item=>item?.environment==='production'&&item.deployment_trigger?.metadata?.branch===DEPLOYMENT_TARGET.branch);
    const match=deployments.find(item=>String(item.deployment_trigger?.metadata?.commit_hash||'').toLowerCase()===commitSha.toLowerCase());
    if(!match)return {state:'pending',deploymentState:'not_found'};
    const stage=String(match.latest_stage?.status||'').toLowerCase();
    if(['failure','failed','canceled','cancelled'].includes(stage))return {state:'failed',deploymentState:'failed',deploymentId:String(match.id||'')||null,failureCode:'deployment_failed'};
    if(stage!=='success')return {state:'pending',deploymentState:stage||'building',deploymentId:String(match.id||'')||null};
    const marker=new URL(DEPLOYMENT_TARGET.markerUrl);marker.searchParams.set('verify',`${commitSha.slice(0,12)}-${Date.now()}`);
    const markerResult=await boundedProviderJson(marker.toString(),{headers:{Accept:'application/json','Cache-Control':'no-cache'},cache:'no-store'}, {timeoutMs:6_000,maxBytes:4096,unavailableCode:'catalog_marker_unavailable',invalidCode:'catalog_marker_invalid'});
    if(!markerResult.response.ok)throw new AdminError(503,'catalog_marker_unavailable','Live catalog verification is temporarily unavailable.');
    const type=markerResult.response.headers.get('Content-Type')||'';
    if(!type.toLowerCase().includes('application/json')||markerResult.body?.version!==1||!validDigest(markerResult.body?.catalogDigest))throw new AdminError(503,'catalog_marker_invalid','Live catalog verification returned an invalid marker.');
    if(markerResult.body.catalogDigest.toLowerCase()!==catalogDigest.toLowerCase())return {state:'pending',deploymentState:'success',markerState:'mismatch',deploymentId:String(match.id||'')||null,failureCode:'catalog_marker_mismatch'};
    return {state:'live',deploymentState:'success',markerState:'matched',deploymentId:String(match.id||'')||null,deployedCommitSha:commitSha};
  }};
}

export function deploymentVerifier({env={},data={}}={}) {
  if(data.deploymentVerifier?.verify)return data.deploymentVerifier;
  if(data.cloudflareDeploymentVerifier?.verify)return data.cloudflareDeploymentVerifier;
  return createCloudflareDeploymentVerifier({env});
}
export function requireDeploymentVerifier(context){const provider=deploymentVerifier(context);if(!provider)throw new AdminError(503,'deployment_verifier_unavailable','Deployment verification is not configured.');return provider;}
export function createMockDeploymentVerifier(result={state:'live',deploymentState:'success',markerState:'matched',deploymentId:'deploy-1'}){const calls=[];return {calls,async verify(input){calls.push(structuredClone(input));if(result instanceof Error)throw result;return structuredClone(typeof result==='function'?await result(input):result);}};}
