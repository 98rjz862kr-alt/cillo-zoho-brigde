import { readFileSync, existsSync } from 'fs';
import path from 'path';

const root = path.resolve('drafts/lmi-musee-complet');
const pages = [
  'index.html','sommaire.html','expositions-permanentes.html','expositions-temporaires.html',
  'archives.html','collections.html','dossiers-documentaires.html','recherche-transmission.html',
  'atlas-humanites.html','education-mediation.html','vision-mission.html','visiter.html',
  'soutenir.html','partenaires.html','presse-droits.html'
];
const requiredColors = ['#143B7D','#CC7722','#75553F','#D4AF37','#0F2747','#F6F1E8','#C8A96B','#C9C3BA'];
const forbidden = ['neon violet','turquoise cyberpunk','rose fluo','vert hors charte','rpg fantasy','fond parchemin surcharge'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync(path.join(root, 'styles.css')), 'LMI Musée styles.css missing');
assert(existsSync(path.join(root, 'assets/lmi-logo-officiel.svg')), 'Official LMI logo wrapper missing');
assert(existsSync(path.join(root, 'assets/lmi-logo-main.webp')), 'Official LMI logo image missing');

const css = readFileSync(path.join(root, 'styles.css'), 'utf8');
for (const color of requiredColors) assert(css.includes(color), `Missing strict LMI color ${color}`);

for (const page of pages) {
  const full = path.join(root, page);
  assert(existsSync(full), `Missing LMI Musée page: ${page}`);
  const html = readFileSync(full, 'utf8');
  assert(/noindex,nofollow,noarchive/i.test(html), `Robots lock missing: ${page}`);
  assert(html.includes('assets/lmi-logo-officiel.svg'), `Official logo missing: ${page}`);
  assert(html.includes('styles.css'), `Shared visual system missing: ${page}`);
  assert(/LMI Musée/i.test(html), `Museum identity missing: ${page}`);
  for (const term of forbidden) assert(!html.toLowerCase().includes(term), `Forbidden visual direction found in ${page}: ${term}`);
}

const sommaire = readFileSync(path.join(root, 'sommaire.html'), 'utf8');
for (const page of pages.filter((p) => p !== 'sommaire.html')) {
  assert(sommaire.includes(page), `Sommaire does not link to ${page}`);
}

const index = readFileSync(path.join(root, 'index.html'), 'utf8');
for (const label of ['Expositions permanentes','Expositions temporaires','Archives','Recherche','Atlas','Visiter','Soutenir']) {
  assert(index.includes(label), `Home navigation missing: ${label}`);
}

console.log(`Validated LMI Musée: ${pages.length} private pages, official logo, strict palette, documentary and professional sections.`);
