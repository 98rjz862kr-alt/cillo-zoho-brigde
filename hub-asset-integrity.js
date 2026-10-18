import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(here,'drafts','hub-lmi-editions','assets');
const SAFE=/^[a-z0-9][a-z0-9._-]*$/i;
const cache=new Map();

function resolveAsset(name){
  const clean=String(name||'').trim();
  if(!SAFE.test(clean)||clean.includes('..')||path.basename(clean)!==clean)throw new Error('Invalid Hub asset name');
  return {clean,file:path.join(root,clean)};
}

export function getHubAssetIntegrity(name){
  const {clean,file}=resolveAsset(name);
  const stat=statSync(file);
  const hit=cache.get(clean);
  if(hit&&hit.mtimeMs===stat.mtimeMs&&hit.size===stat.size)return hit.value;
  const bytes=readFileSync(file);
  const value=Object.freeze({asset:clean,sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length});
  cache.set(clean,{mtimeMs:stat.mtimeMs,size:stat.size,value});
  return value;
}
