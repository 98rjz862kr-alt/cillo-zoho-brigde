import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const assets = [
  'drafts/lmi-musee-complet/assets/lmi-logo-main.webp',
  'drafts/lmi-musee-complet/assets/lmi-logo-officiel.svg',
  'drafts/lmi-musee-complet/source-manifest.json'
];

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const files = {};
for (const relative of assets) {
  const file = path.resolve(relative);
  files[relative] = existsSync(file) ? sha256(file) : null;
}
console.log(`LMI_MUSEE_INTEGRITY ${JSON.stringify({ algorithm: 'SHA-256', files })}`);
