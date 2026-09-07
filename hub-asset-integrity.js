import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const HUB_ASSET_DIR=path.join(__dirname,'drafts','hub-lmi-editions','assets');
const SAFE_ASSET=/^[a-z0-9][a-z0-9._-]*$/i;
const cache=new Map();

function resolveAsset(assetName){
  const name=String(assetName||'').trim();
  if(!SAFE_ASSET.test(name)||name.includes('..')||path.basename(name)!==name){
    throw new Error(`Invalid Hub asset name: ${name||'(empty)'}`);
  }
  return {name,filePath:path.join(HUB_ASSET_DIR,name)};
}

export function getHubAssetIntegrity(assetName){
  const {name,filePath}=resolveAsset(assetName);
  const stat=statSync(filePath);
  const cached=cache.get(name);
  if(cached&&cached.mtimeMs===stat.mtimeMs&&cached.size===stat.size)return cached.value;
  const content=readFileSync(filePath);
  const sha256=createHash('sha256').update(content).digest('hex');
  const value=Object.freeze({asset:name,sha256,size:content.length});
  cache.set(name,{mtimeMs:stat.mtimeMs,size:stat.size,value});
  return value;
}

export function getHubAssetSha256(assetName){
  return getHubAssetIntegrity(assetName).sha256;
}

export function assertSha256(value){
  return /^[a-f0-9]{64}$/.test(String(value||''));
}
