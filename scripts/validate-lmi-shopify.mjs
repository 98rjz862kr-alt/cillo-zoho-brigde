import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve('drafts/lmi-shopify/boutique-lmi-v1.html');
const html = readFileSync(file, 'utf8');

const checks = [
  ['doctype', /<!doctype html>/i],
  ['langue française', /<html[^>]+lang="fr"/i],
  ['viewport mobile', /name="viewport"/i],
  ['noindex recette privée', /noindex/i],
  ['bleu LMI', /#143B7D/i],
  ['ocre LMI', /#CC7722/i],
  ['sable LMI', /#75553F/i],
  ['or LMI', /#D4AF37/i],
  ['signature LMI', /LE VERBE PAR L[’']IMAGE/i],
  ['navigation nouveautés', /Nouveautés/i],
  ['navigation éditions', /Éditions/i],
  ['navigation maison', /Maison/i],
  ['navigation lifestyle', /Lifestyle/i],
  ['panier visible', /Panier · 0/i],
  ['grille produits', /class="grid"/i],
  ['prix renseignés', /24 €[\s\S]*18 €[\s\S]*690 €[\s\S]*49 €/i],
  ['responsive mobile', /@media\(max-width:560px\)/i],
  ['aucun script tiers', !/<script\b/i]
];

const failures = checks.filter(([, rule]) => rule instanceof RegExp ? !rule.test(html) : !rule);

if (failures.length) {
  console.error(`Validation Shopify LMI échouée: ${failures.map(([name]) => name).join(', ')}`);
  process.exit(1);
}

console.log(`Shopify LMI: ${checks.length}/${checks.length} contrôles conformes.`);
