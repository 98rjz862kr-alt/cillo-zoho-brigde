import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = resolve('drafts/boa-totem-soya');
if (!existsSync(root)) throw new Error('Dossier drafts/boa-totem-soya introuvable');

const textExtensions = new Set(['.html', '.md', '.txt', '.srt', '.json', '.js', '.mjs', '.css']);
const replacements = [
  [/NÉNÉ ADAMA/g, 'MAAM JALLEL'],
  [/NENE ADAMA/g, 'MAAM JALLEL'],
  [/Néné Adama/g, 'Maam Jallel'],
  [/Nene Adama/g, 'Maam Jallel'],
  [/NÉNÉ\s+ADAMA/g, 'MAAM JALLEL'],
  [/NENE\s+ADAMA/g, 'MAAM JALLEL'],
  [/Néné\s+Adama/g, 'Maam Jallel'],
  [/Nene\s+Adama/g, 'Maam Jallel'],
];

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const abs = resolve(dir, entry.name);
  if (entry.isDirectory()) return walk(abs);
  if (!entry.isFile()) return [];
  const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
  return textExtensions.has(ext) ? [abs] : [];
});

const changed = [];
for (const file of walk(root)) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const [pattern, value] of replacements) after = after.replace(pattern, value);
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    changed.push(relative(process.cwd(), file));
  }
}

const canonPath = resolve(root, 'CANON-MAAM-JALLEL.md');
const canon = `# MAAM JALLEL — verrou canonique\n\nStatut : ACTIVE — 2026-08-18.\n\nMAAM JALLEL est la grand-mère de SOYA et la personne de transmission du récit **Le Boa Totem de Soya**. Elle interprète les signes liés au boa et transmet à SOYA ce qu'elle doit comprendre, sans retirer à SOYA son rôle central ni sa décision de réparation. Elle intervient dans la séquence de transmission des planches 13 à 15 et dans les équivalents album / dessin animé.\n\n## Apparence\nGrand-mère de SOYA. Foulard simple autorisé, mais pas de voile religieux et pas de chignon. Aucun signe religieux visible imposé. Son design doit être verrouillé comme personnage secondaire récurrent avant illustration finale.\n\n## Supersession\nToute occurrence historique de « Néné Adama » ou « NENE ADAMA » est un nom de travail obsolète. Les archives restent conservées comme provenance, mais **MAAM JALLEL** est l'unique nom autoritaire dans toute production active, tout média et tout futur produit dérivé.\n`;
if (!existsSync(canonPath) || readFileSync(canonPath, 'utf8') !== canon) {
  writeFileSync(canonPath, canon, 'utf8');
  changed.push(relative(process.cwd(), canonPath));
}

const obsolete = [];
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  if (/N(?:É|E)N(?:É|E)\s+ADAMA/i.test(text)) obsolete.push(relative(process.cwd(), file));
}
if (obsolete.length) {
  console.error('Noms obsolètes encore présents dans la production active :');
  console.error(obsolete.join('\n'));
  process.exit(1);
}

let maamCount = 0;
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  maamCount += (text.match(/MAAM JALLEL/gi) || []).length;
}
if (!maamCount) {
  console.error('MAAM JALLEL absente de la production active après normalisation.');
  process.exit(1);
}

console.log(`Boa Totem — MAAM JALLEL canonisée. ${changed.length} fichier(s) modifié(s), ${maamCount} occurrence(s) active(s).`);
for (const file of changed) console.log(file);
