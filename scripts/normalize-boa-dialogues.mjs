import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('drafts/boa-totem-soya');
if (!existsSync(root)) throw new Error('Dossier drafts/boa-totem-soya introuvable');

const cillo = 'Attends... ça recommence seulement quand tu avances.';
const soya = "C'est moi que le signe a arrêtée. Alors c'est moi qui dois commencer.";
const changed = [];

for (const name of readdirSync(root).filter((n) => /\.(html|srt|txt|md)$/i.test(n))) {
  const path = resolve(root, name);
  const before = readFileSync(path, 'utf8');
  let after = before;

  after = after
    .replaceAll('Attends… ça recommence seulement quand tu avances.', cillo)
    .replaceAll('Attends … ça recommence seulement quand tu avances.', cillo)
    .replaceAll("C’est moi que le signe a arrêtée. Alors c’est moi qui dois commencer.", soya)
    .replaceAll("C’est moi que le signe a arrêtée. Alors c'est moi qui dois commencer.", soya)
    .replaceAll("C'est moi que le signe a arrêtée. Alors c’est moi qui dois commencer.", soya);

  if (name === '06-script-bd-dialogues.html') {
    after = after
      .replace('<p class="dialogue">SOYA : « C’est moi que le signe a arrêtée. »</p>', `<p class="dialogue">SOYA : « ${soya} »</p>`)
      .replace('<p class="dialogue">SOYA : « Alors c’est moi qui dois commencer. »</p>', '<p class="note">La décision complète de SOYA a déjà été formulée en une seule réplique à la planche 16 ; cette case reste sans nouvelle bulle.</p>')
      .replace('<p class="dialogue">SOYA : « C\'est moi que le signe a arrêtée. »</p>', `<p class="dialogue">SOYA : « ${soya} »</p>`)
      .replace('<p class="dialogue">SOYA : « Alors c\'est moi qui dois commencer. »</p>', '<p class="note">La décision complète de SOYA a déjà été formulée en une seule réplique à la planche 16 ; cette case reste sans nouvelle bulle.</p>');
  }

  if (name === '14-guide-lettrage-bd.html') {
    after = after
      .replace('<p><b>P16 C4</b> — SOYA : <span class="dialogue">« C’est moi que le signe a arrêtée. »</span></p>', `<p><b>P16 C4</b> — SOYA, bulle unique : <span class="dialogue">« ${soya} »</span></p>`)
      .replace('<p><b>P18 C3</b> — SOYA, dernière bulle de l’album : <span class="dialogue">« Alors c’est moi qui dois commencer. »</span></p>', '<p><b>P18 C3</b> — <span class="silent">aucune nouvelle bulle ; la décision complète a été dite en P16 C4</span>.</p>')
      .replace('les points de suspension typographiques', 'les trois points obligatoires dans la réplique de CILLO');
  }

  if (name === '16-album-maquette-pagination.html') {
    after = after
      .replace('<div class="page"><b>Dialogue intégré</b><p>« C’est moi que le signe a arrêtée. »</p></div>', `<div class="page"><b>Dialogue intégré</b><p>« ${soya} »</p></div>`)
      .replace('<div class="page"><b>Conclusion</b><p>Le trio repart vers le marché. « Alors c’est moi qui dois commencer. »</p></div>', '<div class="page"><b>Conclusion</b><p>Le trio repart vers le marché. Aucun nouveau dialogue : l’image prolonge la décision complète prononcée en pages 24–25.</p></div>');
  }

  if (name === '09-da-sous-titres-fr.srt') {
    after = after
      .replace('C’est moi que le signe a arrêtée.\nAlors c’est moi qui dois commencer.', soya)
      .replace("C'est moi que le signe a arrêtée.\nAlors c'est moi qui dois commencer.", soya);
  }

  if (after !== before) {
    writeFileSync(path, after, 'utf8');
    changed.push(name);
  }
}

const required = [
  ['01-bd-18-planches.html', cillo],
  ['03-da-storyboard.html', cillo],
  ['06-script-bd-dialogues.html', cillo],
  ['07-album-graphique-texte-integral.html', cillo],
  ['08-da-script-technique.html', cillo],
  ['09-da-sous-titres-fr.srt', cillo],
  ['14-guide-lettrage-bd.html', cillo],
  ['16-album-maquette-pagination.html', cillo],
  ['18-dialogues-verrouilles-reference.html', cillo],
  ['01-bd-18-planches.html', soya],
  ['03-da-storyboard.html', soya],
  ['06-script-bd-dialogues.html', soya],
  ['07-album-graphique-texte-integral.html', soya],
  ['08-da-script-technique.html', soya],
  ['09-da-sous-titres-fr.srt', soya],
  ['14-guide-lettrage-bd.html', soya],
  ['16-album-maquette-pagination.html', soya],
  ['18-dialogues-verrouilles-reference.html', soya],
];

const failures = [];
for (const [name, text] of required) {
  const path = resolve(root, name);
  if (!existsSync(path)) failures.push(`${name}: absent`);
  else if (!readFileSync(path, 'utf8').includes(text)) failures.push(`${name}: formulation canonique absente`);
}

for (const name of readdirSync(root).filter((n) => /\.(html|srt)$/i.test(n))) {
  const text = readFileSync(resolve(root, name), 'utf8');
  if (text.includes('Attends… ça recommence seulement quand tu avances.')) failures.push(`${name}: ellipse typographique interdite`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Normalisation Boa Totem OK. Fichiers modifiés: ${changed.length}`);
for (const name of changed) console.log(name);
