import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { collectPreviewResources } from '../preview-resources.mjs';

const port=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const password=randomBytes(24).toString('hex');
const child=spawn(process.execPath,['public-entry.js'],{env:{...process.env,PORT:String(port),ADMIN_PASSWORD:password,GIT_COMMIT:'2222222222222222222222222222222222222222'},stdio:'ignore'});
const base='http://127.0.0.1:'+port;
try{
  let ready=false;
  for(let i=0;i<80;i++){
    try{const r=await fetch(base+'/health');if(r.ok){ready=true;break;}}catch{}
    await new Promise(r=>setTimeout(r,75));
  }
  assert.ok(ready,'Runtime startup');
  const login=await fetch(base+'/atelier',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password}),redirect:'manual'});
  assert.equal(login.status,303);
  const cookie=login.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie,'Session cookie required');
  const {resources,links,pageCount}=collectPreviewResources();
  for(const [relative,item] of resources){
    const url=base+'/atelier/file/'+encodeURIComponent(relative);
    const denied=await fetch(url);
    assert.equal(denied.status,401,'Unauthenticated '+relative);
    const response=await fetch(url,{headers:{cookie}});
    assert.equal(response.status,200,relative);
    assert.match(response.headers.get('x-robots-tag')||'',/noindex/i);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),item.body,'Rendered bytes '+relative);
    if(relative.endsWith('.css'))assert.match(response.headers.get('content-type')||'',/text\/css/);
  }
  const legacy=await fetch(base+'/atelier/file/lmi-musee-complet%2Findex.html?password='+password);
  assert.equal(legacy.status,401,'No query-string authentication');
  for(const relative of ['..%2Fpackage.json','%E0%A4%A','lmi-musee-complet%2Fmissing.html']){
    const r=await fetch(base+'/atelier/file/'+relative,{headers:{cookie}});
    assert.ok([400,404].includes(r.status),'Invalid draft path rejected');
  }
  assert.equal((await fetch(base+'/health')).status,200,'Runtime survives invalid paths');
  console.log('PREVIEW_NAVIGATION_PASS '+JSON.stringify({pages:pageCount,resources:resources.size,links:links.length,unauthorizedDenied:resources.size,sessionAuthentication:true}));
}finally{child.kill('SIGTERM');}
