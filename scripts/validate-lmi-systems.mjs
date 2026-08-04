import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('drafts/lmi-systems-structuration-licensing');
const files = [
  '00-index-production.html',
  '01-cadrage-portefeuille.html',
  '02-prototype-droit-de-regarder.html',
  '03-matrice-jeux-observation.html',
  '04-architecture-licence-validations.html',
  '05-trace-continuite-2026-08-04.html'
];

for (const file of files) {
  const html = readFileSync(resolve(root, file), 'utf8');
  if (!html.startsWith('<!doctype html>')) throw new Error(`${file}: doctype absent`);
  if (!html.includes('AUCUN GO PRODUCTION AUTOMATIQUE')) throw new Error(`${file}: garde-fou absent`);
  if (!html.includes('noindex,nofollow,noarchive')) throw new Error(`${file}: noindex absent`);
}

const index = readFileSync(resolve(root, files[0]), 'utf8');
for (const file of files.slice(1)) {
  if (!index.includes(file)) throw new Error(`Portail: lien manquant vers ${file}`);
}

const prototype = readFileSync(resolve(root, files[2]), 'utf8');
const cardCount = (prototype.match(/class="qcard"/g) || []).length;
const visualCount = (prototype.match(/class="visual"/g) || []).length;
if (cardCount !== 12) throw new Error(`Prototype: ${cardCount} cartes au lieu de 12`);
if (visualCount !== 6) throw new Error(`Prototype: ${visualCount} images-test au lieu de 6`);

const license = readFileSync(resolve(root, files[4]), 'utf8');
for (const gate of ['G1','G2','G3','G4','G5','G6','G7']) {
  if (!license.includes(`>${gate}<`)) throw new Error(`Licence: porte ${gate} absente`);
}

console.log(`LMI Systems: ${files.length} BAT valides, 12 cartes, 6 images-test, 7 portes de validation.`);
