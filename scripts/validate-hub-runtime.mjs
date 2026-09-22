import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const port=4191;
const password='hub-runtime-validator';
const child=spawn(process.execPath,['public-entry.js'],{
  cwd:process.cwd(),
  env:{...process.env,PORT:String(port),ADMIN_PASSWORD:password},
  stdio:['ignore','pipe','pipe']
});
let stderr='';
child.stderr.on('data',(chunk)=>{stderr+=chunk});
const wait=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
async function request(path,opts={}){return fetch(`http://127.0.0.1:${port}${path}`,{redirect:'manual',...opts});}

try{
  let ready=false;
  for(let i=0;i<40;i++){
    try{const r=await request('/health');if(r.ok){ready=true;break;}}catch{}
    await wait(100);
  }
  if(!ready)throw new Error(`Bridge runtime failed to start: ${stderr}`);

  const robots=await request('/robots.txt');
  const robotsText=await robots.text();
  if(!robots.ok||robotsText!=='User-agent: *\nDisallow: /\n')throw new Error('Private Bridge robots.txt must disallow all crawling');
  const deniedSitemap=await request('/sitemap.xml');
  if(deniedSitemap.status!==401)throw new Error(`Unauthenticated private sitemap expected 401, got ${deniedSitemap.status}`);

  const denied=await request('/api/hub-integrity');
  if(denied.status!==401)throw new Error(`Unauthenticated integrity endpoint expected 401, got ${denied.status}`);

  const login=await request('/atelier',{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({password})
  });
  if(login.status!==303)throw new Error(`Bridge login expected 303, got ${login.status}`);
  const cookie=login.headers.get('set-cookie')?.split(';')[0]||'';
  if(!cookie.startsWith('lmi_session='))throw new Error('Bridge session cookie missing');
  const auth={headers:{cookie}};
  const recipe=await request('/atelier/recette',auth);
  const recipeHtml=await recipe.text();
  if(recipe.status!==423||!recipeHtml.includes('RECETTE HUMAINE SUSPENDUE'))throw new Error(`Suspended human recipe route expected 423 lock, got ${recipe.status}`);
  console.log('HUMAN_RECIPE_ROUTE_LOCK_PASS 423');
  const sitemap=await request('/sitemap.xml',auth);
  if(!sitemap.ok)throw new Error(`Authenticated sitemap failed: ${sitemap.status}`);
  const sitemapXml=await sitemap.text();
  const locs=[...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match)=>match[1]);
  if(locs.length!==32||locs[0]!=='https://editions.lesmotsimages.com/'||locs.some((value)=>/00-sommaire/i.test(value)))throw new Error(`Private Editions sitemap inventory invalid: ${locs.length}`);

  const root=await request('/');
  if(root.status!==303||root.headers.get('location')!=='/atelier')throw new Error('Bridge root must redirect to protected atelier');

  const home=await request(`/atelier/file/${encodeURIComponent('hub-lmi-editions/01-accueil.html')}`,auth);
  if(!home.ok)throw new Error(`Authenticated Hub home failed: ${home.status}`);
  const homeHtml=await home.text();
  if(!homeHtml.includes('<title>LMI Éditions — Accueil</title>'))throw new Error('Visitor home title is not current canonical title');
  if(!homeHtml.includes('Des mots qui deviennent images, mémoire et transmission.'))throw new Error('Visitor home H1 is not current canonical H1');
  if(/Brouillon Bridge|validation humaine obligatoire|bridge\.lesmotsimages\.com/i.test(homeHtml))throw new Error('Internal wording leaked into authenticated visitor home');

  const privateSommaire=await request(`/atelier/file/${encodeURIComponent('hub-lmi-editions/00-sommaire-hub-lmi-editions.html')}`,auth);
  if(!privateSommaire.ok)throw new Error(`Private sommaire failed: ${privateSommaire.status}`);
  const privateHtml=await privateSommaire.text();
  if(!/noindex/i.test(privateHtml))throw new Error('Private sommaire lost its noindex lock');

  const integrity=await request('/api/hub-integrity',auth);
  if(!integrity.ok)throw new Error(`Authenticated integrity endpoint failed: ${integrity.status}`);
  const manifest=await integrity.json();
  if(manifest.site!=='editions.lesmotsimages.com'||manifest.brand!=='LES MOTS IMAGÉS'||manifest.ready!==true||manifest.assets?.length!==4){
    throw new Error('Hub integrity manifest is incomplete');
  }
  for(const asset of manifest.assets){
    const response=await request(`/atelier/file/${encodeURIComponent(`hub-lmi-editions/assets/${asset.assetName}`)}`,auth);
    if(!response.ok)throw new Error(`Hub asset failed: ${asset.assetName}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    const sha=createHash('sha256').update(bytes).digest('hex');
    if(sha!==asset.servedSha256||sha!==asset.sourceSha256)throw new Error(`Runtime/source SHA mismatch for ${asset.assetName}`);
    if(response.headers.get('x-lmi-sha256')!==sha)throw new Error(`Runtime SHA header mismatch for ${asset.assetName}`);
    if(Number(response.headers.get('x-lmi-asset-bytes'))!==bytes.length)throw new Error(`Runtime length header mismatch for ${asset.assetName}`);
  }
  console.log('HUB_RUNTIME_INTEGRITY_PASS 4');
} finally {
  child.kill('SIGTERM');
}
