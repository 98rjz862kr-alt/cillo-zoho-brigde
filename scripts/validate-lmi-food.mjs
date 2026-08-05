import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-food-site');
const requiredPrefixes = Array.from({ length: 23 }, (_, index) => `${String(index).padStart(2, '0')}-`);
const requiredColors = ['#143B7D', '#CC7722'];
const forbiddenPublicClaims = [
  /durée de conservation validée/i,
  /allergènes validés/i,
  /prix public validé/i,
  /commande fournisseur confirmée/i,
  /publication autorisée/i
];
const unsafeInteractivePatterns = [
  /<form\b[^>]*action=["']https?:\/\//i,
  /href=["'](?:https?:\/\/)?(?:buy|checkout|payment|stripe|paypal)/i,
  /<button\b[^>]*type=["']submit["'][^>]*>\s*(?:payer|commander|acheter|publier)/i
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync(root), 'LMI FOOD draft directory missing');
const files = readdirSync(root).filter((file) => file.endsWith('.html')).sort();
assert(files.length >= 23, `Expected at least 23 LMI FOOD pages, found ${files.length}`);

for (const prefix of requiredPrefixes) {
  assert(files.some((file) => file.startsWith(prefix)), `Missing LMI FOOD page prefix ${prefix}`);
}

for (const file of files) {
  const html = readFileSync(path.join(root, file), 'utf8');
  assert(/<!doctype html>/i.test(html), `DOCTYPE missing: ${file}`);
  assert(/<html[^>]*lang=["']fr["']/i.test(html), `French language marker missing: ${file}`);
  assert(/<meta[^>]*charset=["']?utf-8/i.test(html), `UTF-8 charset missing: ${file}`);
  assert(/name=["']viewport["']/i.test(html), `Viewport missing: ${file}`);
  assert(/noindex\s*,?\s*nofollow\s*,?\s*noarchive/i.test(html), `Robots lock missing: ${file}`);
  assert(/<title>[^<]+<\/title>/i.test(html), `Title missing: ${file}`);
  assert(/LMI FOOD/i.test(html), `LMI FOOD identity missing: ${file}`);
  assert(/<h1[^>]*>[^<]+<\/h1>/i.test(html), `Primary heading missing: ${file}`);
  assert(html.length >= 900, `Page is unexpectedly short: ${file}`);
  assert(requiredColors.some((color) => html.toUpperCase().includes(color)), `LMI palette marker missing: ${file}`);
  assert(!/href=["']#["']/i.test(html), `Placeholder link found: ${file}`);
  assert(!/\b(?:lorem ipsum|texte template|à remplacer|placeholder)\b/i.test(html), `Template residue found: ${file}`);

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  for (const image of images) {
    assert(/\balt=["'][^"']+["']/i.test(image), `Image without useful alt text: ${file}`);
  }

  for (const pattern of forbiddenPublicClaims) {
    assert(!pattern.test(html), `Unverified public claim found in ${file}: ${pattern}`);
  }
  for (const pattern of unsafeInteractivePatterns) {
    assert(!pattern.test(html), `Unsafe active commercial action found in ${file}: ${pattern}`);
  }
}

const sommaireName = files.find((file) => file.startsWith('07-'));
assert(sommaireName, 'LMI FOOD control index missing');
const sommaire = readFileSync(path.join(root, sommaireName), 'utf8');
const linkedFiles = [...sommaire.matchAll(/lmi-food-site%2F([^"']+\.html)/g)]
  .map((match) => decodeURIComponent(match[1]));

assert(new Set(linkedFiles).size === linkedFiles.length, 'Control index contains duplicate links');
for (const linkedFile of linkedFiles) {
  assert(files.includes(linkedFile), `Control index links to missing file ${linkedFile}`);
}
for (const prefix of requiredPrefixes.filter((prefix) => prefix !== '07-')) {
  assert(linkedFiles.some((file) => file.startsWith(prefix)), `Control index missing linked page prefix ${prefix}`);
}

const validationPage = linkedFiles.find((file) => file.startsWith('19-'));
assert(validationPage, 'Human validation register missing from control index');
const validationHtml = readFileSync(path.join(root, validationPage), 'utf8');
for (const decision of ['recettes', 'grammages', 'rendements', 'allergènes', 'conservation', 'conditionnements', 'coûts', 'prix', 'BAT', 'publication']) {
  assert(validationHtml.toLowerCase().includes(decision.toLowerCase()), `Human validation register missing decision: ${decision}`);
}
assert(/signature|décision finale|valider|refuser/i.test(validationHtml), 'Human acceptance decision block missing');

const executionPage = linkedFiles.find((file) => file.startsWith('20-'));
assert(executionPage, 'Continuous execution protocol missing from control index');
const executionHtml = readFileSync(path.join(root, executionPage), 'utf8');
assert(/exécution continue/i.test(executionHtml), 'Continuous execution rule missing');
assert(/validation humaine/i.test(executionHtml), 'Human validation stop rule missing');

const testSheetPage = linkedFiles.find((file) => file.startsWith('21-'));
assert(testSheetPage, 'Standardisation test sheet missing from control index');
const testSheetHtml = readFileSync(path.join(root, testSheetPage), 'utf8');
for (const field of ['ingrédients', 'temps', 'températures', 'rendement', 'allergènes', 'conditionnement', 'conservation']) {
  assert(testSheetHtml.toLowerCase().includes(field), `Standardisation sheet missing field: ${field}`);
}

const journalPage = linkedFiles.find((file) => file.startsWith('22-'));
assert(journalPage, 'Technical acceptance journal missing from control index');
const journalHtml = readFileSync(path.join(root, journalPage), 'utf8');
for (const proof of ['GitHub Actions', 'CDM Machine', 'Bridge', 'mobile', 'noindex', 'publication']) {
  assert(journalHtml.toLowerCase().includes(proof.toLowerCase()), `Technical journal missing proof area: ${proof}`);
}

console.log(`Validated LMI FOOD: ${files.length} private pages, 23 numbered sections, canonical navigation, LMI palette, robots locks, accessibility basics, inactive commercial actions, standardisation tools and final human acceptance register.`);
