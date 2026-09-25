import crypto from 'node:crypto';

export const PROTOCOL_ID='lmi-sites-publication-protocol@1.2.0';
export const UNIVERSES=Object.freeze(['editions','maison','food','musee']);

function stableJson(value){
  if(Array.isArray(value))return `[${value.map(stableJson).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

function sha256(value){return crypto.createHash('sha256').update(value).digest('hex');}
function hmac(value,secret){return crypto.createHmac('sha256',secret).update(value).digest('hex');}

export function verifyPrivateAppExport(bundle,{secret,target='bridge'}={}){
  if(!secret)throw new Error('signing_secret_required');
  if(!bundle||typeof bundle!=='object')throw new Error('bundle_required');
  const {manifest,signature,algorithm,manifestSha256}=bundle;
  if(algorithm!=='HMAC-SHA256')throw new Error('unsupported_signature_algorithm');
  if(manifest?.protocolId!==PROTOCOL_ID)throw new Error('protocol_mismatch');
  if(manifest?.target!==target)throw new Error('target_mismatch');
  if(!Array.isArray(manifest?.items)||manifest.items.length!==4)throw new Error('four_universes_required');
  const canonical=stableJson(manifest);
  if(sha256(canonical)!==manifestSha256)throw new Error('manifest_sha256_mismatch');
  if(hmac(JSON.stringify(manifest),secret)!==signature)throw new Error('signature_mismatch');
  const seen=new Set();
  for(const item of manifest.items){
    if(!UNIVERSES.includes(item.universe))throw new Error(`invalid_universe:${item.universe}`);
    if(seen.has(item.universe))throw new Error(`duplicate_universe:${item.universe}`);
    seen.add(item.universe);
    if(!/^[0-9a-f]{64}$/.test(String(item.sha256||'')))throw new Error(`invalid_item_sha256:${item.universe}`);
    if(!['APPROVED_FOR_BRIDGE','APPROVED_FOR_PUBLICATION'].includes(item.status))throw new Error(`status_not_publishable:${item.universe}`);
    if(target==='public'&&item.status!=='APPROVED_FOR_PUBLICATION')throw new Error(`public_approval_required:${item.universe}`);
    if(!item.provenance||typeof item.provenance!=='object')throw new Error(`missing_provenance:${item.universe}`);
  }
  for(const universe of UNIVERSES)if(!seen.has(universe))throw new Error(`missing_universe:${universe}`);
  return Object.freeze({
    accepted:true,
    protocolId:manifest.protocolId,
    sourceVersion:manifest.sourceVersion,
    target:manifest.target,
    generatedAt:manifest.generatedAt,
    manifestSha256,
    universes:Object.freeze([...seen])
  });
}

export {stableJson,sha256};
