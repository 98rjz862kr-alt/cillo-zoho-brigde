import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readDraftHtml } from '../drafts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const configPath = path.join(root, 'config', 'dossier-preuve-p0.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const bat = readDraftHtml('dossier-preuve/00-bat-prototype-p0.html');
const playerKit = readDraftHtml('dossier-preuve/01-kit-joueurs-imprimable-p0.html');
const resolutions = readDraftHtml('dossier-preuve/02-resolutions-p0.html');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(config.project.code === 'LMI-DP-P0', 'Invalid project code');
assert(config.project.propertyBoundary === 'Distinct de Le Droit de Regarder', 'Property boundary missing');
assert(config.project.humanValidationRequired === true, 'Human validation lock missing');
assert(config.project.publicationState === 'private-draft-human-approved-for-p0-production', 'P0 production approval state is missing');
assert(config.validation.status === 'human-approved', 'Human approval was not recorded');
assert(config.validation.nextGate === 'human-validation-of-printable-p0-kit', 'Unexpected next human gate');
assert(config.project.screenRequired === false, 'P0 must remain paper-only');
assert(config.prototypeRules.facilitatorRequired === false, 'P0 must remain autonomous');
assert(config.prototypeRules.blackAndWhitePlayable === true, 'Black-and-white requirement missing');
assert(config.prototypeRules.colorMayCarryCriticalMeaning === false, 'Critical information cannot depend on color');
assert(config.qualifications.length === 5, 'Exactly five qualifications are required');
assert(config.dossiers.length === 5, 'Exactly five P0 dossiers are required');
assert(new Set(config.dossiers.map((item) => item.answer)).size === 5, 'Each qualification must be covered by one dossier');
assert(config.prototypeRules.proofTokensPerDossier < config.prototypeRules.cluesPerDossier, 'Token budget must force clue selection');
assert(config.scoring.maxPerDossier === 7, 'Unexpected scoring maximum');
assert(Array.isArray(config.requiredHumanArbitrations) && config.requiredHumanArbitrations.length === 0, 'Approved arbitrations must be cleared');
assert(Array.isArray(config.pendingHumanValidation) && config.pendingHumanValidation.length === 3, 'Pending validation gates are incomplete');

for (const [name, html] of [['BAT', bat], ['player kit', playerKit], ['resolutions', resolutions]]) {
  assert(html, `${name} is missing`);
  assert(/noindex,nofollow,noarchive/i.test(html), `Robots lock missing from ${name}`);
}

assert(bat.includes('VALIDATION HUMAINE OBLIGATOIRE'), 'Human validation banner missing from BAT');
assert(bat.includes('FIABLE') && bat.includes('MANIPULÉE') && bat.includes('INCOMPLÈTE') && bat.includes('SATIRIQUE') && bat.includes('GÉNÉRÉE PAR IA'), 'One or more qualifications are missing from BAT');
assert(bat.includes('TITRE DE TRAVAIL'), 'Provisional-title warning missing');

assert(playerKit.includes('KIT JOUEURS'), 'Player-kit identity missing');
assert(!playerKit.includes('Résolution · FIABLE'), 'Player kit leaks a resolution');
assert(playerKit.includes('Grille de preuve'), 'Proof grid missing from player kit');
assert(playerKit.includes('Jetons Preuve'), 'Printable tokens missing from player kit');
assert(playerKit.includes('Affirmations joueurs'), 'Player assertion sheets missing');
assert(playerKit.includes('Maximum : 7 points par dossier'), 'Scoring summary missing from player kit');

assert(resolutions.includes('NE PAS DISTRIBUER AVEC LE KIT JOUEURS'), 'Resolution separation warning missing');
for (const expected of ['FIABLE', 'INCOMPLÈTE', 'MANIPULÉE', 'SATIRIQUE', 'GÉNÉRÉE PAR IA']) {
  assert(resolutions.includes(expected), `Resolution missing: ${expected}`);
}

for (const html of [bat, playerKit, resolutions]) {
  assert(!html.includes('mot de passe public'), 'Public password language forbidden');
  for (const forbidden of config.brand.forbidden) {
    const normalized = forbidden.replaceAll('-', ' ');
    assert(!html.toLowerCase().includes(normalized), `Forbidden visual direction found: ${forbidden}`);
  }
}

console.log('Validated Dossier Preuve P0 human approval, private BAT, printable player kit, separated resolutions and five-qualification coverage.');
