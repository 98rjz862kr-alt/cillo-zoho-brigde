import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {verifyPrivateAppExport,stableJson,sha256,PROTOCOL_ID} from '../private-app-ingestion.mjs';

const secret='integration-test-secret';
const now='2026-09-17T22:30:00.000Z';
const items=['editions','maison','food','musee'].map(universe=>({
  lmiId:`LMI-${universe.toUpperCase()}-0001`,
  universe,
  version:'1.0.0',
  status:'APPROVED_FOR_BRIDGE',
  updatedAt:now,
  provenance:{source:'private-app',sourceVersion:'61339dfbf6dee5a30c9c2380c3a73068d1bd41be'},
  sha256:'b'.repeat(64),
  payload:{title:universe},
  target:'bridge'
}));
const manifest={protocolId:PROTOCOL_ID,sourceVersion:'61339dfbf6dee5a30c9c2380c3a73068d1bd41be',target:'bridge',generatedAt:now,items};
const bundle={manifest,manifestSha256:sha256(stableJson(manifest)),signature:crypto.createHmac('sha256',secret).update(JSON.stringify(manifest)).digest('hex'),algorithm:'HMAC-SHA256'};
const result=verifyPrivateAppExport(bundle,{secret,target:'bridge'});
assert.equal(result.accepted,true);
assert.equal(result.universes.length,4);

const tampered={...bundle,signature:'0'.repeat(64)};
assert.throws(()=>verifyPrivateAppExport(tampered,{secret,target:'bridge'}),/signature_mismatch/);
const draftItems=items.map((item,i)=>i===0?{...item,status:'DRAFT'}:item);
const draftManifest={...manifest,items:draftItems};
const draftBundle={manifest:draftManifest,manifestSha256:sha256(stableJson(draftManifest)),signature:crypto.createHmac('sha256',secret).update(JSON.stringify(draftManifest)).digest('hex'),algorithm:'HMAC-SHA256'};
assert.throws(()=>verifyPrivateAppExport(draftBundle,{secret,target:'bridge'}),/status_not_publishable/);
console.log('PRIVATE_APP_INGESTION_PASS 4');
