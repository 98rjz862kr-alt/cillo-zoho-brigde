import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-maison-site');
const required = [
  '00-bat-lmi-maison.html',
  '00-index-controle-lmi-maison.html',
  '01-collection-inaugurale-lmi-maison.html',
  '01-protocole-tache-continue-lmi-maison.html',
  '02-certificat-authentification-lmi-maison.html',
  '03-matrice-controle-culturel-lmi-maison.html',
  '05-dossier-technique-textile-lmi-maison.html',
  '06-parcours-commercial-prive-lmi-maison.html',
  '07-journal-recette-technique-lmi-maison.html',
  '07-sommaire-controle-lmi-maison.html',
  '08-registre-recette-finale-lmi-maison.html',
  '09-protocole-production-continue-lmi-maison.html'
];
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(existsSync(root), 'Dossier LMI Maison absent');
const files = readdirSync(root).filter((file) => file.endsWith('.html')).sort();
for (const file of required) assert(files.includes(file), 'Page requise absente: ' + file);
for (const file of files) {
  const html = readFileSync(path.join(root, file), 'utf8');
  assert(/<!doctype html>/i.test(html), 'DOCTYPE absent: ' + file);
  assert(/<html[^>]*lang=["']fr["']/i.test(html), 'Langue FR absente: ' + file);
  assert(/charset=["']?utf-8/i.test(html), 'UTF-8 absent: ' + file);
  assert(/name=["']viewport["']/i.test(html), 'Viewport absent: ' + file);
  assert(/noindex\s*,?\s*nofollow\s*,?\s*noarchive/i.test(html), 'Verrou robots absent: ' + file);
  assert(/<meta name="description" content="[^"]{40,}">/i.test(html), 'Description utile absente: ' + file);
  assert(/<title>[^<]+<\/title>/i.test(html), 'Titre absent: ' + file);
  assert((html.match(/<h1(?:\s|>)/gi) || []).length === 1, 'Un H1 unique est requis: ' + file);
  assert(/LMI Maison/i.test(html), 'Identité LMI Maison absente: ' + file);
  assert(!/<form\b/i.test(html), 'Formulaire actif interdit: ' + file);
  assert(!/mailto:|tel:|stripe|paypal|parcours d’encaissement/i.test(html), 'Action commerciale active interdite: ' + file);
}
for (const file of ['00-bat-lmi-maison.html','01-collection-inaugurale-lmi-maison.html']) {
  const html = readFileSync(path.join(root, file), 'utf8');
  for (const stale of ['690 €','840 €','260 €','620 g/m²','480 g/m²','390 g/m²','24 exemplaires','36 exemplaires']) assert(!html.includes(stale), 'Donnée divergente interdite dans la présentation: ' + stale);
}
const culture = readFileSync(path.join(root, '03-matrice-controle-culturel-lmi-maison.html'), 'utf8');
for (const marker of ['À sélectionner','À documenter','À citer','À confirmer']) assert(culture.includes(marker), 'Marqueur culturel absent: ' + marker);
const technical = readFileSync(path.join(root, '05-dossier-technique-textile-lmi-maison.html'), 'utf8');
for (const marker of ['À VALIDER','À MESURER','À TESTER']) assert(technical.includes(marker), 'Verrou technique absent: ' + marker);
const index = readFileSync(path.join(root, '00-index-controle-lmi-maison.html'), 'utf8');
for (const file of required.filter((f) => !['00-index-controle-lmi-maison.html','01-protocole-tache-continue-lmi-maison.html','07-sommaire-controle-lmi-maison.html'].includes(f))) assert(index.includes(file), 'Sommaire sans lien vers ' + file);
const allHtml = Object.fromEntries(files.map((file) => [file, readFileSync(path.join(root, file), 'utf8')]));
for (const [file, html] of Object.entries(allHtml)) {
  for (const match of html.matchAll(/href="([^"]+\.html)(?:#[^"]*)?"/g)) {
    const href = match[1];
    if (/^(?:https?:|\/)/i.test(href)) continue;
    assert(files.includes(path.basename(href)), 'Lien relatif cassé dans ' + file + ': ' + href);
  }
}
console.log('Validated LMI Maison: ' + files.length + ' pages privées, navigation, contenus publics, verrous culturels, techniques et commerciaux.');
