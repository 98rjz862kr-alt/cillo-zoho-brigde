import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-food-site');
const requiredPages = Array.from({ length: 23 }, (_, index) => `${String(index).padStart(2, '0')}-`);
const requiredColors = ['#143B7D', '#CC7722'];
const forbiddenPublicClaims = [
  /durée de conservation validée/i,
  /allergènes validés/i,
  /prix public validé/i,
  /commande fournisseur confirmée/i,
  /publication autorisée/i
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync(root), 'LMI FOOD draft directory missing');
const files = readdirSync(root).filter((file) => file.endsWith('.html')).sort();
assert(files.length >= 23, `Expected at least 23 LMI FOOD pages, found ${files.length}`);

for (const prefix of requiredPages) {
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
  assert(requiredColors.some((color) => html.includes(color)), `LMI palette marker missing: ${file}`);
  for (const pattern of forbiddenPublicClaims) {
    assert(!pattern.test(html), `Unverified public claim found in ${file}: ${pattern}`);
  }
}

const sommaireName = files.find((file) => file.startsWith('07-'));
assert(sommaireName, 'LMI FOOD control index missing');
const sommaire = readFileSync(path.join(root, sommaireName), 'utf8');
for (const file of files.filter((file) => file !== sommaireName)) {
  const encoded = encodeURIComponent(`lmi-food-site/${file}`);
  assert(sommaire.includes(encoded), `Control index does not link to ${file}`);
}

const validationPage = files.find((file) => file.startsWith('19-'));
assert(validationPage, 'Human validation register missing');
const validationHtml = readFileSync(path.join(root, validationPage), 'utf8');
for (const decision of ['recettes', 'fournisseurs', 'coûts', 'prix', 'BAT', 'publication']) {
  assert(validationHtml.toLowerCase().includes(decision.toLowerCase()), `Human validation register missing decision: ${decision}`);
}

const executionPage = files.find((file) => file.startsWith('20-'));
assert(executionPage, 'Continuous execution protocol missing');
const executionHtml = readFileSync(path.join(root, executionPage), 'utf8');
assert(/exécution continue/i.test(executionHtml), 'Continuous execution rule missing');
assert(/validation humaine/i.test(executionHtml), 'Human validation stop rule missing');

console.log(`Validated LMI FOOD: ${files.length} private pages, complete index, palette, robots locks, human validation register and continuous execution protocol.`);
