import { readDraftHtml } from '../drafts.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const control = readDraftHtml('rokku-site/00-controle-prepublication.html');
const bat = readDraftHtml('rokku-site/01-bat-boutique.html');

for (const [name, html] of [['control', control], ['BAT', bat]]) {
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

for (const forbidden of ['prix : 49', 'stock disponible', 'livraison garantie', 'commander maintenant']) {
  assert(!bat.toLowerCase().includes(forbidden), `Forbidden invented commercial data found: ${forbidden}`);
}

console.log('Validated ROKKU private control page, BAT positioning, commerce locks and human-validation gate.');
