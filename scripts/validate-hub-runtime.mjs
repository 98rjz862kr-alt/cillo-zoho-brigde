import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const port=4191;
const password='hub-runtime-validator';
const child=spawn(process.execPath,['public-entry.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),ADMIN_PASSWORD:password},stdio:['ignore','pipe','pipe']});
let stderr='';
child.stderr.on('data',(chunk)=>{stderr+=chunk});
const wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
async function request(path){return fetch(`http://127.0.0.1:${port}${path}`,{redirect:'manual'});}
try{
  let ready=false;
  for(let i=0;i<30;i++){try{const r=await request('/health');if(r.ok){ready=true;break;}}catch{}await wait(100);}
  if(!ready)throw new Error(`Bridge runtime failed to start: ${stderr}`);
  const denied=await request('/api/hub-integrity');
  if(denied.status!==401)throw new Error(`Unauthenticated integrity endpoint expected 401, got ${denied.status}`);
  const root=await request('/');
  if(root.status!==303||root.headers.get('location')!=='/atelier')throw new Error('Bridge root must redirect to protected atelier');
  const integrity=await request(`/api/hub-integrity?password=${encodeURIComponent(password)}`);
  if(!integrity.ok)throw new Error(`Authenticated integrity endpoint failed: ${integrity.status}`);
  const manifest=await integrity.json();
  if(manifest.site!=='www.lesmotsimages.com'||manifest.ready!==true||manifest.assets?.length!==3)throw new Error('Hub integrity manifest is incomplete');
  for(const asset of manifest.assets){
    const response=await request(`/atelier/file/${encodeURIComponent(`hub-lmi-editions/assets/${asset.assetName}`)}?password=${encodeURIComponent(password)}`);
    if(!response.ok)throw new Error(`Hub asset failed: ${asset.assetName}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    const sha=createHash('sha256').update(bytes).digest('hex');
    if(sha!==asset.servedSha256)throw new Error(`Runtime SHA mismatch for ${asset.assetName}`);
    if(response.headers.get('x-lmi-sha256')!==sha)throw new Error(`Runtime SHA header mismatch for ${asset.assetName}`);
    if(Number(response.headers.get('content-length'))!==bytes.length)throw new Error(`Runtime length mismatch for ${asset.assetName}`);
  }
  console.log('Validated live private Hub runtime: auth gate, root redirect, integrity manifest and exact SHA-256 headers for 3 served WebP assets.');
} finally {
  child.kill('SIGTERM');
}
