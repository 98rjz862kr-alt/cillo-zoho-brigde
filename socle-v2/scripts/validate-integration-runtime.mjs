import { spawn } from 'node:child_process';

const port=4317;
const password='lmi-integration-runtime-test';
const integrationSha='1111111111111111111111111111111111111111';
const child=spawn(process.execPath,['public-entry.js'],{
  cwd:process.cwd(),
  env:{...process.env,PORT:String(port),ADMIN_PASSWORD:password,GIT_COMMIT:integrationSha,RENDER_GIT_COMMIT:integrationSha},
  stdio:['ignore','pipe','pipe']
});
let stderr='';
child.stderr.on('data',(chunk)=>{stderr+=chunk});
const wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const headers={'x-admin-password':password};
const base=`http://127.0.0.1:${port}`;
const cases=[
  ['editions','hub-lmi-editions/01-accueil.html'],
  ['food','lmi-food-site/00-bat-lmi-food.html'],
  ['maison','lmi-maison-site/00-bat-lmi-maison.html'],
  ['musee','lmi-musee-complet/index.html']
];
try{
  let ready=false;
  for(let i=0;i<40;i++){
    try{const r=await fetch(`${base}/health`);if(r.ok){ready=true;break;}}catch{}
    await wait(100);
  }
  if(!ready)throw new Error(`Bridge runtime failed to start: ${stderr}`);
  for(const [site,relative] of cases){
    const encoded=encodeURIComponent(relative);
    const response=await fetch(`${base}/atelier/file/${encoded}`,{headers,redirect:'manual'});
    if(!response.ok)throw new Error(`${site}: representative page failed with ${response.status}`);
    const robots=response.headers.get('x-robots-tag')||'';
    if(!/noindex/i.test(robots))throw new Error(`${site}: private noindex header missing`);
    const html=await response.text();
    if(/LES MOTS IMAGES|Les Mots Images/.test(html))throw new Error(`${site}: non-canonical brand rendered`);
    if(!/LES MOTS IMAGÉS|Les Mots Imagés|LMI (?:FOOD|Food|Maison|Musée)/.test(html))throw new Error(`${site}: expected LMI identity not rendered`);
  }
  const registry=await fetch(`${base}/api/socle-v2/runtime`,{headers});
  if(!registry.ok)throw new Error(`Socle runtime registry failed with ${registry.status}`);
  const manifest=await registry.json();
  if(manifest.integrationSha!==integrationSha)throw new Error('Integration SHA mismatch');
  for(const [site] of cases){
    const item=manifest.sites?.[site];
    if(!item)throw new Error(`${site}: missing from runtime registry`);
    if(item.exactCandidateContent!==true)throw new Error(`${site}: runtime package is not exact candidate content`);
    if(!/^[0-9a-f]{64}$/.test(item.runtimePackageSha256||''))throw new Error(`${site}: runtime package SHA-256 missing`);
  }
  console.log(`INTEGRATION_RUNTIME_PASS ${cases.length}`);
} finally {
  child.kill('SIGTERM');
}
