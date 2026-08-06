import { escapeHtml } from '../utils/escape.js';

const allowed = new Set(['image/jpeg','image/png','image/gif','image/webp']);
const maxBytes = 25 * 1024 * 1024;

const uploadFile = (authorization,file,onProgress,signal) => new Promise((resolve,reject) => {
  const xhr=new XMLHttpRequest(); const abort=()=>xhr.abort(); signal.addEventListener('abort',abort,{once:true});
  xhr.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100));};
  xhr.onerror=()=>reject(new Error('Upload network failure.')); xhr.onabort=()=>reject(new DOMException('Aborted','AbortError'));
  xhr.onload=()=>{signal.removeEventListener('abort',abort);if(xhr.status<200||xhr.status>=300)return reject(new Error('Cloudinary upload failed.'));try{resolve(JSON.parse(xhr.responseText));}catch{reject(new Error('Cloudinary upload failed.'));}};
  xhr.open('POST',authorization.uploadUrl);const data=new FormData();data.append('file',file);for(const [key,value] of Object.entries(authorization.parameters||{}))data.append(key,value);data.append('api_key',authorization.apiKey);data.append('signature',authorization.signature);xhr.send(data);
});

export function mountAdminAssetUpload(root,{bootstrap,result,client,parentSignal}) {
  const controller=new AbortController(),signal=controller.signal;parentSignal.addEventListener('abort',()=>controller.abort(),{once:true});
  const restrictedEnabled=bootstrap.capabilities.uploadRestrictedAssets===true;
  const accessChoice=restrictedEnabled?'<label>Access<select name="access"><option>Public<option>Restricted</select></label><p>Restricted files expose a static preview.</p>':'';
  root.innerHTML=`<section class="admin-upload"><div class="admin-editor-heading"><h2>Upload asset</h2></div><form data-upload-form><label>Image<input required name="file" type="file" accept="image/jpeg,image/png,image/gif,image/webp"></label>${accessChoice}<label>Category<select name="category">${['Icons','Banners','Animated','Wallpapers'].map(value=>`<option>${value}</option>`).join('')}</select></label><label>Title<input name="title" maxlength="160"></label><label>Tags<input name="tags" placeholder="comma, separated"></label><fieldset><legend>Collections</legend>${result.catalog.collections.map(value=>`<label><input type="checkbox" name="collections" value="${escapeHtml(value.slug)}"> ${escapeHtml(value.title)}</label>`).join('')||'<p>No collections.</p>'}</fieldset><button class="button button-light button-compact" type="submit">Upload asset</button><button class="button button-dark button-compact" type="button" data-upload-cancel disabled>Cancel upload</button><progress data-upload-progress max="100" value="0" hidden></progress><p data-upload-status aria-live="polite"></p></form></section>`;
  const form=root.querySelector('form'),status=root.querySelector('[data-upload-status]'),progress=root.querySelector('progress'),cancel=root.querySelector('[data-upload-cancel]');let operation=null;let publicationCleanup=null;
  cancel.onclick=()=>operation?.abort();
  form.onsubmit=async event=>{
    event.preventDefault();const data=new FormData(form),file=data.get('file');
    if(!(file instanceof File)||!allowed.has(file.type)){status.textContent='Choose a JPEG, PNG, GIF, or WebP image.';return;}
    if(file.size>maxBytes){status.textContent='The image exceeds the 25 MiB limit.';return;}
    operation=new AbortController();signal.addEventListener('abort',()=>operation.abort(),{once:true});cancel.disabled=false;progress.hidden=false;progress.value=0;
    try {
      status.textContent='Authorizing upload…';const format=file.type.split('/')[1];
      const restricted=restrictedEnabled&&data.get('access')==='Restricted';
      const create=await client.mutate('/api/admin/uploads',{baseCommitSha:result.baseCommitSha,category:data.get('category'),logicalSourceFilename:file.name,title:data.get('title'),tags:String(data.get('tags')||'').split(',').map(value=>value.trim()).filter(Boolean),collectionSlugs:data.getAll('collections'),requiresDiscordAuth:restricted,declaredFile:{format,bytes:file.size}},bootstrap.csrfToken,crypto.randomUUID(),operation.signal);
      const created=await create.json();if(!create.ok)throw new Error(created.error||'Upload authorization failed.');status.textContent='Uploading…';
      const uploaded=await uploadFile(created.authorization,file,value=>{progress.value=value;status.textContent=`Uploading original… ${value}%`;},operation.signal);status.textContent=restricted?'Verifying original, creating and verifying static preview…':'Verifying and publishing…';
      const finalized=await client.mutate(`/api/admin/uploads/${encodeURIComponent(created.job.jobId)}/finalize`,{version:uploaded.version},bootstrap.csrfToken,crypto.randomUUID(),operation.signal);const body=await finalized.json();
      if(finalized.status===409){status.innerHTML='The catalog changed while uploading. <button type="button" data-upload-retry>Retry publication</button>';root.querySelector('[data-upload-retry]').onclick=async()=>{status.textContent='Retrying publication…';const retry=await client.mutate(`/api/admin/uploads/${encodeURIComponent(created.job.jobId)}/retry`,{baseCommitSha:result.baseCommitSha},bootstrap.csrfToken,crypto.randomUUID(),operation.signal),retryBody=await retry.json();status.textContent=retry.ok?`Committed as ${retryBody.job.commitSha}. Deployment is pending.`:(retryBody.error||'Publication retry failed.');};return;}
      if(!finalized.ok)throw new Error(body.error||'Verification failed.');status.textContent=`Committed as ${body.job.commitSha}. Deployment is pending.`;if(bootstrap.capabilities.verifyDeployments){const {monitorAdminPublication}=await import('./AdminPublicationStatus.js');publicationCleanup=monitorAdminPublication(status,{publicationId:body.job.jobId,bootstrap,client,signal,onLive:()=>location.reload()});}
    } catch(error) { status.textContent=error.name==='AbortError'?'Upload cancelled. Unverified media will not be published.':(error.message||'The upload could not be completed.'); }
    finally { cancel.disabled=true; operation=null; }
  };
  return()=>{controller.abort();publicationCleanup?.();};
}
