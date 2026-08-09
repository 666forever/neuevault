import './admin.css';
import { AdminClient } from './AdminClient.js';
import { escapeHtml } from '../utils/escape.js';

const stateShell=(title,copy,action='')=>`<div class="page admin-page"><section class="admin-state" aria-labelledby="admin-state-title" aria-live="polite"><p class="admin-kicker">Administration · Read-only</p><h1 id="admin-state-title">${escapeHtml(title)}</h1><p>${escapeHtml(copy)}</p>${action}</section></div>`;
const retryButton='<button class="button button-dark button-compact" type="button" data-admin-retry><span>Retry</span></button>';

export function renderAdminPage(app,{client=new AdminClient()}={}){
  let controller=null;let disposed=false;let workspaceCleanup=null;
  const set=html=>{if(!disposed)app.innerHTML=html;};
  const bindRetry=()=>{const retry=app.querySelector('[data-admin-retry]');if(retry)retry.onclick=load;};
  const load=async()=>{
    controller?.abort();workspaceCleanup?.();workspaceCleanup=null;controller=new AbortController();const {signal}=controller;
    set(stateShell('Checking access…','Confirming your administrator session.'));
    try{
      const bootstrapResponse=await client.bootstrap(signal);if(signal.aborted||disposed)return;
      if(bootstrapResponse.status===401){set(stateShell('Sign in required','Sign in with Discord to request administrator access.','<a class="button button-light button-compact" href="/api/auth/discord?returnTo=%2Fadmin"><span>Sign In</span></a>'));return;}
      if(bootstrapResponse.status===403){set(stateShell('Access denied','This account does not have access to Neuevault administration.'));return;}
      if(!bootstrapResponse.ok){set(stateShell('Administration unavailable','Administrator access could not be checked safely. Please try again.',retryButton));bindRetry();return;}
      const bootstrap=await bootstrapResponse.json();if(signal.aborted||disposed)return;
      set(stateShell('Loading catalog…','Loading the canonical authored catalog.'));
      const catalogResponse=await client.catalog(signal);if(signal.aborted||disposed)return;
      if(!catalogResponse.ok){set(stateShell('Catalog unavailable','The catalog provider is unavailable. Please try again.',retryButton));bindRetry();return;}
      const result=await catalogResponse.json();if(signal.aborted||disposed)return;
      const {mountAdminWorkspace}=await import('./AdminWorkspace.js');
      if(!signal.aborted&&!disposed)workspaceCleanup=mountAdminWorkspace(app,{bootstrap,result,client,signal});
    }catch(error){if(signal.aborted||disposed||error?.name==='AbortError')return;set(stateShell('Network error','The administration service could not be reached. Please try again.',retryButton));bindRetry();}
  };
  load();
  return()=>{disposed=true;controller?.abort();workspaceCleanup?.();};
}
