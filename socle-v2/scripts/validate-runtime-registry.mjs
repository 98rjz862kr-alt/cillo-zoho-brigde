import { spawn } from 'node:child_process';

const port=4297;
const password='socle-v2-runtime-test';
const integrationSha='0000000000000000000000000000000000000000';
const child=spawn(process.execPath,['public-entry.js'],{
  cwd:process.cwd(),
  env:{...process.env,PORT:String(port),ADMIN_PASSWORD:password,GIT_COMMIT:integrationSha},
  stdio:['ignore','pipe','pipe']
});
let stderr='';
child.stderr.on('data',(chunk)=>{stderr+=chunk});
const wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const req=(headers={})=>fetch(`http://127.0.0.1:${port}/api/socle-v2/runtime`,{headers,redirect:'manual'});
try{
  let ready=false;
  for(let i=0;i<40;i++){
    try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok){ready=true;break;}}catch{}
    await wait(100);
  }
  if(!ready)throw new Error(`Bridge runtime failed to start: ${stderr}`);
  const denied=await req();
  if(denied.status!==401)throw new Error(`Unauthenticated Socle runtime registry expected 401, got ${denied.status}`);
  const allowed=await req({'x-admin-password':password});
  if(!allowed.ok)throw new Error(`Authenticated Socle runtime registry failed: ${allowed.status}`);
  const manifest=await allowed.json();
  if(manifest.brand!=='LES MOTS IMAGÉS')throw new Error('Canonical brand missing from runtime registry');
  if(manifest.integrationSha!==integrationSha)throw new Error('Integration SHA missing from runtime registry');
  for(const site of ['musee','maison','food','editions'])if(!manifest.sites?.[site])throw new Error(`Site missing from runtime registry: ${site}`);
  if(manifest.sites.food.exactCandidateContent!==true)throw new Error('Food candidate content is not exact in integration branch');
  if(manifest.sites.maison.exactCandidateContent!==true)throw new Error('Maison candidate content is not exact in integration branch');
  if(manifest.sites.musee.exactCandidateContent!==true)throw new Error('Corrected Museum candidate content is not exact in integration branch');
  if(manifest.sites.editions.exactCandidateContent!==true)throw new Error('Editions candidate content is not exact in integration branch');
  console.log('SOCLE_V2_RUNTIME_PASS');
} finally {
  child.kill('SIGTERM');
}
