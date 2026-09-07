import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-maison-site');
const manifestPath = path.join(root, 'source-manifest.json');
function assert(condition, message) { if (!condition) throw new Error(message); }

assert(existsSync(root), 'LMI Maison candidate directory missing');
assert(existsSync(manifestPath), 'LMI Maison source manifest missing');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
assert(manifest.site === 'maison.lesmotsimages.com', 'Unexpected LMI Maison target site');
assert(manifest.canonicalSource === 'Google Drive', 'Google Drive must remain canonical source');
assert(manifest.publication === 'INTERDITE_SANS_VALIDATION_TRANSVERSE', 'Publication lock missing');
assert(manifest.register?.spreadsheetId === '18a1Wdg94UbqEkind0Igh9NmtnqPDJOOOxemhOlFLKls', 'Unexpected LMI Maison SHA-256 register');

const required = new Map([
  ['1G87gwUEITyHDX2LtPiLaOIajGtGGCULtqUqRbhNV374','08625a9781414f9adade59d01c39f7a3e989440d678f89e0c39932f62465a8c9'],
  ['18ctUHmHEtSHLOqY_qoAMJeG6fc1iKmE-_bRJQQa9tgo','88a5237bcccf34992546c56bd5d88ff34b2d21c81839e0203932b5d8fca8404a'],
  ['1I-4fhA9piRe8fbFBgQsjts68zrmREOsgECmModsA2VI','b3d2b84233993a13e9d8f3c7ed231e5234192075dddee3c0934cb6cb842556d5'],
  ['1PEztnpzzFPkb83WikHi3efV6S2yY55dGpx0gLD2CaUQ','1cc2181bc8caf5e8b9ffb36452cd452b290ab7f0f3656c8714ac114e1913c761'],
  ['1VF6s75ar6AO-wRT0Lg9mn8c8DYzjOYTcc-vokGflpSM','a3361533914a74cc8564211c2386f04ae1c8b52e85cd6e73a89f288212e98681']
]);
const byId = new Map((manifest.sources || []).map((source) => [source.driveId, source]));
for (const [driveId, sha] of required) {
  const source = byId.get(driveId);
  assert(source, `Missing canonical Drive source ${driveId}`);
  assert(source.sha256 === sha, `Canonical SHA-256 mismatch for ${driveId}`);
  assert(source.status === 'ACTIVE', `Canonical source not active: ${driveId}`);
}
for (const source of [...(manifest.sources || []), ...(manifest.illustrationSources || [])]) {
  assert(typeof source.driveId === 'string' && source.driveId.length >= 10, `Invalid Drive provenance for ${source.name || 'source'}`);
  assert(/^[a-f0-9]{64}$/.test(String(source.sha256 || '')), `Invalid SHA-256 for ${source.name || source.driveId}`);
}

const htmlFiles = readdirSync(root).filter((file) => file.endsWith('.html')).sort();
assert(htmlFiles.length > 0, 'LMI Maison HTML candidate is empty');
let nonDecorativeImages = 0;
for (const file of htmlFiles) {
  const html = readFileSync(path.join(root, file), 'utf8');
  assert(!/\b(?:lorem ipsum|placeholder|texte template|à remplacer)\b/i.test(html), `Template residue found: ${file}`);
  assert(!/\b(?:prix public validé|disponibilité confirmée|fournisseur confirmé|performance garantie)\b/i.test(html), `Unverified commercial/technical claim found: ${file}`);
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const image = match[0];
    const decorative = /\brole=["']presentation["']/i.test(image) || /\balt=["']\s*["']/i.test(image);
    if (decorative) continue;
    nonDecorativeImages += 1;
    const driveId = (image.match(/\bdata-lmi-drive-id=["']([^"']+)["']/i) || [])[1] || '';
    const sha = (image.match(/\bdata-lmi-sha256=["']([^"']+)["']/i) || [])[1] || '';
    assert(driveId.length >= 10, `Illustration without Drive provenance: ${file}`);
    assert(/^[a-f0-9]{64}$/.test(sha), `Illustration without valid SHA-256: ${file}`);
  }
}

const allText = htmlFiles.map((file) => readFileSync(path.join(root, file), 'utf8')).join('\n').toLowerCase();
assert(allText.includes('un signe') && allText.includes('pièce'), 'One sign = one room concept is not evidenced in candidate text');
assert(manifest.gates?.oneSignOneRoom === 'REQUIRED', 'One sign = one room gate missing');
assert(manifest.gates?.separateSignFamilies === 'REQUIRED', 'Separate sign-family gate missing');
assert(manifest.gates?.finalBridgePass === 'REQUIRES_TRANSVERSE_VALIDATION', 'Final Bridge validation gate missing');
console.log(`Audited LMI Maison finalisation: ${htmlFiles.length} HTML files, ${nonDecorativeImages} non-decorative images traced, canonical Drive sources pinned by SHA-256, publication locked.`);
