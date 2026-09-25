import { readFileSync } from 'node:fs';

const manifest=JSON.parse(readFileSync(new URL('./drafts/hub-lmi-editions/media-manifest.json',import.meta.url),'utf8'));
const index=new Map(manifest.assets.map(asset=>[asset.path.replace(/^assets\//,''),Object.freeze({
  sourceDriveId:asset.sourceDriveId,
  sourceName:asset.sourceName,
  sourceSha256:asset.sha256,
  sourceBytesUnchanged:asset.sourceBytesUnchanged===true,
  decodeQA:asset.decodeQA,
  usage:asset.usage,
  publicationApproval:asset.publicationApproval
})]));

export function getHubVisualProvenance(assetName){
  const p=index.get(String(assetName||''));
  if(!p)throw new Error('No canonical Drive provenance registered for Hub asset: '+assetName);
  return p;
}
export function listHubVisualProvenance(){return [...index.entries()].map(([assetName,p])=>({assetName,...p}));}
