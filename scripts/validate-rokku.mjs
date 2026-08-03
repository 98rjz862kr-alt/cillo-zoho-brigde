import { readDraftHtml } from '../drafts.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const control = readDraftHtml('rokku-site/00-controle-prepublication.html');
const bat = readDraftHtml('rokku-site/01-bat-boutique.html');
const validation = readDraftHtml('rokku-site/02-validation-humaine.html');
const publicCandidate = readDraftHtml('rokku-site/03-candidat-site-public.html');
const openingDossier = readDraftHtml('rokku-site/04-dossier-ouverture-publique.html');

for (const [name, html] of [['control', control], ['BAT', bat], ['validation', validation], ['public candidate', publicCandidate], ['opening dossier', openingDossier]]) {
  assert(html, `ROKKU ${name} page is missing`);
  assert(/noindex,nofollow,noarchive/i.test(html), `ROKKU ${name} robots lock is missing`);
  assert(!/paiement\s+(?:activé|disponible)|commande\s+(?:ouverte|active)|acheter maintenant/i.test(html), `ROKKU ${name} contains a forbidden live-commerce signal`);
}

assert(control.includes('SOCLE ROKKU RESTAURÉ'), 'ROKKU restored-state banner is missing');
assert(control.includes('REPRISE ACTIVE DANS BRIDGE'), 'ROKKU active-resumption decision is missing');
assert(control.includes('AUCUNE PUBLICATION') && control.includes('AUCUN PAIEMENT'), 'ROKKU control locks are incomplete');

assert(bat.includes('ROKKU · MAISON DE CADEAUX PREMIUM'), 'ROKKU premium positioning is missing');
assert(bat.includes('Le plaisir d’offrir'), 'ROKKU signature is missing');
assert(bat.includes('Offrir sans banaliser'), 'ROKKU editorial promise is missing');
assert(bat.includes('Coffrets') && bat.includes('Objets') && bat.includes('Cadeaux'), 'ROKKU offer families are incomplete');
assert(bat.includes('CATALOGUE À RATTACHER'), 'ROKKU catalogue lock is missing');
assert(bat.includes('COMMANDES ET PAIEMENTS DÉSACTIVÉS'), 'ROKKU commerce lock banner is missing');

assert(validation.includes('Validation humaine du BAT boutique'), 'ROKKU human-validation heading is missing');
assert(validation.includes('/atelier/file/rokku-site%2F01-bat-boutique.html'), 'ROKKU BAT validation link is missing');
assert(validation.includes('BAT ROKKU VALIDÉ'), 'ROKKU approval decision code is missing');
assert(validation.includes('BAT ROKKU À CORRIGER'), 'ROKKU correction decision code is missing');
assert(validation.includes('AUCUNE PUBLICATION') && validation.includes('AUCUN PAIEMENT'), 'ROKKU validation locks are incomplete');

assert(publicCandidate.includes('ROKKU · MAISON DE CADEAUX PREMIUM'), 'ROKKU public candidate positioning is missing');
assert(publicCandidate.includes('Le plaisir d’offrir'), 'ROKKU public candidate signature is missing');
assert(publicCandidate.includes('Offrir sans banaliser'), 'ROKKU public candidate editorial promise is missing');
assert(publicCandidate.includes('ROKKU pour les entreprises'), 'ROKKU B2B commercial section is missing');
assert(publicCandidate.includes('La Maison ROKKU'), 'ROKKU brand story section is missing');
assert(publicCandidate.includes('Formulaire désactivé en prépublication'), 'ROKKU contact safety lock is missing');
assert(publicCandidate.includes('Mentions légales — à valider'), 'ROKKU legal placeholder is missing');

assert(openingDossier.includes('Logo ROKKU vectoriel'), 'ROKKU opening dossier logo status is missing');
assert(openingDossier.includes('Catalogue produit canonique'), 'ROKKU opening dossier catalogue gate is missing');
assert(openingDossier.includes('Publication') && openingDossier.includes('Interdite'), 'ROKKU publication gate is missing');

for (const forbidden of ['prix : 49', 'stock disponible', 'livraison garantie', 'commander maintenant']) {
  for (const [name, html] of [['BAT', bat], ['validation', validation], ['public candidate', publicCandidate], ['opening dossier', openingDossier]]) {
    assert(!html.toLowerCase().includes(forbidden), `Forbidden invented ${name} data found: ${forbidden}`);
  }
}

console.log('Validated ROKKU private control, BAT, public-site candidate, branding, commercial copy, safety locks and opening gates.');
