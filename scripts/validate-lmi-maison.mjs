import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-maison-site');
const requiredHtmlPrefixes = ['00-index-', '00-bat-', '01-collection-', '02-certificat-', '05-dossier-', '06-parcours-', '07-journal-', '08-registre-', '09-protocole-'];
const exactFacts = [
  ['Plaid décoratif grand format', '690 €', '620 g/m²', '24 exemplaires', '#0F2747', '#D4AF37', '#F6F1E8'],
  ['Panneau textile mural', '840 €', '480 g/m²', 'Pièce unique', '#143B7D', '#C9C3BA', '#CC7722'],
  ['Coussin extérieur premium', '260 €', '390 g/m²', '36 exemplaires', '#75553F', '#C8A96B', '#F6F1E8']
];
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(existsSync(root), 'Dossier LMI Maison absent');
const allFiles = readdirSync(root).sort();
const files = allFiles.filter((file) => file.endsWith('.html'));
for (const prefix of requiredHtmlPrefixes) assert(files.some((file) => file.startsWith(prefix)), `Page requise absente: ${prefix}`);
assert(allFiles.includes('03-matrice-controle-culturel-lmi-maison.md'), 'Matrice culturelle absente');
for (const file of files) {
  const html = readFileSync(path.join(root, file), 'utf8');
  assert(/<!doctype html>/i.test(html), `DOCTYPE absent: ${file}`);
  assert(/<html[^>]*lang=["']fr["']/i.test(html), `Langue FR absente: ${file}`);
  assert(/charset=["']?utf-8/i.test(html), `UTF-8 absent: ${file}`);
  assert(/name=["']viewport["']/i.test(html), `Viewport absent: ${file}`);
  assert(/noindex\s*,?\s*nofollow\s*,?\s*noarchive/i.test(html), `Verrou robots absent: ${file}`);
  assert(/<title>[^<]+<\/title>/i.test(html), `Titre absent: ${file}`);
  assert(/LMI Maison/i.test(html), `Identité LMI Maison absente: ${file}`);
  assert(!/<form\b/i.test(html), `Formulaire actif interdit: ${file}`);
  assert(!/mailto:|tel:|stripe|paypal|checkout/i.test(html), `Action commerciale active interdite: ${file}`);
}
const collection = readFileSync(path.join(root, files.find((file) => file.startsWith('01-collection-'))), 'utf8');
for (const factSet of exactFacts) for (const fact of factSet) assert(collection.includes(fact), `Donnée produit absente ou modifiée: ${fact}`);
const index = readFileSync(path.join(root, files.find((file) => file.startsWith('00-index-'))), 'utf8');
for (const file of files.filter((file) => !file.startsWith('00-index-') && !file.startsWith('01-protocole-tache-continue-') && !file.startsWith('04-trace-'))) {
  assert(index.includes(encodeURIComponent(`lmi-maison-site/${file}`)), `Sommaire sans lien vers ${file}`);
}
const culture = readFileSync(path.join(root, '03-matrice-controle-culturel-lmi-maison.md'), 'utf8');
for (const marker of ['À sélectionner', 'À documenter', 'À citer', 'À confirmer']) assert(culture.includes(marker), `Marqueur culturel absent: ${marker}`);
const technical = readFileSync(path.join(root, files.find((file) => file.startsWith('05-dossier-'))), 'utf8');
assert(/À VALIDER/.test(technical) && /À TESTER/.test(technical), 'Les données techniques non prouvées ne sont pas verrouillées');
console.log(`Validated LMI Maison: ${files.length} pages privées, référentiel produit, navigation, robots, verrous culturels et commerciaux.`);
