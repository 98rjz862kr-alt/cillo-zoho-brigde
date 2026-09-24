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
  identityGold: '#D4AF37',
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
        if (/#C9A13B/i.test(text)) fail(`${rel}: couleur de marque obsolète #C9A13B`);
      }
    }
  }
  for (const root of roots) walk(path.join(ROOT,root));
}

function validateDeployGuard() {
  const file=path.join(ROOT,'deploy-guard.json');
  const data=parseJson(file);
  if (!data) return;
  if (data.branch!=='work/socle-commun-v2-20260915'||data.autoDeploy!==false||data.autoDeployTrigger!=='off') fail('deploy guard: configuration Render inattendue');
  if (data.liveSourceSha!=='dfde95f972d584b4ecfe79b0d0ebab684002d73c') fail('deploy guard: runtime historique LIVE inattendu');
  if (data.liveDeployId!=='dep-dapcsnbm8hqs739bn6a0'||data.liveStatus!=='live_historical') fail('deploy guard: déploiement historique inattendu');
  if (data.liveRecipeEligible!==false||data.liveBlocker!=='LIVE_RUNTIME_NOT_EXACT_CURRENT_SOURCE') fail('deploy guard: recette doit rester verrouillée sur runtime historique');
  if (data.humanRecipePending!==true||data.humanRecipeStartAllowed!==false) fail('deploy guard: recette humaine doit rester suspendue');
  if (data.mergeMainAllowed!==false||data.publicPublicationAllowed!==false||data.dnsChangeAllowed!==false) fail('deploy guard: verrous de publication incorrects');
  if (data.privateBridgeDeployAllowed!==true||data.targetPolicy!=='LATEST_REQUALIFIED_CONSOLIDATED_HEAD') fail('deploy guard: déploiement privé exact doit rester autorisé après requalification');
  const expected={
    musee:'a3f2848ffbc12957a77ac897206522c3ca13eafffcc2ca711491a7f352c6dbf1',
    maison:'695fdbc0bc935d4dc31238ee375f35c86755a16080cc75ca15f539d39eb57926',
    food:'c7b75fb1620af0ab2e458fe2a2645f1457d9fb7f828c7ded2bd73f3c977aeb22',
    editions:'67ee1f124902612476b46b66532849f14c996fff22e54c619dd9665216fcf950'
  };
  for (const [site,sha] of Object.entries(expected)) if (data.requiredPackageSha256?.[site]!==sha) fail(`deploy guard: paquet source ${site} inattendu`);
}

function validateMuseumRecipe() {
  const file=path.join(ROOT,'recipe/musee-human-recipe-2026-09-15.json');
  const data=parseJson(file);
  if (!data) return;
  if (data.status!=='HISTORICAL_SUPERSEDED'||data.decision!=='SUPERSEDED_DO_NOT_RUN') fail('recette Musée historique: statut de déclassement incorrect');
  if (data.currentGate!=='human-recipe-gate-2026-09-20.json') fail('recette Musée historique: gate courant absent');
  if (data.historicalFrozenSourceSha!=='f8d046bdfea2c0854364579cca59cbd2fd85a8b9') fail('recette Musée: SHA historique gelé incorrect');
  if (data.historicalFrozenPackageSha256!=='ec2a52a24e6de4d88f67422484a977c176d34be32359d32aec0a0067fb1fd4cd') fail('recette Musée: paquet historique gelé incorrect');
  if (data.historicalBlocker!=='BRAND_IDENTITY_NON_CANONICAL_LES_MOTS_IMAGES') fail('recette Musée: blocage de marque historique absent');
  if (!Array.isArray(data.checks)||data.checks.length<12||(data.checks||[]).some((entry)=>entry.result!=='HISTORICAL_NOT_RUN')) fail('recette Musée historique: contrôles doivent rester non exécutés');
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

const brandRoles = JSON.parse(readFileSync(new URL('../contracts/lmi-brand-roles.v1.json', import.meta.url), 'utf8'));
if (brandRoles.brand !== 'LES MOTS IMAGÉS') fail('brand roles: nom incorrect');
if (brandRoles.schemaVersion !== '2.0.0') fail('brand roles: schema version incorrect');
if (brandRoles.authority?.path !== 'assets/brand/lmi-brand-authority.json' || brandRoles.authority?.schema !== 'lmi.brand.authority/1') fail('brand roles: canonical authority missing');
if (brandRoles.roles?.identityPrimary !== '#143B7D') fail('brand roles: identity blue incorrect');
if (brandRoles.roles?.identityAccent !== '#D4AF37') fail('brand roles: identity gold incorrect');
if (brandRoles.roles?.premiumAccent !== '#C8A96B') fail('brand roles: premium matte gold incorrect');
if (brandRoles.colors?.identity?.gold !== '#D4AF37' || brandRoles.colors?.palette?.gold !== '#D4AF37') fail('brand roles: gold must follow canonical authority');
if (brandRoles.colors?.premium?.matteGold !== '#C8A96B') fail('brand roles: matte gold incorrect');
if (brandRoles.rules?.unknownBrandColorForbidden !== true || brandRoles.rules?.identityGold !== '#D4AF37' || brandRoles.rules?.premiumMatteGold !== '#C8A96B' || brandRoles.rules?.identityAndPremiumGoldMustRemainDistinct !== true) fail('brand roles: governance incorrect');
if (brandRoles.roles?.identityAccent === brandRoles.roles?.premiumAccent) fail('brand roles: identity and premium gold must remain distinct');
if (JSON.stringify(brandRoles).includes('#C9A13B')) fail('brand roles: obsolete #C9A13B forbidden');
if (JSON.stringify(parseJson(path.join(ROOT,'tokens.json'))).includes('#C9A13B')) fail('tokens.json: obsolete #C9A13B forbidden');

if (!process.exitCode) console.log('SOCLE_V2_PASS');
