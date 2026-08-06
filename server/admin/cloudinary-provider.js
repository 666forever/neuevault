import { AdminError } from './errors.js';
import { boundedProviderJson, transientStatus } from './provider-http.js';

export const UPLOAD_LIMITS = Object.freeze({ formats:Object.freeze(['jpg','jpeg','png','gif','webp']), bytes:25*1024*1024, width:12000, height:12000, pixels:100_000_000, authorizationSeconds:600 });
export const RESTRICTED_PREVIEW_POLICY = Object.freeze({ width:1200, height:1200, crop:'limit', page:1, sourceSeconds:300 });
const categorySegment = value => String(value).toLowerCase();
export const publicIdFor = (category,assetId)=>`neuevault/public/${categorySegment(category)}/${assetId}`;
export const restrictedOriginalPublicIdFor = (category,assetId)=>`neuevault/restricted/${categorySegment(category)}/${assetId}`;
export const restrictedPreviewPublicIdFor = (category,assetId)=>`neuevault/previews/${categorySegment(category)}/${assetId}`;

const PUBLIC_ID=/^neuevault\/public\/(icons|banners|animated|wallpapers)\/nv-\d+$/i;
const RESTRICTED_ID=/^neuevault\/restricted\/(icons|banners|animated|wallpapers)\/nv-\d+$/i;
const PREVIEW_ID=/^neuevault\/previews\/(icons|banners|animated|wallpapers)\/nv-\d+$/i;
const hex = bytes => [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
const basic = (key, secret) => btoa(`${key}:${secret}`);
const validConfig = env => {
  const cloudName=String(env.CLOUDINARY_CLOUD_NAME||''),apiKey=String(env.CLOUDINARY_API_KEY||''),apiSecret=String(env.CLOUDINARY_API_SECRET||'');
  return /^[a-z0-9_-]+$/i.test(cloudName)&&/^\d+$/.test(apiKey)&&apiSecret.length>=8?{cloudName,apiKey,apiSecret}:null;
};
const providerFailure=(code='cloudinary_unavailable')=>new AdminError(503,code,'Cloudinary media processing is temporarily unavailable.');
export async function signCloudinaryParameters(parameters,secret){const value=Object.keys(parameters).filter(key=>parameters[key]!==undefined&&parameters[key]!==null&&parameters[key]!=='').sort().map(key=>`${key}=${parameters[key]}`).join('&')+secret;return hex(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(value)));}

function expectedIdentity(publicId,deliveryType){
  if(deliveryType==='authenticated'&&RESTRICTED_ID.test(publicId))return true;
  if(deliveryType==='upload'&&(PUBLIC_ID.test(publicId)||PREVIEW_ID.test(publicId)))return true;
  return false;
}
function normalizedResource(body,{publicId,deliveryType,version,cloudName}){
  if(body?.public_id!==publicId||body?.resource_type!=='image'||body?.type!==deliveryType||(version&&Number(body.version)!==Number(version)))throw new AdminError(422,'cloudinary_verification_failed','The uploaded image identity could not be verified.');
  let secureUrl=null;
  if(deliveryType==='upload'){
    try{const url=new URL(body.secure_url);if(url.protocol!=='https:'||url.hostname!=='res.cloudinary.com'||!url.pathname.includes(`/${cloudName}/image/upload/`)||!url.pathname.includes(`/${publicId}.`))throw new Error();secureUrl=url.href;}catch{throw new AdminError(422,'cloudinary_verification_failed','The uploaded image identity could not be verified.');}
  }
  return {assetId:String(body.asset_id||''),publicId:body.public_id,version:Number(body.version),resourceType:body.resource_type,deliveryType:body.type,format:String(body.format||'').toLowerCase(),bytes:Number(body.bytes),width:Number(body.width),height:Number(body.height),pages:Number(body.pages||1),animated:Boolean(Number(body.pages||1)>1||body.format==='gif'),...(secureUrl?{secureUrl}:{}),createdAt:body.created_at};
}

