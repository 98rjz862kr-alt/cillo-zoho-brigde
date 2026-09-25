import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { collectPreviewResources } from '../preview-resources.mjs';
import { buildRuntimeRegistry } from '../runtime-registry.mjs';

const base=(process.env.BRIDGE_BASE_URL||'').replace(/\/$/,'');
const password=process.env.ADMIN_PASSWORD||'';
const expected=process.env.EXPECTED_INTEGRATION_SHA||'';
const parsed=new URL(base);
const allowed=new Set(['bridge.lesmotsimages.com','cillo-zoho-bridge.onrender.com']);
if(parsed.protocol!=='https:'||!allowed.has(parsed.hostname)||parsed.username||parsed.password||parsed.pathname!=='/')throw new Error('Expected trusted HTTPS Bridge origin');
if(!password||!(/^[0-9a-f]{40}$/).test(expected))throw new Error('ADMIN_PASSWORD and EXPECTED_INTEGRATION_SHA required');
const localSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(localSha!==expected)throw new Error('Local source is not expected integration');
if(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw new Error('Clean source worktree required');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function request(route,authenticated=true){
  return fetch(base+route,{headers:authenticated?{'x-admin-password':password}:{},redirect:'manual',signal:AbortSignal.timeout(45000)});
}
const health=await request('/health',false);
if(!health.ok)throw new Error('Bridge health: '+health.status);
const healthJson=await health.json();
if(healthJson.revision!==expected)throw new Error('Remote integration SHA differs');
if(healthJson.publicAtelier!==false||healthJson.adminPasswordConfigured!==true)throw new Error('Private access not configured');
if((await request('/api/socle-v2/runtime',false)).status!==401)throw new Error('Public runtime manifest access');
const response=await request('/api/socle-v2/runtime');
if(!response.ok)throw new Error('Authenticated runtime manifest: '+response.status);
const manifest=await response.json();
const local=buildRuntimeRegistry({integrationSha:expected});
if(manifest.integrationSha!==expected||manifest.brand!=='LES MOTS IMAGÉS')throw new Error('Runtime identity mismatch');
if(Object.keys(manifest.sites||{}).sort().join(',')!==Object.keys(local.sites).sort().join(','))throw new Error('Runtime sites mismatch');
for(const [site,item] of Object.entries(local.sites)){
  const remote=manifest.sites[site];
  for(const field of ['candidateSourceSha','candidatePackageSha256','runtimePackageSha256','files']){
    if(remote[field]!==item[field])throw new Error(site+': remote '+field+' differs from local source');
  }
  if(!remote.exactCandidateContent||!item.exactCandidateContent)throw new Error(site+': candidate mismatch');
}
const {resources,links,pageCount}=collectPreviewResources();
const entries=[];
for(const [relative,item] of resources){
  const route='/atelier/file/'+encodeURIComponent(relative);
  if((await request(route,false)).status!==401)throw new Error('Public draft resource: '+relative);
  const r=await request(route);
  if(r.status!==200)throw new Error('Remote resource '+relative+': '+r.status);
  if(!/noindex/i.test(r.headers.get('x-robots-tag')||''))throw new Error('Missing noindex: '+relative);
  const bytes=Buffer.from(await r.arrayBuffer());
  if(sha(bytes)!==sha(item.body))throw new Error('Remote rendered bytes differ: '+relative);
  if(relative.endsWith('.css')&&!/text\/css/i.test(r.headers.get('content-type')||''))throw new Error('Stylesheet MIME incorrect');
  entries.push({path:relative,site:item.site,size:bytes.length,sha256:sha(bytes),httpStatus:r.status,unauthorizedStatus:401,noindex:true});
}
const login=await fetch(base+'/atelier',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password}),redirect:'manual',signal:AbortSignal.timeout(45000)});
if(login.status!==303)throw new Error('Browser session login failed');
const setCookie=login.headers.get('set-cookie')||'';
if(!/HttpOnly/i.test(setCookie)||!/SameSite=Strict/i.test(setCookie))throw new Error('Session flags missing');
const session=await fetch(base+'/atelier/file/'+encodeURIComponent('lmi-musee-complet/index.html'),{headers:{cookie:setCookie.split(';')[0]},redirect:'manual',signal:AbortSignal.timeout(45000)});
if(session.status!==200)throw new Error('Authenticated browser session failed');
const result={status:'REMOTE_BRIDGE_PASS',observedAt:new Date().toISOString(),bridgeUrl:base,integrationSha:expected,sourceWorktreeClean:true,brand:'LES MOTS IMAGÉS',sites:manifest.sites,pages:pageCount,resources:entries.length,links:links.length,sessionAuthentication:true,renderedBundleSha256:sha(JSON.stringify(entries)),resourcesVerified:entries,publicPublication:false,humanRecipe:'NOT_RUN'};
const output=JSON.stringify(result,null,2)+'\n';
if(process.env.BRIDGE_PROOF_OUTPUT)writeFileSync(process.env.BRIDGE_PROOF_OUTPUT,output);
console.log(JSON.stringify({status:result.status,observedAt:result.observedAt,integrationSha:expected,pages:pageCount,resources:entries.length,links:links.length,proofSha256:sha(output)}));
