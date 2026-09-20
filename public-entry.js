import { createServer, request as httpRequest } from 'http';
import { spawn } from 'child_process';
import { randomBytes, timingSafeEqual } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listDraftFiles, readDraftHtml, readDraftAsset } from './drafts.js';
import { isAuthorized } from './security.js';
import { buildRuntimeRegistry } from './socle-v2/runtime-registry.mjs';
import { getHubAssetIntegrity } from './hub-asset-integrity.js';
import { listHubVisualProvenance } from './hub-provenance.js';

const __filename=fileURLToPath(import.meta.url);
const rootDir=path.dirname(__filename);
const port=Number(process.env.PORT||3000);
const internalPort=port+1;

const core=spawn(process.execPath,[path.join(rootDir,'server.js')],{
  env:{...process.env,PORT:String(internalPort),INTERNAL_CORE:'1'},
  stdio:['ignore','inherit','inherit']
});

function escapeHtml(value){return String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function sendHtml(res,html,status=200){res.writeHead(status,{'content-type':'text/html; charset=utf-8','x-robots-tag':'noindex, nofollow, noarchive','cache-control':'no-store','content-security-policy':"default-src 'self' 'unsafe-inline' data: https:; img-src 'self' data: https:; frame-ancestors 'self'"});res.end(html);}
function sendAsset(res,asset){res.writeHead(200,{'content-type':asset.contentType,'x-robots-tag':'noindex, nofollow, noarchive','cache-control':'no-store','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data: https:; sandbox"});res.end(asset.content);}
function sendJson(res,payload,status=200){const body=JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json; charset=utf-8','x-robots-tag':'noindex, nofollow, noarchive','cache-control':'no-store','content-length':Buffer.byteLength(body)});res.end(body);}

function readJsonFile(relativePath){
  const filePath=path.join(rootDir,relativePath);
  try{
    if(!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath,'utf8'));
  }catch{return null;}
}

function hubIntegrityManifest(){
  const assets=listHubVisualProvenance().map((p)=>{
    const integrity=getHubAssetIntegrity(p.assetName);
    return {...p,servedSha256:integrity.sha256,servedBytes:integrity.size,exactSourceBytes:integrity.sha256===p.sourceSha256};
  });
  return {
    site:'editions.lesmotsimages.com',
    brand:'LES MOTS IMAGÉS',
    ready:assets.length>0&&assets.every((a)=>a.exactSourceBytes===true),
    assets
  };
}

function readBoaJson(fileName){
  const filePath=path.join(rootDir,'drafts','boa-totem-soya',fileName);
  try{
    if(!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath,'utf8'));
  }catch{return null;}
}

function boaRuntimeStatus(){
  const manifest=readBoaJson('manifest-finalisation.json');
  const production=readBoaJson('PRODUCTION_STATUS.json');
  const recipePagePresent=Boolean(readDraftHtml('boa-totem-soya/25-recette-humaine-finale.html'));
  const schematicAssetReady=Boolean(readDraftAsset('boa-totem-soya/assets/roughs/planche-12.svg'));
  const recipeStatus=manifest?.humanRecipe||production?.humanRecipe||'UNKNOWN';
  const graphicsFinal=manifest?.schematicAssets?.finalArtwork===true;
  const recipeReady=recipePagePresent&&graphicsFinal&&recipeStatus==='READY';
  return {
    boaRecipeReady:recipeReady,
    boaRecipeStatus:recipeStatus,
    boaGraphicsFinal:graphicsFinal,
    boaVisualAuditRequired:!graphicsFinal,
    boaSchematicAssetsReady:schematicAssetReady,
    boaAssetReady:graphicsFinal,
    boaPreproductionReady:schematicAssetReady&&recipePagePresent,
    boaManifestStatus:manifest?.status||'UNKNOWN',
    boaProductionOverallStatus:production?.overallStatus||'UNKNOWN',
    boaPublicationStatus:production?.publication||'UNKNOWN',
    boaFinalModelSheetsDone:production?.visualFinal?.modelSheets?.done??null,
    boaFinalBdPagesDone:production?.visualFinal?.bdPages?.done??null,
    boaFinalAlbumSpreadsDone:production?.visualFinal?.albumSpreads?.done??null,
    boaFinalDaShotsDone:production?.visualFinal?.daShots?.done??null,
    boaVisualReferenceDriveId:manifest?.authoritativeVisualReference?.driveDocumentId||null,
    boaProductionDriveRoot:production?.authoritativeDriveProductionRoot||null
  };
}

const sessions=new Set();
function parseCookies(header=''){return Object.fromEntries(header.split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return i<0?[v,'']:[v.slice(0,i),decodeURIComponent(v.slice(i+1))];}));}
function hasSession(req){const token=parseCookies(req.headers.cookie||'').lmi_session||'';return token.length===64&&sessions.has(token);}
function createSession(res){const token=randomBytes(32).toString('hex');sessions.add(token);res.setHeader('set-cookie',`lmi_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);return token;}
async function parseForm(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw new Error('Request too large');}return Object.fromEntries(new URLSearchParams(raw).entries());}
function passwordMatches(value=''){const expected=process.env.ADMIN_PASSWORD||'';if(!expected||expected==='change-me')return false;const a=Buffer.from(String(value));const b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
function exchangeTokenMatches(req){
  const expected=process.env.LMI_EXCHANGE_TOKEN||'';
  const provided=String(req.headers['x-lmi-exchange-token']||'');
  if(!expected||!provided)return false;
  const a=Buffer.from(provided);const b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}

function loginPage(message=''){
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI — Accès protégé</title><style>:root{--b:#143B7D;--n:#0F2747;--g:#D4AF37;--i:#F6F1E8;--s:#75553F}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,var(--n),var(--b));font-family:Arial,sans-serif}.card{width:min(520px,100%);background:var(--i);border-radius:24px;padding:34px;box-shadow:0 30px 80px #0005;border-top:5px solid var(--g)}h1{margin:0 0 10px;color:var(--b);font:700 2.4rem Georgia,serif}p{color:var(--s);line-height:1.6}input,button{width:100%;font:inherit;padding:14px 16px;border-radius:10px}input{border:1px solid #143b7d44;background:#fff}button{margin-top:12px;border:0;background:var(--b);color:#fff;font-weight:900;cursor:pointer}.error{color:#8b1e2d;font-weight:800}</style></head><body><main class="card"><h1>Bridge LMI</h1><p>Bibliothèque privée de brouillons, préproductions et BAT.</p>${message?`<p class="error">${escapeHtml(message)}</p>`:''}<form method="post" action="/atelier"><input type="password" name="password" autocomplete="current-password" placeholder="Mot de passe" required><button type="submit">Ouvrir l’atelier</button></form></main></body></html>`;
}

function atelierPage(){
  const drafts=listDraftFiles();
  const cards=drafts.map((draft)=>`<article><div><strong>${escapeHtml(draft.title)}</strong><small>${escapeHtml(draft.relativePath)} · ${Math.ceil(draft.size/1024)} Ko</small></div><a href="/atelier/file/${encodeURIComponent(draft.relativePath)}" target="_blank" rel="noopener noreferrer">Ouvrir</a></article>`).join('');
  const boa=boaRuntimeStatus();
  const boaNotice=boa.boaRecipeStatus==='SUSPENDED'?'<div class="warning"><strong>LE BOA TOTEM DE SOYA — RECETTE SUSPENDUE.</strong> Le lot graphique est classé en production visuelle incomplète et requiert une QA visuelle réelle avant toute nouvelle validation humaine.</div>':'';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI — Brouillons privés</title><style>:root{--bleu:#143b7d;--nuit:#0f2747;--ocre:#cc7722;--ivoire:#f6f1e8;--sable:#75553f;--rouge:#85202d}*{box-sizing:border-box}body{margin:0;background:#ece9e2;color:#172238;font-family:Arial,sans-serif}header{background:linear-gradient(135deg,var(--nuit),var(--bleu));color:#fff;padding:35px max(20px,5vw);border-bottom:5px solid #d4af37}header h1{font-family:Georgia,serif;margin:0 0 8px;font-size:clamp(2rem,5vw,4rem)}main{max-width:1120px;margin:28px auto;padding:0 18px}.status,.warning{background:var(--ivoire);padding:18px;margin-bottom:22px;border-radius:10px}.status{border-left:6px solid var(--ocre)}.warning{border-left:6px solid var(--rouge)}article{display:flex;justify-content:space-between;gap:20px;align-items:center;background:#fff;border-radius:14px;padding:22px;margin:13px 0;box-shadow:0 8px 24px #0001}small{display:block;color:var(--sable);margin-top:7px}a{background:var(--bleu);color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;white-space:nowrap;font-weight:700}@media(max-width:700px){article{align-items:flex-start;flex-direction:column}}</style></head><body><header><h1>LES MOTS IMAGÉS — BRIDGE</h1><p>Atelier privé · aucun référencement · aucune publication</p></header><main>${boaNotice}<div class="status"><strong>${drafts.length} éléments protégés.</strong> Leur présence technique ne vaut pas validation artistique.</div>${cards||'<p>Aucun élément disponible.</p>'}</main></body></html>`;
}

function humanRecipePage(){
  const sites=[
    {
      name:'Musée',
      package:'b69cec0267ebccd6cf1f92369b9529b3d95ab7b679aa595ef5c7c11a66108ddf',
      home:'lmi-musee-complet/index.html',
      routes:[
        ['Accueil','lmi-musee-complet/index.html'],
        ['Collections','lmi-musee-complet/collections.html'],
        ['Expositions permanentes','lmi-musee-complet/expositions-permanentes.html'],
        ['Éducation & médiation','lmi-musee-complet/education-mediation.html'],
        ['Contact','lmi-musee-complet/contact.html'],
        ['Mentions légales','lmi-musee-complet/mentions-legales-confidentialite.html']
      ]
    },
    {
      name:'Maison',
      package:'e1aa1a94583fbe3bc6a5284d4581db2e1c5f152175832b9255b1eceead9b687d',
      home:'lmi-maison-site/00-bat-lmi-maison.html',
      routes:[
        ['Accueil','lmi-maison-site/00-bat-lmi-maison.html'],
        ['Collection inaugurale','lmi-maison-site/01-collection-inaugurale-lmi-maison.html'],
        ['Parcours commercial privé','lmi-maison-site/06-parcours-commercial-prive-lmi-maison.html'],
        ['Contact','lmi-maison-site/contact.html'],
        ['Mentions légales','lmi-maison-site/mentions-legales-confidentialite.html']
      ]
    },
    {
      name:'Food',
      package:'c7b75fb1620af0ab2e458fe2a2645f1457d9fb7f828c7ded2bd73f3c977aeb22',
      home:'lmi-food-site/00-bat-lmi-food.html',
      routes:[
        ['Accueil','lmi-food-site/00-bat-lmi-food.html'],
        ['Petits déjeuners & collations','lmi-food-site/02-petits-dejeuners-collations.html'],
        ['Épicerie & condiments','lmi-food-site/04-epicerie-condiments.html'],
        ['Collection éditoriale recettes','lmi-food-site/08-collection-editoriale-recettes.html'],
        ['Contact','lmi-food-site/contact.html'],
        ['Mentions légales','lmi-food-site/mentions-legales-confidentialite.html']
      ]
    },
    {
      name:'Éditions',
      package:'243e32f45196f6914374716ecf1d92611b477e6e5bf756ffa31f12750b1d2b59',
      home:'hub-lmi-editions/01-accueil.html',
      routes:[
        ['Accueil','hub-lmi-editions/01-accueil.html'],
        ['Catalogue éditorial','hub-lmi-editions/11-catalogue-editorial.html'],
        ['Presse · partenaires · droits','hub-lmi-editions/19-presse-partenaires-droits.html'],
        ['Contact','hub-lmi-editions/05-contact.html'],
        ['Mentions légales','hub-lmi-editions/20-mentions-legales-confidentialite.html']
      ]
    }
  ];
  const cards=sites.map(site=>{
    const buttons=site.routes.map(([label,route])=>`<span class="route" aria-disabled="true">${escapeHtml(label)}</span>`).join('');
    return `<section class="site"><div class="siteHead"><div><span class="eyebrow">CANDIDAT DE RECETTE</span><h2>${escapeHtml(site.name)}</h2><code>${escapeHtml(site.package)}</code></div><span class="open" aria-disabled="true">Recette suspendue</span></div><div class="routes">${buttons}</div></section>`;
  }).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Recette humaine — LES MOTS IMAGÉS</title><style>:root{--b:#143B7D;--n:#0F2747;--g:#D4AF37;--o:#CC7722;--i:#F6F1E8;--s:#75553F}*{box-sizing:border-box}body{margin:0;background:#efede7;color:#172238;font-family:Arial,sans-serif}header{background:linear-gradient(135deg,var(--n),var(--b));color:#fff;padding:42px max(20px,5vw);border-bottom:5px solid var(--g)}h1,h2{font-family:Georgia,serif}h1{font-size:clamp(2.3rem,5vw,4.6rem);margin:0 0 8px}header p{margin:5px 0;max-width:900px;line-height:1.6}.bar{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.pill{display:inline-block;background:#ffffff16;border:1px solid #ffffff32;padding:8px 12px;border-radius:999px;font-weight:800}main{width:min(1180px,calc(100% - 32px));margin:30px auto 60px}.notice{background:var(--i);border-left:6px solid var(--o);padding:18px 20px;border-radius:12px;margin-bottom:22px;line-height:1.6}.site{background:#fff;border-radius:20px;margin:18px 0;padding:24px;box-shadow:0 14px 38px #0f274712}.siteHead{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.eyebrow{font-size:.72rem;letter-spacing:.14em;font-weight:900;color:var(--o)}h2{font-size:2rem;color:var(--b);margin:6px 0 8px}code{display:block;max-width:720px;overflow-wrap:anywhere;color:#5b6575}.open,.route{display:inline-block;text-decoration:none;font-weight:900;border-radius:999px}.open{background:var(--b);color:#fff;padding:13px 18px;white-space:nowrap}.routes{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.route{background:var(--i);color:var(--b);border:1px solid #143B7D22;padding:10px 14px}.help{margin-top:26px;background:#fff;padding:22px;border-radius:18px}.help strong{color:var(--b)}a:focus-visible{outline:3px solid var(--g);outline-offset:3px}@media(max-width:720px){.siteHead{flex-direction:column}.open{width:100%;text-align:center}}</style></head><body><header><h1>LES MOTS IMAGÉS — RECETTE SUSPENDUE</h1><p>Consolidation croisée des branches en cours. Cette interface ne constitue pas une cible de recette tant que le registre de réconciliation n’est pas fermé.</p><div class="bar"><span class="pill">Runtime ${escapeHtml((process.env.RENDER_GIT_COMMIT||process.env.GIT_COMMIT||'non résolu').slice(0,12))}</span><span class="pill">Render LIVE</span><span class="pill">Aucune publication publique</span></div></header><main><div class="notice"><strong>État :</strong> aucun contrôle humain à engager. Les candidats sont encore comparés et consolidés entre branches avant création d’une cible unique.</div>${cards}<div class="help"><strong>Ordre :</strong> Musée → Maison → Food → Éditions. Tester en priorité desktop 1440 px, iPhone 390 px et mobile 320 px.</div></main></body></html>`;
}

function proxy(req,res){
  const upstream=httpRequest({hostname:'127.0.0.1',port:internalPort,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${internalPort}`}},(upstreamRes)=>{res.writeHead(upstreamRes.statusCode||502,upstreamRes.headers);upstreamRes.pipe(res);});
  upstream.on('error',()=>{res.writeHead(503,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify({error:'Bridge core is starting'}));});
  req.pipe(upstream);
}

const server=createServer(async(req,res)=>{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  const query=Object.fromEntries(url.searchParams.entries());
  if(req.method==='GET'&&url.pathname==='/'){res.writeHead(303,{location:'/atelier'});return res.end();}
  if(req.method==='GET'&&url.pathname==='/atelier'){
    if(!(hasSession(req)||isAuthorized({headers:req.headers})))return sendHtml(res,loginPage());
    return sendHtml(res,atelierPage());
  }
  if(req.method==='POST'&&url.pathname==='/atelier'){
    const body=await parseForm(req);
    if(!passwordMatches(body.password))return sendHtml(res,loginPage('Mot de passe incorrect.'),401);
    createSession(res);res.writeHead(303,{location:'/atelier','cache-control':'no-store'});return res.end();
  }
  if(req.method==='GET'&&url.pathname==='/atelier/recette'){
    if(!(hasSession(req)||isAuthorized({headers:req.headers})))return sendHtml(res,loginPage('Accès refusé.'),401);
    return sendHtml(res,humanRecipePage());
  }
  if(req.method==='GET'&&url.pathname==='/api/hub-integrity'){
    if(!(hasSession(req)||isAuthorized({headers:req.headers})))return sendJson(res,{error:'Unauthorized'},401);
    return sendJson(res,hubIntegrityManifest());
  }
  if(req.method==='GET'&&url.pathname==='/api/socle-v2/private-app-exchange'){
    if(!(hasSession(req)||isAuthorized({headers:req.headers})||exchangeTokenMatches(req)))return sendJson(res,{error:'Unauthorized'},401);
    const proof=readJsonFile('socle-v2/status/private-app-sites-exchange-2026-09-17.json');
    if(!proof)return sendJson(res,{error:'Exchange proof unavailable'},503);
    return sendJson(res,proof);
  }
  if(req.method==='GET'&&url.pathname==='/api/socle-v2/runtime'){
    if(!(hasSession(req)||isAuthorized({headers:req.headers})))return sendJson(res,{error:'Unauthorized'},401);
    const integrationSha=process.env.RENDER_GIT_COMMIT||process.env.GIT_COMMIT||null;
    return sendJson(res,buildRuntimeRegistry({integrationSha}));
  }
  if(req.method==='GET'&&url.pathname.startsWith('/atelier/file/')){
    if(!(hasSession(req)||isAuthorized({headers:req.headers})))return sendHtml(res,loginPage('Accès refusé.'),401);
    const encoded=url.pathname.slice('/atelier/file/'.length);
    let relativePath='';
    try{relativePath=decodeURIComponent(encoded);}catch{return sendHtml(res,'<h1>Chemin invalide</h1>',400);}
    const html=readDraftHtml(relativePath);
    if(html)return sendHtml(res,html);
    const asset=readDraftAsset(relativePath);
    if(asset){
      if(/^hub-lmi-editions\/assets\/[^/]+$/i.test(relativePath)){
        const name=relativePath.split('/').pop();
        try{
          const integrity=getHubAssetIntegrity(name);
          res.setHeader('x-lmi-sha256',integrity.sha256);
          res.setHeader('x-lmi-asset-bytes',String(integrity.size));
        }catch{}
      }
      return sendAsset(res,asset);
    }
    return sendHtml(res,'<h1>Élément ou asset introuvable</h1>',404);
  }
  if(req.method==='GET'&&(url.pathname==='/health'||url.pathname==='/api/health')){
    const boa=boaRuntimeStatus();
    res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    return res.end(JSON.stringify({ok:true,service:'cillo-zoho-bridge',publicAtelier:false,drafts:listDraftFiles().length,adminPasswordConfigured:Boolean(process.env.ADMIN_PASSWORD&&process.env.ADMIN_PASSWORD!=='change-me'),...boa,revision:process.env.RENDER_GIT_COMMIT||process.env.GIT_COMMIT||null}));
  }
  return proxy(req,res);
});

server.listen(port,'0.0.0.0',()=>console.log(`Bridge protected atelier running on port ${port}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{core.kill(signal);server.close(()=>process.exit(0));});
