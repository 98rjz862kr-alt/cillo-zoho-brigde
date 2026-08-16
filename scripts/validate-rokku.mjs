import { readFileSync } from 'fs';
import { readDraftHtml } from '../drafts.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const control = readDraftHtml('rokku-site/00-controle-prepublication.html');
const bat = readDraftHtml('rokku-site/01-bat-boutique.html');
const validation = readDraftHtml('rokku-site/02-validation-humaine.html');
const publicCandidate = readDraftHtml('rokku-site/03-candidat-site-public.html');
const openingDossier = readDraftHtml('rokku-site/04-dossier-ouverture-publique.html');
const catalogue = JSON.parse(readFileSync(new URL('../drafts/rokku-site/catalogue-rokku-v1.json', import.meta.url), 'utf8'));

for (const [name, html] of [['control', control], ['BAT', bat], ['validation', validation], ['public candidate', publicCandidate], ['opening dossier', openingDossier]]) {
  assert(html, `ROKKU ${name} page is missing`);
  assert(/noindex,nofollow,noarchive/i.test(html), `ROKKU ${name} robots lock is missing`);
  assert(!/paiement\s+(?:activé|disponible)|commande\s+(?:ouverte|active)|acheter maintenant/i.test(html), `ROKKU ${name} contains a forbidden live-commerce signal`);
}

assert(control.includes('SOCLE ROKKU RESTAURÉ'), 'ROKKU restored-state banner is missing');
assert(control.includes('AUCUNE PUBLICATION') && control.includes('AUCUN PAIEMENT'), 'ROKKU control locks are incomplete');
assert(bat.includes('Le plaisir d’offrir') && bat.includes('Offrir sans banaliser'), 'ROKKU BAT positioning is incomplete');
assert(validation.includes('BAT ROKKU VALIDÉ') && validation.includes('BAT ROKKU À CORRIGER'), 'ROKKU validation decisions are missing');

for (const required of [
  'Huit compositions, quatre univers',
  '42 à 128 € TTC',
  '89 € TTC',
  '55–64 € TTC',
  '72–96 € TTC',
  '128 € TTC',
  '5–7 jours ouvrés',
  'De 20 à 500 pièces',
  'lesmotsimages@gmail.com',
  '+33 7 53 00 58 18',
  'data:image/webp;base64'
]) assert(publicCandidate.includes(required), `ROKKU public candidate is missing: ${required}`);

assert(!publicCandidate.includes('CATALOGUE À INJECTER'), 'Obsolete ROKKU catalogue placeholder remains');
assert(openingDossier.includes('Catalogue canonique : huit compositions'), 'ROKKU opening dossier catalogue status is incorrect');
assert(openingDossier.includes('Prix publics : 42 à 128 € TTC'), 'ROKKU opening dossier price status is incorrect');
assert(openingDossier.includes('Trois coffrets physiques conformes'), 'ROKKU physical validation gate is missing');
assert(openingDossier.includes('Publication transactionnelle') && openingDossier.includes('Interdite'), 'ROKKU publication gate is missing');

assert(catalogue.brand === 'ROKKU', 'ROKKU catalogue brand is invalid');
assert(catalogue.catalogueSummary.compositionCount === 8, 'ROKKU composition count must be 8');
assert(catalogue.catalogueSummary.publicPriceFloor === 42 && catalogue.catalogueSummary.publicPriceCeiling === 128, 'ROKKU public price range is invalid');
assert(catalogue.collections.find(x => x.id === 'signature')?.priceTtc === 89, 'ROKKU Signature price is invalid');
assert(catalogue.collections.find(x => x.id === 'gourmand')?.priceTtcMin === 55, 'ROKKU Gourmand price is invalid');
assert(catalogue.collections.find(x => x.id === 'maison')?.priceTtcMax === 96, 'ROKKU Maison price is invalid');
assert(catalogue.collections.find(x => x.id === 'exception')?.priceTtc === 128, 'ROKKU Exception price is invalid');
assert(catalogue.publicationGate.paymentEnabled === false && catalogue.publicationGate.ordersEnabled === false, 'ROKKU transaction locks must remain disabled');

for (const forbidden of ['stock disponible', 'livraison garantie', 'commander maintenant']) {
  for (const [name, html] of [['BAT', bat], ['validation', validation], ['public candidate', publicCandidate], ['opening dossier', openingDossier]]) {
    assert(!html.toLowerCase().includes(forbidden), `Forbidden invented ${name} data found: ${forbidden}`);
  }
}

console.log('Validated ROKKU catalogue, canonical prices, official LMI identity, commercial copy, contacts and prepublication gates.');