export function createCloudinaryProductionProvider({env,now=()=>new Date()}) {
  const config=validConfig(env);if(!config)return null;
  return {
    supportsRestrictedUploads:true,
    async createUploadAuthorization(input){
      const deliveryType=input.requiresDiscordAuth?'authenticated':'upload';
      if(!expectedIdentity(input.publicId,deliveryType)||(deliveryType==='authenticated'&&!RESTRICTED_ID.test(input.publicId)))throw new AdminError(400,'upload_public_id_invalid','The upload identity is invalid.');
      const parameters={allowed_formats:UPLOAD_LIMITS.formats.join(','),overwrite:'false',public_id:input.publicId,timestamp:Number(input.timestamp),type:deliveryType};
      if(!Number.isInteger(parameters.timestamp)||new Date(input.expiresAt).getTime()-parameters.timestamp*1000>UPLOAD_LIMITS.authorizationSeconds*1000+1000)throw new AdminError(400,'upload_authorization_invalid','The upload authorization is invalid.');
      return {cloudName:config.cloudName,apiKey:config.apiKey,uploadUrl:`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,expiresAt:input.expiresAt,parameters:{...parameters,resource_type:'image'},signature:await signCloudinaryParameters(parameters,config.apiSecret)};
    },
    async verifyResource(input){
      const deliveryType=input.deliveryType||'upload';
      if(!expectedIdentity(input.publicId,deliveryType))throw new AdminError(422,'cloudinary_verification_failed','The uploaded image could not be verified.');
      const path=input.publicId.split('/').map(encodeURIComponent).join('/');
      const {response,body}=await boundedProviderJson(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/resources/image/${deliveryType}/${path}?pages=true`,{headers:{Accept:'application/json',Authorization:`Basic ${basic(config.apiKey,config.apiSecret)}`}}, {unavailableCode:'cloudinary_unavailable',invalidCode:'cloudinary_verification_failed',maxBytes:262_144});
      if(!response.ok){if(response.status===404)throw new AdminError(422,'cloudinary_verification_failed','The uploaded image could not be verified.');throw new AdminError(transientStatus(response.status)?503:502,'cloudinary_unavailable','Cloudinary verification is unavailable.');}
      return normalizedResource(body,{publicId:input.publicId,deliveryType,version:input.version,cloudName:config.cloudName});
    },
    async createRestrictedPreview({original,previewPublicId}){
      if(!original||!RESTRICTED_ID.test(original.publicId)||original.deliveryType!=='authenticated'||!PREVIEW_ID.test(previewPublicId)||previewPublicId.replace('/previews/','/restricted/')!==original.publicId)throw new AdminError(422,'restricted_preview_input_invalid','The restricted preview request is invalid.');
      const timestamp=Math.floor(now().getTime()/1000),expiresAt=timestamp+RESTRICTED_PREVIEW_POLICY.sourceSeconds;
      const downloadParameters={expires_at:expiresAt,format:original.format,public_id:original.publicId,timestamp,type:'authenticated'};
      const downloadSignature=await signCloudinaryParameters(downloadParameters,config.apiSecret);
      const source=new URL(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/download`);
      for(const [key,value] of Object.entries({...downloadParameters,api_key:config.apiKey,signature:downloadSignature}))source.searchParams.set(key,String(value));
      const outputFormat=['png','gif','webp'].includes(original.format)?'png':'jpg';
      const uploadParameters={format:outputFormat,overwrite:'false',public_id:previewPublicId,timestamp,transformation:'pg_1,w_1200,h_1200,c_limit',type:'upload'};
      const form=new URLSearchParams({...uploadParameters,api_key:config.apiKey,file:source.href,signature:await signCloudinaryParameters(uploadParameters,config.apiSecret)});
      let response,body;
      try{({response,body}=await boundedProviderJson(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form.toString()},{unavailableCode:'restricted_preview_unavailable',invalidCode:'restricted_preview_creation_failed',maxBytes:262_144}));}catch{throw providerFailure('restricted_preview_unavailable');}
      if(!response.ok)throw providerFailure('restricted_preview_creation_failed');
      if(body?.public_id!==previewPublicId||body?.resource_type!=='image'||body?.type!=='upload')throw new AdminError(422,'restricted_preview_creation_failed','The restricted preview could not be created.');
      return {assetId:String(body.asset_id||''),publicId:body.public_id,version:Number(body.version),resourceType:'image',deliveryType:'upload',format:String(body.format||'').toLowerCase(),bytes:Number(body.bytes),width:Number(body.width),height:Number(body.height),pages:Number(body.pages||1),animated:Boolean(Number(body.pages||1)>1),createdAt:body.created_at};
    }
  };
}

export function providerSupportsRestrictedUploads(provider){return Boolean(provider?.supportsRestrictedUploads&&provider.createUploadAuthorization&&provider.verifyResource&&provider.createRestrictedPreview);}
export function adminCloudinaryProvider({env={},data={}}={}) {
  if(data.adminCloudinaryProvider?.createUploadAuthorization&&data.adminCloudinaryProvider?.verifyResource) return data.adminCloudinaryProvider;
  if(data.cloudinaryAdminProvider)return data.cloudinaryAdminProvider;
  if(env.CLOUDINARY_CLOUD_NAME&&env.CLOUDINARY_API_KEY&&env.CLOUDINARY_API_SECRET) return createCloudinaryProductionProvider({env});
  return null;
}
export function requireCloudinaryProvider(context){const provider=adminCloudinaryProvider(context);if(!provider)throw new AdminError(503,'admin_upload_unavailable','Asset upload is unavailable.');return provider;}

export function createMockCloudinaryProvider({fail=null,resource=null,restrictedEnabled=false,previewResource=null}={}){
  const authorizations=[],verifications=[],previewCreations=[];
  return {authorizations,verifications,previewCreations,supportsRestrictedUploads:restrictedEnabled,
    async createUploadAuthorization(input){if(fail==='sign')throw new Error('private signing failure');authorizations.push(structuredClone(input));const type=input.requiresDiscordAuth?'authenticated':'upload';return {cloudName:'local-mock',apiKey:'mock-public-key',uploadUrl:'https://api.cloudinary.com/v1_1/local-mock/image/upload',expiresAt:input.expiresAt,parameters:{public_id:input.publicId,resource_type:'image',type,overwrite:'false',timestamp:input.timestamp,allowed_formats:UPLOAD_LIMITS.formats.join(',')},signature:'mock-signature'};},
    async verifyResource(input){if(fail==='verify')throw new Error('private verification failure');verifications.push(structuredClone(input));const type=input.deliveryType||'upload';const fallback=type==='authenticated'?{assetId:'mock-restricted-original',publicId:input.publicId,version:input.version||1700000000,resourceType:'image',deliveryType:'authenticated',format:'jpg',bytes:1200,width:1200,height:800,pages:1,animated:false,createdAt:'2026-08-06T00:00:00.000Z'}:type==='upload'&&PREVIEW_ID.test(input.publicId)?{assetId:'mock-restricted-preview',publicId:input.publicId,version:1700000001,resourceType:'image',deliveryType:'upload',format:'jpg',bytes:600,width:1200,height:800,pages:1,animated:false,secureUrl:`https://res.cloudinary.com/local-mock/image/upload/v1700000001/${input.publicId}.jpg`,createdAt:'2026-08-06T00:00:01.000Z'}:{assetId:'mock-cloudinary-asset',publicId:input.publicId,version:input.version||1700000000,resourceType:'image',deliveryType:'upload',format:'jpg',bytes:1200,width:1200,height:800,pages:1,animated:false,secureUrl:`https://res.cloudinary.com/local-mock/image/upload/v${input.version||1700000000}/${input.publicId}.jpg`,createdAt:'2026-08-06T00:00:00.000Z'};return structuredClone(resource||fallback);},
    async createRestrictedPreview(input){if(!restrictedEnabled)throw new AdminError(503,'restricted_upload_disabled','Restricted uploads are unavailable.');if(fail==='preview'||fail==='private-download')throw new Error('private preview failure');previewCreations.push(structuredClone(input));return structuredClone(previewResource||{assetId:'mock-restricted-preview',publicId:input.previewPublicId,version:1700000001,resourceType:'image',deliveryType:'upload',format:['png','gif','webp'].includes(input.original.format)?'png':'jpg',bytes:600,width:Math.min(1200,input.original.width),height:Math.min(1200,input.original.height),pages:1,animated:false,createdAt:'2026-08-06T00:00:01.000Z'});}
  };
}
