import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-food-site');
const manifestPath = path.join(root, 'source-manifest.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync(root), 'LMI FOOD candidate directory missing');
assert(existsSync(manifestPath), 'LMI FOOD source manifest missing');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
assert(manifest.site === 'food.lesmotsimages.com', 'Unexpected LMI FOOD target site');
assert(manifest.canonicalSource === 'Google Drive', 'Google Drive must remain canonical source');
assert(manifest.publication === 'INTERDITE_SANS_VALIDATION_TRANSVERSE', 'Publication lock missing');
assert(manifest.register?.spreadsheetId === '1OZql5LfxndgzJQsRr9sdeF8qCRj_HZMVxMk8h87VrNo', 'Unexpected LMI FOOD SHA-256 register');

const requiredSources = new Map([
  ['1G87gwUEITyHDX2LtPiLaOIajGtGGCULtqUqRbhNV374', '08625a9781414f9adade59d01c39f7a3e989440d678f89e0c39932f62465a8c9'],
  ['18ctUHmHEtSHLOqY_qoAMJeG6fc1iKmE-_bRJQQa9tgo', '88a5237bcccf34992546c56bd5d88ff34b2d21c81839e0203932b5d8fca8404a'],
  ['1_pGnWoxD8QTytc1rGvcaDL_OQMHpHaDkuHbmZf0NqR8', 'd8a7cc0f01ad5f8584ec0f523fa5e675279df647b9cd1a4496a1c20a83fecc66'],
  ['1PEztnpzzFPkb83WikHi3efV6S2yY55dGpx0gLD2CaUQ', '1cc2181bc8caf5e8b9ffb36452cd452b290ab7f0f3656c8714ac114e1913c761'],
  ['1yqfscks_gDFWABZCfAlXy0R1l5A2ZMyjHFq34-IEimw', 'e64ed5c70c7ddbc6015793195c74e05e0af52c2f0ddf1b6274121e58b452b846']
]);

const sourceById = new Map((manifest.sources || []).map((source) => [source.driveId, source]));
for (const [driveId, sha256] of requiredSources) {
  const source = sourceById.get(driveId);
  assert(source, `Missing canonical Drive source ${driveId}`);
  assert(source.sha256 === sha256, `Canonical SHA-256 mismatch for Drive source ${driveId}`);
  assert(source.status === 'ACTIVE', `Canonical Drive source not active: ${driveId}`);
}

for (const source of [...(manifest.sources || []), ...(manifest.illustrationSources || [])]) {
  assert(typeof source.driveId === 'string' && source.driveId.length >= 10, `Invalid Drive provenance for ${source.name || 'source'}`);
  assert(/^[a-f0-9]{64}$/.test(String(source.sha256 || '')), `Invalid SHA-256 for ${source.name || source.driveId}`);
}

const icon = (manifest.illustrationSources || []).find((item) => item.driveId === '17LhsU1h3iLZzI0LmiCTgpLZcnucLursz');
assert(icon, 'Canonical LMI FOOD icon source missing');
assert(icon.sha256 === 'a0ae3276a271544dc1f1564d10ec22f4c539251d072d0246ec8fdc5b756bd46a', 'Canonical LMI FOOD icon SHA-256 mismatch');

const pages = readdirSync(root).filter((file) => file.endsWith('.html')).sort();
assert(pages.length >= 28, `Expected at least 28 LMI FOOD pages, found ${pages.length}`);

for (const file of pages) {
  const html = readFileSync(path.join(root, file), 'utf8');
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  for (const image of images) {
    const decorative = /\brole=["']presentation["']/i.test(image) || /\balt=["']\s*["']/i.test(image);
    if (decorative) continue;
    const driveId = (image.match(/\bdata-lmi-drive-id=["']([^"']+)["']/i) || [])[1] || '';
    const sha = (image.match(/\bdata-lmi-sha256=["']([^"']+)["']/i) || [])[1] || '';
    assert(driveId.length >= 10, `Non-decorative illustration without Drive provenance: ${file}`);
    assert(/^[a-f0-9]{64}$/.test(sha), `Non-decorative illustration without SHA-256: ${file}`);
  }
}

assert(manifest.gates?.unverifiedCommercialClaims === 'FAIL', 'Commercial claim fail-closed gate missing');
assert(manifest.gates?.illustrationWithoutDriveIdAndSha256 === 'FAIL', 'Illustration provenance fail-closed gate missing');
assert(manifest.gates?.finalBridgePass === 'REQUIRES_TRANSVERSE_VALIDATION', 'Final Bridge transverse-validation gate missing');

console.log(`Audited LMI FOOD finalisation: ${pages.length} pages, canonical Drive sources pinned by SHA-256, illustration provenance fail-closed, publication locked pending transverse validation.`);
