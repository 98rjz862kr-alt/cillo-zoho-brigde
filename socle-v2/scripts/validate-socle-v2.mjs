import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(process.cwd(), 'socle-v2');
const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const ALLOWED_SITES = new Set(['editions', 'food', 'maison', 'musee']);
const ALLOWED_RIGHTS = new Set(['cleared', 'restricted', 'unknown']);
const ALLOWED_STATUS = new Set(['PASS', 'NO_GO', 'NOT_RUN']);

function fail(message) {
  console.error(`SOCLE_V2_FAIL: ${message}`);
  process.exitCode = 1;
}

function parseJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch (error) { fail(`${path.relative(process.cwd(), file)}: JSON invalide (${error.message})`); return null; }
}

function validateTokens() {
  const file = path.join(ROOT, 'tokens.json');
  const data = parseJson(file);
  if (!data) return;
  if (data?.brand?.canonicalName !== 'LES MOTS IMAGÉS') fail('tokens.json: nom canonique incorrect');
  if (data?.brand?.tagline !== 'LE VERBE PAR L’IMAGE') fail('tokens.json: signature incorrecte');
  const expected = {
    blue:'#143B7D', ochre:'#CC7722', sand:'#75553F', gold:'#D4AF37',
    night:'#0F2747', ivory:'#F6F1E8', matteGold:'#C8A96B', stone:'#C9C3BA'
  };
  for (const [key, value] of Object.entries(expected)) {
    if (data?.color?.[key] !== value) fail(`tokens.json: couleur ${key} attendue ${value}`);
  }
}

function validateManifest(file) {
  const data = parseJson(file);
  if (!data) return;
  const rel = path.relative(process.cwd(), file);
  const site = data?.site?.id;
  if (!ALLOWED_SITES.has(site)) fail(`${rel}: site.id invalide`);
  if (!HEX40.test(data?.candidate?.sourceSha || '')) fail(`${rel}: candidate.sourceSha invalide`);
  if (!HEX64.test(data?.candidate?.packageSha256 || '')) fail(`${rel}: candidate.packageSha256 invalide`);
  if (!HEX40.test(data?.integration?.sourceSha || '')) fail(`${rel}: integration.sourceSha invalide`);
  if (!HEX64.test(data?.build?.sha256 || '')) fail(`${rel}: build.sha256 invalide`);
  if (!HEX40.test(data?.runtime?.integrationSha || '')) fail(`${rel}: runtime.integrationSha invalide`);
  if (data?.runtime?.integrationSha !== data?.integration?.sourceSha) fail(`${rel}: divergence integration.sourceSha/runtime.integrationSha`);
  if (!HEX64.test(data?.runtime?.packageSha256 || '')) fail(`${rel}: runtime.packageSha256 invalide`);
  if (data?.runtime?.packageSha256 !== data?.candidate?.packageSha256) fail(`${rel}: contenu runtime différent du paquet candidat`);
  if (!HEX64.test(data?.mediaManifest?.sha256 || '')) fail(`${rel}: mediaManifest.sha256 invalide`);
  if (!Array.isArray(data?.mediaManifest?.items)) fail(`${rel}: mediaManifest.items absent`);
  for (const item of data?.mediaManifest?.items || []) {
    if (!item?.path) fail(`${rel}: média sans path`);
    if (!HEX64.test(item?.sha256 || '')) fail(`${rel}: média ${item?.path || '?'} sans SHA-256 valide`);
    if (!item?.provenance) fail(`${rel}: média ${item?.path || '?'} sans provenance`);
    if (!ALLOWED_RIGHTS.has(item?.rightsStatus)) fail(`${rel}: média ${item?.path || '?'} rightsStatus invalide`);
  }
  if (!ALLOWED_STATUS.has(data?.recipeGate?.status)) fail(`${rel}: recipeGate.status invalide`);
  if (data?.recipeGate?.status === 'PASS') {
    if (data?.recipeGate?.p0 !== 0 || data?.recipeGate?.p1 !== 0) fail(`${rel}: PASS interdit si p0/p1 ne sont pas à 0`);
    if ((data?.mediaManifest?.items || []).some((item) => item.rightsStatus === 'unknown')) fail(`${rel}: PASS interdit avec droits média inconnus`);
  }
}

