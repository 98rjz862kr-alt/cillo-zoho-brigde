import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-musee-complet');
const pages = [
  'index.html','sommaire.html','expositions-permanentes.html','expositions-temporaires.html',
  'archives.html','collections.html','dossiers-documentaires.html','recherche-transmission.html',
  'atlas-humanites.html','education-mediation.html','vision-mission.html','visiter.html',
  'soutenir.html','partenaires.html','presse-droits.html'
];
const forbiddenVisible = [
  'lorem ipsum','placeholder','texte template','texte atelier','à compléter','a completer',
  'todo:', 'fixme:', 'exemple fictif', 'donnée fictive', 'donnee fictive'
];

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}
function assert(ok, message) { if (!ok) throw new Error(message); }

assert(existsSync(root), 'Museum root missing');
for (const p of pages) {
  const file = path.join(root, p);
  assert(existsSync(file), `Missing page ${p}`);
  const html = readFileSync(file, 'utf8');
  assert(/noindex,nofollow,noarchive/i.test(html), `Robots lock missing in ${p}`);
  assert(/<html[^>]*lang=["']fr["']/i.test(html), `lang=fr missing in ${p}`);
  assert(/<meta[^>]+viewport/i.test(html), `viewport missing in ${p}`);
  assert(/<title>[^<]+<\/title>/i.test(html), `title missing in ${p}`);
  assert(/name=["']description["']/i.test(html), `description missing in ${p}`);
  assert(html.includes('styles.css'), `shared CSS missing in ${p}`);
  assert(html.includes('assets/lmi-logo-officiel.svg'), `official logo wrapper missing in ${p}`);
  const lower = html.toLowerCase();
  for (const term of forbiddenVisible) assert(!lower.includes(term), `Forbidden unfinished marker '${term}' in ${p}`);
  for (const href of [...html.matchAll(/href=["']([^"'#?]+\.html)(?:#[^"']*)?["']/g)].map(m => m[1])) {
    assert(existsSync(path.join(root, href)), `Broken local link ${href} from ${p}`);
  }
}

const css = readFileSync(path.join(root, 'styles.css'), 'utf8');
for (const color of ['#143B7D','#CC7722','#75553F','#D4AF37','#0F2747','#F6F1E8','#C8A96B','#C9C3BA']) {
  assert(css.includes(color), `Missing LMI palette color ${color}`);
}
assert(css.includes(':focus-visible'), 'Keyboard focus style missing');
assert(/@media\(max-width:900px\)/.test(css), 'Responsive breakpoint missing');

const sourceManifest = JSON.parse(readFileSync(path.join(root, 'source-manifest.json'), 'utf8'));
assert(sourceManifest.site === 'musee.lesmotsimages.com', 'Wrong source manifest site');
assert(Array.isArray(sourceManifest.documents) && sourceManifest.documents.length >= 8, 'Insufficient canonical documents in manifest');
for (const doc of sourceManifest.documents) {
  assert(/^[a-f0-9]{64}$/.test(doc.sha256), `Invalid document SHA256 for ${doc.title}`);
  assert(doc.driveId, `Drive ID missing for ${doc.title}`);
}

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else files.push(file);
  }
}
walk(root);
const hashes = Object.fromEntries(files.sort().map(file => [path.relative(root, file), sha256(file)]));
for (const [name, hash] of Object.entries(hashes)) assert(/^[a-f0-9]{64}$/.test(hash), `Invalid generated hash ${name}`);

console.log(JSON.stringify({
  site: 'musee.lesmotsimages.com',
  status: 'CANDIDATE_AUDITED_PRIVATE',
  pages: pages.length,
  sourceDocuments: sourceManifest.documents.length,
  files: hashes
}, null, 2));
