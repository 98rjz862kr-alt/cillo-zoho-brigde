import { readFileSync, existsSync } from 'fs';
import path from 'path';

const root = path.resolve('drafts/lmi-musee-complet');
const historicalPages = [
  'index.html','sommaire.html','expositions-permanentes.html','expositions-temporaires.html',
  'archives.html','collections.html','dossiers-documentaires.html','recherche-transmission.html',
  'atlas-humanites.html','education-mediation.html','vision-mission.html','visiter.html',
  'soutenir.html','partenaires.html','presse-droits.html'
];
const canonicalPages = [
  'pourquoi-un-musee-lmi-editions.html','comprendre-le-monde-par-ses-peripheries.html',
  'archives-fonds-traces.html','collections-editoriales.html',
  'collections-editoriales/atlas-des-humanites-disparues.html',
  'collections-editoriales/les-routes-invisibles.html',
  'collections-editoriales/archives-des-seuils.html',
  'principes-curatoriaux.html','references-et-filiations.html','journal-de-construction.html','contact.html'
];
const requiredColors = ['#143B7D','#CC7722','#75553F','#D4AF37','#0F2747','#F6F1E8','#C8A96B','#C9C3BA'];
const forbidden = ['neon violet','turquoise cyberpunk','rose fluo','vert hors charte','rpg fantasy','fond parchemin surcharge'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync(path.join(root, 'styles.css')), 'LMI Musée styles.css missing');
assert(existsSync(path.join(root, 'assets/lmi-logo-officiel.svg')), 'Official LMI logo wrapper missing');
assert(existsSync(path.join(root, 'assets/lmi-logo-main.webp')), 'Official LMI logo image missing');
assert(existsSync(path.join(root, 'source-manifest.json')), 'Museum source manifest missing');

const css = readFileSync(path.join(root, 'styles.css'), 'utf8');
for (const color of requiredColors) assert(css.includes(color), `Missing strict LMI color ${color}`);
assert(css.includes(':focus-visible'), 'Keyboard focus style missing');
assert(/@media\(max-width:900px\)/.test(css), 'Responsive breakpoint missing');

for (const page of [...historicalPages, ...canonicalPages]) {
  const full = path.join(root, page);
  assert(existsSync(full), `Missing LMI Musée page: ${page}`);
  const html = readFileSync(full, 'utf8');
  assert(/noindex,nofollow,noarchive/i.test(html), `Robots lock missing: ${page}`);
  assert(/assets\/lmi-logo-officiel\.svg/.test(html), `Official logo missing: ${page}`);
  assert(/styles\.css/.test(html), `Shared visual system missing: ${page}`);
  assert(/LMI Musée/i.test(html), `Museum identity missing: ${page}`);
  for (const term of forbidden) assert(!html.toLowerCase().includes(term), `Forbidden visual direction found in ${page}: ${term}`);
}

const sommaire = readFileSync(path.join(root, 'sommaire.html'), 'utf8');
for (const page of historicalPages.filter((p) => p !== 'sommaire.html')) {
  assert(sommaire.includes(page), `Sommaire does not preserve historical page ${page}`);
}
for (const page of canonicalPages) {
  assert(sommaire.includes(page), `Sommaire does not expose canonical page ${page}`);
}

const index = readFileSync(path.join(root, 'index.html'), 'utf8');
for (const label of ['Comprendre le monde par ses périphéries','Archives','Collections','Méthode','Références']) {
  assert(index.includes(label), `Canonical home navigation missing: ${label}`);
}
for (const collection of ['Atlas des humanités disparues','Les routes invisibles','Archives des seuils']) {
  assert(index.includes(collection), `Launch collection missing from home: ${collection}`);
}

console.log(`Validated LMI Musée: ${historicalPages.length} historical pages preserved, ${canonicalPages.length} canonical routes, official logo, strict palette, responsive accessibility and documentary locks.`);
