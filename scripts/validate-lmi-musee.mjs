import { readFileSync, existsSync } from 'fs';
import path from 'path';

const root = path.resolve('drafts/lmi-musee-complet');
const archivedPages = [
  'sommaire.html','expositions-permanentes.html','expositions-temporaires.html','archives.html','collections.html',
  'dossiers-documentaires.html','recherche-transmission.html','atlas-humanites.html','education-mediation.html',
  'vision-mission.html','visiter.html','soutenir.html','partenaires.html','presse-droits.html'
];
const publicPages = [
  'index.html','pourquoi-un-musee-lmi-editions.html','comprendre-le-monde-par-ses-peripheries.html',
  'archives-fonds-traces.html','collections-editoriales.html',
  'collections-editoriales/atlas-des-humanites-disparues.html','collections-editoriales/les-routes-invisibles.html',
  'collections-editoriales/archives-des-seuils.html','principes-curatoriaux.html','references-et-filiations.html',
  'journal-de-construction.html','contact.html','mentions-legales-confidentialite.html',
  'parcours/presse.html','parcours/partenaires.html','parcours/programmateurs.html','parcours/prescripteurs.html'
];
const requiredColors = ['#143B7D','#CC7722','#75553F','#D4AF37','#0F2747','#F6F1E8','#C8A96B','#C9C3BA'];
const forbiddenVisual = ['neon violet','turquoise cyberpunk','rose fluo','vert hors charte','rpg fantasy','fond parchemin surcharge'];
const forbiddenPublic = ['candidat privé','brouillon privé','accès privé','recette humaine','non publié','source canonique : drive','placeholder','texte atelier','à compléter','a completer','a_requalifier'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(existsSync(path.join(root,'styles.css')),'LMI Musée styles.css missing');
assert(existsSync(path.join(root,'assets/lmi-logo-officiel.svg')),'Official LMI logo wrapper missing');
assert(existsSync(path.join(root,'assets/lmi-logo-main.webp')),'Official LMI logo image missing');
assert(existsSync(path.join(root,'source-manifest.json')),'Museum source manifest missing');
assert(existsSync(path.join(root,'robots.txt')),'Museum robots.txt missing');
assert(existsSync(path.join(root,'sitemap.xml')),'Museum sitemap.xml missing');
const css=readFileSync(path.join(root,'styles.css'),'utf8');
for(const color of requiredColors) assert(css.includes(color),`Missing strict LMI color ${color}`);
assert(css.includes(':focus-visible'),'Keyboard focus style missing');
assert(/@media\(max-width:900px\)/.test(css),'Responsive breakpoint missing');

for(const page of [...archivedPages,...publicPages]){
  const full=path.join(root,page); assert(existsSync(full),`Missing LMI Musée page: ${page}`);
  const html=readFileSync(full,'utf8'); const lower=html.toLowerCase();
  assert(/assets\/lmi-logo-officiel\.svg/.test(html),`Official logo missing: ${page}`);
  assert(/styles\.css/.test(html),`Shared visual system missing: ${page}`);
  assert(/LMI Musée/i.test(html),`Museum identity missing: ${page}`);
  for(const term of forbiddenVisual) assert(!lower.includes(term),`Forbidden visual direction found in ${page}: ${term}`);
}
for(const page of archivedPages){
  const html=readFileSync(path.join(root,page),'utf8');
  assert(/noindex,nofollow,noarchive/i.test(html),`Archive robots lock missing: ${page}`);
}
for(const page of publicPages){
  const html=readFileSync(path.join(root,page),'utf8'); const lower=html.toLowerCase();
  assert(/name=["']robots["'][^>]*content=["']index,follow["']/i.test(html),`Public robots index,follow missing: ${page}`);
  assert(/rel=["']canonical["'][^>]*https:\/\/musee\.lesmotsimages\.com/i.test(html),`Canonical URL missing: ${page}`);
  for(const term of forbiddenPublic) assert(!lower.includes(term),`Private/unfinished marker '${term}' in public page ${page}`);
}
const contact=readFileSync(path.join(root,'contact.html'),'utf8');
assert(contact.includes('mailto:lesmotsimages@gmail.com'),'Museum public contact email missing');
const legal=readFileSync(path.join(root,'mentions-legales-confidentialite.html'),'utf8');
for(const value of ['LMI Éditions — Les Mots Images','BAABOY CILLO','lesmotsimages@gmail.com']) assert(legal.includes(value),`Legal page missing ${value}`);
const index=readFileSync(path.join(root,'index.html'),'utf8');
for(const collection of ['Atlas des humanités disparues','Les routes invisibles','Archives des seuils']) assert(index.includes(collection),`Launch collection missing from home: ${collection}`);
const robots=readFileSync(path.join(root,'robots.txt'),'utf8');
assert(robots.includes('Allow: /'),'robots.txt does not allow public crawl');
assert(robots.includes('Disallow: /notices/'),'robots.txt does not protect hypothesis notices');
assert(robots.includes('https://musee.lesmotsimages.com/sitemap.xml'),'robots.txt sitemap missing');
const sitemap=readFileSync(path.join(root,'sitemap.xml'),'utf8');
for(const page of publicPages){
  const route=page==='index.html'?'':page.replace(/\.html$/,'');
  assert(sitemap.includes(`https://musee.lesmotsimages.com/${route}`),`Public page missing from sitemap: ${page}`);
}
assert(!sitemap.includes('/notices/'),'Hypothesis notices leaked into sitemap');
const manifest=JSON.parse(readFileSync(path.join(root,'source-manifest.json'),'utf8'));
assert(manifest.status==='READY_TO_PUBLISH','Source manifest is not READY_TO_PUBLISH');
assert(!manifest.documents.some(d=>d.status==='A_REQUALIFIER'),'Blocking A_REQUALIFIER source remains');
console.log(`Validated LMI Musée publication: ${publicPages.length} public pages ready, ${archivedPages.length} archived routes locked, sitemap/robots ready, official identity, strict palette, contact and legal layer present.`);
