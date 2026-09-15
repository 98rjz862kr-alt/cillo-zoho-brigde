const base=(process.env.BRIDGE_BASE_URL||'').replace(/\/$/,'');
const password=process.env.ADMIN_PASSWORD||'';
const expectedIntegration=process.env.EXPECTED_INTEGRATION_SHA||'';

if(!/^https?:\/\//.test(base)) throw new Error('BRIDGE_BASE_URL requis');
if(!password) throw new Error('ADMIN_PASSWORD requis');
if(!/^[0-9a-f]{40}$/.test(expectedIntegration)) throw new Error('EXPECTED_INTEGRATION_SHA invalide');

const headers={'x-admin-password':password};
const cases=[
  ['editions','hub-lmi-editions/01-accueil.html'],
  ['food','lmi-food-site/00-bat-lmi-food.html'],
  ['maison','lmi-maison-site/00-bat-lmi-maison.html'],
  ['musee','lmi-musee-complet/index.html']
];

async function request(path,auth=true){
  return fetch(`${base}${path}`,{headers:auth?headers:{},redirect:'manual'});
}

const health=await request('/health',false);
if(!health.ok) throw new Error(`health ${health.status}`);
const healthJson=await health.json();
if(healthJson.revision!==expectedIntegration) throw new Error(`revision distante ${healthJson.revision} != ${expectedIntegration}`);
const denied=await request('/api/socle-v2/runtime',false);
if(denied.status!==401) throw new Error(`runtime public attendu 401, reçu ${denied.status}`);

const runtime=await request('/api/socle-v2/runtime',true);
if(!runtime.ok) throw new Error(`runtime auth ${runtime.status}`);
const manifest=await runtime.json();
if(manifest.brand!=='LES MOTS IMAGÉS') throw new Error('marque distante non canonique');
if(manifest.integrationSha!==expectedIntegration) throw new Error('integrationSha distant divergent');

for(const [site,relative] of cases){
  const encoded=encodeURIComponent(relative);
  const deniedPage=await request(`/atelier/file/${encoded}`,false);
  if(deniedPage.status!==401) throw new Error(`${site}: page publique attendue 401, reçue ${deniedPage.status}`);
  const response=await request(`/atelier/file/${encoded}`,true);
  if(!response.ok) throw new Error(`${site}: ${response.status}`);
  const robots=response.headers.get('x-robots-tag')||'';
  if(!/noindex/i.test(robots)) throw new Error(`${site}: X-Robots-Tag noindex absent`);
  const html=await response.text();
  if(/LES MOTS IMAGES|Les Mots Images/.test(html)) throw new Error(`${site}: marque non canonique rendue`);
  const item=manifest.sites?.[site];
  if(!item?.exactCandidateContent) throw new Error(`${site}: contenu runtime différent du candidat`);
  if(item.runtimePackageSha256!==item.candidatePackageSha256) throw new Error(`${site}: SHA paquet distant divergent`);
}

console.log(JSON.stringify({status:'REMOTE_BRIDGE_PASS',integrationSha:expectedIntegration,sites:cases.length},null,2));
