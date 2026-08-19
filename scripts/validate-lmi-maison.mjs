import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('drafts/lmi-maison-site');
const pages = [
  '00-bat-lmi-maison.html',
  '01-collection-inaugurale-lmi-maison.html',
  '02-certificat-authentification-lmi-maison.html',
  '03-dossier-technique-textile-lmi-maison.html',
  '04-parcours-commercial-prive-lmi-maison.html',
];

const required = [
  ['viewport', /name=["']viewport["']/i],
  ['private robots directive', /noindex,nofollow,noarchive/i],
  ['French document language', /<html\s+lang=["']fr["']/i],
  ['page title', /<title>[^<]+<\/title>/i],
  ['primary heading', /<h1[\s>]/i],
];

const failures = [];
for (const page of pages) {
  const html = await readFile(resolve(root, page), 'utf8');
  for (const [label, pattern] of required) {
    if (!pattern.test(html)) failures.push(`${page}: missing ${label}`);
  }
  if (/<form[\s>]/i.test(html)) failures.push(`${page}: active form forbidden`);
  if (/stripe|paypal|checkout|paiement\s+actif/i.test(html)) failures.push(`${page}: payment integration forbidden`);
}

const commercial = await readFile(resolve(root, '04-parcours-commercial-prive-lmi-maison.html'), 'utf8');
for (const lock of ['AUCUN FORMULAIRE', 'AUCUN PAIEMENT', 'AUCUNE PRÉCOMMANDE ACTIVE']) {
  if (!commercial.includes(lock)) failures.push(`commercial path: missing lock “${lock}”`);
}

const cultural = await readFile(resolve(root, '03-matrice-controle-culturel-lmi-maison.md'), 'utf8');
for (const field of ['Signe exact', 'Sens documenté', 'Source culturelle', 'Droit d’usage', 'Validation compétente']) {
  if (!cultural.includes(field)) failures.push(`cultural matrix: missing “${field}”`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated LMI Maison: ${pages.length} private responsive pages, commercial locks and cultural-control matrix.`);
