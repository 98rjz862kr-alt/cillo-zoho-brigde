import { readFileSync } from 'node:fs';
import { getHubAssetIntegrity } from '../hub-asset-integrity.js';
import { getHubVisualProvenance } from '../hub-provenance.js';

const manifest=JSON.parse(readFileSync(new URL('../drafts/hub-lmi-editions/media-manifest.json',import.meta.url),'utf8'));
for(const asset of manifest.assets){
  const name=asset.path.replace(/^assets\//,'');
  const integrity=getHubAssetIntegrity(name);
  const provenance=getHubVisualProvenance(name);
  if(integrity.sha256!==asset.sha256)throw new Error('SHA mismatch: '+name);
  if(integrity.size!==asset.bytes)throw new Error('Size mismatch: '+name);
  if(provenance.sourceDriveId!==asset.sourceDriveId||provenance.sourceSha256!==asset.sha256)throw new Error('Provenance mismatch: '+name);
}
console.log('HUB_ASSET_INTEGRITY_PASS '+manifest.assets.length);