function validateStructure() {
  const required = [
    'tokens.json','site-manifest.schema.json','styles/lmi-tokens.css','styles/lmi-base.css',
    'components/site-shell.js','components/footer.js','contracts/seo.schema.json',
    'contracts/security.json','contracts/qa-gate.json','recipe/musee-human-recipe-2026-09-15.json','deploy-guard.json'
  ];
  for (const rel of required) if (!existsSync(path.join(ROOT, rel))) fail(`fichier requis absent: ${rel}`);
}

function validateBrandInSocle() {
  const roots = ['components','styles','contracts','examples'];
  const textExtensions = new Set(['.md','.json','.js','.mjs','.css','.html']);
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const ent of readdirSync(dir,{withFileTypes:true})) {
      const full=path.join(dir,ent.name);
      if (ent.isDirectory()) walk(full);
      else if (textExtensions.has(path.extname(ent.name))) {
        const rel=path.relative(ROOT,full);
        const text=readFileSync(full,'utf8');
        if (/LES MOTS IMAGES|Les Mots Images/.test(text)) fail(`${rel}: variante de marque non canonique`);
      }
    }
  }
  for (const root of roots) walk(path.join(ROOT,root));
}

function validateDeployGuard() {
  const file=path.join(ROOT,'deploy-guard.json');
  const data=parseJson(file);
  if (!data) return;
  if (data.branch!=='main'||data.autoDeploy!==true) fail('deploy guard: configuration Render inattendue');
  if (data.liveSourceSha!=='f8d046bdfea2c0854364579cca59cbd2fd85a8b9') fail('deploy guard: snapshot Musée LIVE inattendu');
  if (data.museumRecipePending!==true) fail('deploy guard: recette Musée doit rester en attente');
  if (data.mergeMainAllowed!==false||data.manualDeployAllowed!==false) fail('deploy guard: publication prématurée autorisée');
}

function validateMuseumRecipe() {
  const file=path.join(ROOT,'recipe/musee-human-recipe-2026-09-15.json');
  const data=parseJson(file);
  if (!data) return;
  if (data.historicalFrozenSourceSha!=='f8d046bdfea2c0854364579cca59cbd2fd85a8b9') fail('recette Musée: SHA historique gelé incorrect');
  if (data.historicalFrozenPackageSha256!=='ec2a52a24e6de4d88f67422484a977c176d34be32359d32aec0a0067fb1fd4cd') fail('recette Musée: paquet historique gelé incorrect');
  if (data.historicalBlocker!=='BRAND_IDENTITY_NON_CANONICAL_LES_MOTS_IMAGES') fail('recette Musée: blocage de marque historique absent');
  if (data.targetSourceSha!=='a8bd193b9f227aa4ab781ab3e71c9aa64d3ef92c') fail('recette Musée: SHA candidat corrigé incorrect');
  if (data.targetPackageSha256!=='2c7925dea160966350d995c1172115091a3846e31221fa88825341cb9435b1ea') fail('recette Musée: paquet candidat corrigé incorrect');
  if (!Array.isArray(data.checks)||data.checks.length<12) fail('recette Musée: contrôles humains incomplets');
  if (data.decision==='WAITING_FOR_CORRECTED_BRIDGE_CANDIDATE' && (data.checks||[]).some((c)=>c.result!=='BLOCKED_PENDING_CORRECTED_RUNTIME')) fail('recette Musée: contrôles doivent rester bloqués avant convergence runtime');
  if (data.decision==='HUMAN_RECIPE_REQUIRED' && (data.checks||[]).some((c)=>c.result!=='PENDING')) fail('recette Musée: résultat humain prérempli interdit');
}

validateStructure();
validateTokens();
validateBrandInSocle();
validateMuseumRecipe();
validateDeployGuard();
const manifestDir = path.join(ROOT, 'site-manifests');
if (existsSync(manifestDir)) {
  for (const name of readdirSync(manifestDir).filter((name) => name.endsWith('.json')).sort()) {
    validateManifest(path.join(manifestDir, name));
  }
}

if (!process.exitCode) console.log('SOCLE_V2_PASS');
