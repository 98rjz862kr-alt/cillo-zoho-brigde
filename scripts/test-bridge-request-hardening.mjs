import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Exercise real HTTP requests with an ephemeral credential on a local child server.
const root=process.env.LMI_REQUEST_TEST_ROOT||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=randomInt(46000,49000);
const password=randomBytes(24).toString('hex');
const child=spawn(process.execPath,['public-entry.js'],{
  cwd:root,
  env:{...process.env,PORT:String(port),ADMIN_PASSWORD:password,RENDER:'false',NODE_ENV:'test'},
  stdio:['ignore','pipe','pipe'],
  detached:process.platform!=='win32'
});
let diagnostic='';
child.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk).slice(-6000);});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const request=(route,options={})=>fetch(`http://127.0.0.1:${port}${route}`,{redirect:'manual',signal:AbortSignal.timeout(5000),...options});
let checks=0;
async function expectStatus(route,status,options={}){
  const response=await request(route,options);
  assert.equal(response.status,status,`${route} status`);
  checks++;
  return response;
}

try{
  let ready=false;
  for(let i=0;i<50;i++){
    try{if((await request('/health')).status===200){ready=true;break;}}catch{}
    if(child.exitCode!==null)break;
    await delay(100);
  }
  assert.ok(ready,`Local Bridge did not start: ${diagnostic}`);
  await expectStatus('/api/socle-v2/runtime',401);
  await expectStatus('/atelier/file/hub-lmi-editions%2F01-accueil.html',401);

  await expectStatus('/atelier',200,{headers:{cookie:'lmi_session=%E0%A4%A'}});
  await expectStatus('/api/socle-v2/runtime',401,{headers:{cookie:'lmi_session=%ZZ'}});
  await expectStatus('/health',200);

  for(const oversizedBody of ['password='+'x'.repeat(5000),'password='+'é'.repeat(2100)]){
    await expectStatus('/atelier',413,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:oversizedBody});
    await expectStatus('/health',200);
  }
  await expectStatus('/atelier',401,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'password=incorrect'});
  const login=await expectStatus('/atelier',303,{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded','x-forwarded-proto':'https'},
    body:new URLSearchParams({password})
  });
  const setCookie=login.headers.get('set-cookie')||'';
  for(const attribute of ['HttpOnly','SameSite=Strict','Max-Age=28800','Secure']){
    assert.ok(setCookie.split(';').map(part=>part.trim()).includes(attribute),`Session cookie must have ${attribute}`);
    checks++;
  }
  const cookie=setCookie.split(';')[0];
  await expectStatus('/atelier',200,{headers:{cookie}});
  await expectStatus('/atelier/recette',423,{headers:{cookie}});
  await expectStatus('/atelier/file/%ZZ',400,{headers:{cookie}});
  await expectStatus('/api/socle-v2/runtime',401,{headers:{cookie:'lmi_session='+'0'.repeat(64)}});
  await expectStatus('/health',200);
  assert.equal(child.exitCode,null,'Server must survive invalid requests');
  checks++;
  console.log(JSON.stringify({status:'PASS',checks,scope:'Local HTTP authentication, malformed cookies, oversized forms, session cookie flags, protected recipe and server survival'}));
}finally{
  try{
    if(process.platform!=='win32')process.kill(-child.pid,'SIGTERM');
    else child.kill('SIGTERM');
  }catch{}
}
