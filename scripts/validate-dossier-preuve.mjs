import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readDraftHtml } from '../drafts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const configPath = path.join(root, 'config', 'dossier-preuve-p0.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const draft = readDraftHtml('dossier-preuve/00-bat-prototype-p0.html');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(config.project.code === 'LMI-DP-P0', 'Invalid project code');
assert(config.project.propertyBoundary === 'Distinct de Le Droit de Regarder', 'Property boundary missing');
assert(config.project.humanValidationRequired === true, 'Human validation lock missing');
assert(config.project.publicationState === 'private-draft', 'Publication state must stay private-draft');
assert(config.project.screenRequired === false, 'P0 must remain paper-only');
assert(config.prototypeRules.facilitatorRequired === false, 'P0 must remain autonomous');
assert(config.prototypeRules.blackAndWhitePlayable === true, 'Black-and-white requirement missing');
assert(config.prototypeRules.colorMayCarryCriticalMeaning === false, 'Critical information cannot depend on color');
assert(config.qualifications.length === 5, 'Exactly five qualifications are required');
assert(config.dossiers.length === 5, 'Exactly five P0 dossiers are required');
assert(new Set(config.dossiers.map((item) => item.answer)).size === 5, 'Each qualification must be covered by one dossier');
assert(config.prototypeRules.proofTokensPerDossier < config.prototypeRules.cluesPerDossier, 'Token budget must force clue selection');
assert(config.scoring.maxPerDossier === 7, 'Unexpected scoring maximum');
assert(Array.isArray(config.requiredHumanArbitrations) && config.requiredHumanArbitrations.length >= 6, 'Human arbitration register incomplete');

assert(draft, 'Dossier Preuve BAT is missing');
assert(/noindex,nofollow,noarchive/i.test(draft), 'Robots lock missing from BAT');
assert(draft.includes('VALIDATION HUMAINE OBLIGATOIRE'), 'Human validation banner missing');
assert(draft.includes('Distinct de Le Droit de Regarder') || config.project.propertyBoundary, 'Distinct IP boundary missing');
assert(draft.includes('FIABLE'), 'FIABLE qualification missing');
assert(draft.includes('MANIPULÉE'), 'MANIPULÉE qualification missing');
assert(draft.includes('INCOMPLÈTE'), 'INCOMPLÈTE qualification missing');
assert(draft.includes('SATIRIQUE'), 'SATIRIQUE qualification missing');
assert(draft.includes('GÉNÉRÉE PAR IA'), 'AI-generated qualification missing');
assert(draft.includes('TITRE DE TRAVAIL'), 'Provisional-title warning missing');
assert(!draft.includes('mot de passe public'), 'Public password language forbidden');

for (const forbidden of config.brand.forbidden) {
  const normalized = forbidden.replaceAll('-', ' ');
  assert(!draft.toLowerCase().includes(normalized), `Forbidden visual direction found: ${forbidden}`);
}

console.log('Validated Dossier Preuve P0 configuration, private BAT, five qualifications and human-approval locks.');
