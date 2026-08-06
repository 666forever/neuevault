import { AdminError } from './errors.js';
const transitions=new Map([
  ['created',new Set(['uploading','uploaded','expired','failed'])],['uploading',new Set(['uploaded','failed','expired'])],['uploaded',new Set(['verifying','failed'])],['verifying',new Set(['verified','failed','cleanup_eligible'])],['verified',new Set(['publication_pending','failed','cleanup_eligible'])],['publication_pending',new Set(['commit_created','failed','cleanup_eligible'])],['commit_created',new Set(['deployment_pending','failed'])],['deployment_pending',new Set(['live','failed'])],['failed',new Set(['publication_pending','cleanup_eligible'])],['expired',new Set(['cleanup_eligible'])],['cleanup_eligible',new Set(['cleaned'])],['live',new Set()],['cleaned',new Set()]
]);
export const uploadStatuses=Object.freeze([...transitions.keys()]);
export function assertUploadTransition(from,to){if(from===to)return;if(!transitions.get(from)?.has(to))throw new AdminError(409,'upload_state_invalid',`The upload cannot move from ${from} to ${to}.`);}
