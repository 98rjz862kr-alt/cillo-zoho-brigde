import { createServer, request as httpRequest } from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { listDraftFiles, readDraftHtml } from './drafts.js';
import { isAuthorized } from './security.js';

const __filename=fileURLToPath(import.meta.url);
const rootDir=path.dirname(__filename);
const port=Number(process.env.PORT||3000);
const internalPort=port+1;

const core=spawn(process.execPath,[path.join(rootDir,'server.js')],{
  env:{...process.env,PORT:String(internalPort)},
  stdio:['ignore','inherit','inherit']
});

function escapeHtml(value){return String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}

function sendHtml(res,html,status=200){res.writeHead(status,{'content-type':'text/html; charset=utf-8','x-robots-tag':'noindex, nofollow, noarchive','cache-control':'no-store','content-security-policy':"default-src 'self' 'unsafe-inline' data: https:; img-src 'self' data: https:; frame-ancestors 'self'"});res.end(html);}

function loginPage(message=''){
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI — Accès protégé</title><style>:root{--b:#143B7D;--n:#0F2747;--g:#D4AF37;--i:#F6F1E8;--s:#75553F}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,var(--n),var(--b));font-family:Arial,sans-serif}.card{width:min(520px,100%);background:var(--i);border-radius:24px;padding:34px;box-shadow:0 30px 80px #0005;border-top:5px solid var(--g)}h1{margin:0 0 10px;color:var(--b);font:700 2.4rem Georgia,serif}p{color:var(--s);line-height:1.6}input,button{width:100%;font:inherit;padding:14px 16px;border-radius:10px}input{border:1px solid #143b7d44;background:#fff}button{margin-top:12px;border:0;background:var(--b);color:#fff;font-weight:900;cursor:pointer}.error{color:#8b1e2d;font-weight:800}</style></head><body><main class="card"><h1>Bridge LMI</h1><p>Bibliothèque privée de brouillons et de BAT.</p>${message?`<p class="error">${escapeHtml(message)}</p>`:''}<form method="get" action="/atelier"><input type="password" name="password" autocomplete="current-password" placeholder="Mot de passe" required><button type="submit">Ouvrir l’atelier</button></form></main></body></html>`;
}

function atelierPage(password){
  const drafts=listDraftFiles();
  const q=`?password=${encodeURIComponent(password)}`;
  const cards=drafts.map((draft)=>`<article><div><strong>${escapeHtml(draft.title)}</strong><small>${escapeHtml(draft.relativePath)} · ${Math.ceil(draft.size/1024)} Ko</small></div><a href="/atelier/file/${encodeURIComponent(draft.relativePath)}${q}" target="_blank" rel="noopener noreferrer">Ouvrir le BAT</a></article>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI — Brouillons privés</title><style>:root{--bleu:#143b7d;--nuit:#0f2747;--ocre:#cc7722;--ivoire:#f6f1e8;--sable:#75553f}*{box-sizing:border-box}body{margin:0;background:#ece9e2;color:#172238;font-family:Arial,sans-serif}header{background:linear-gradient(135deg,var(--nuit),var(--bleu));color:#fff;padding:35px max(20px,5vw);border-bottom:5px solid #d4af37}header h1{font-family:Georgia,serif;margin:0 0 8px;font-size:clamp(2rem,5vw,4rem)}main{max-width:1120px;margin:28px auto;padding:0 18px}.status{background:var(--ivoire);border-left:6px solid var(--ocre);padding:18px;margin-bottom:22px;border-radius:10px}article{display:flex;justify-content:space-between;gap:20px;align-items:center;background:#fff;border-radius:14px;padding:22px;margin:13px 0;box-shadow:0 8px 24px #0001}small{display:block;color:var(--sable);margin-top:7px}a{background:var(--bleu);color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;white-space:nowrap;font-weight:700}@media(max-width:700px){article{align-items:flex-start;flex-direction:column}}</style></head><body><header><h1>LES MOTS IMAGES — BRIDGE</h1><p>Atelier privé de brouillons · aucun référencement · aucune publication</p></header><main><div class="status"><strong>${drafts.length} BAT protégés.</strong> Les rendus sont générés depuis l’état courant du dépôt Bridge.</div>${cards||'<p>Aucun BAT disponible.</p>'}</main></body></html>`;
}

function proxy(req,res){
  const upstream=httpRequest({hostname:'127.0.0.1',port:internalPort,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${internalPort}`}},(upstreamRes)=>{res.writeHead(upstreamRes.statusCode||502,upstreamRes.headers);upstreamRes.pipe(res);});
  upstream.on('error',()=>{res.writeHead(503,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify({error:'Bridge core is starting'}));});
  req.pipe(upstream);
}

const server=createServer((req,res)=>{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  const query=Object.fromEntries(url.searchParams.entries());
  if(req.method==='GET'&&url.pathname==='/'){res.writeHead(303,{location:'/atelier'});return res.end();}
  if(req.method==='GET'&&url.pathname==='/atelier'){
    if(!isAuthorized({headers:req.headers,query}))return sendHtml(res,loginPage(query.password?'Mot de passe incorrect.':''),query.password?401:200);
    return sendHtml(res,atelierPage(query.password));
  }
  if(req.method==='GET'&&url.pathname.startsWith('/atelier/file/')){
    if(!isAuthorized({headers:req.headers,query}))return sendHtml(res,loginPage('Accès au BAT refusé.'),401);
    const encoded=url.pathname.slice('/atelier/file/'.length);
    let relativePath='';
    try{relativePath=decodeURIComponent(encoded);}catch{return sendHtml(res,'<h1>Chemin invalide</h1>',400);}
    const html=readDraftHtml(relativePath);
    if(!html)return sendHtml(res,'<h1>BAT introuvable</h1>',404);
    return sendHtml(res,html);
  }
  if(req.method==='GET'&&(url.pathname==='/health'||url.pathname==='/api/health')){
    res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    return res.end(JSON.stringify({ok:true,service:'cillo-zoho-bridge',publicAtelier:false,drafts:listDraftFiles().length,adminPasswordConfigured:Boolean(process.env.ADMIN_PASSWORD&&process.env.ADMIN_PASSWORD!=='change-me')}));
  }
  return proxy(req,res);
});

server.listen(port,'0.0.0.0',()=>console.log(`Bridge protected atelier running on port ${port}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{core.kill(signal);server.close(()=>process.exit(0));});
