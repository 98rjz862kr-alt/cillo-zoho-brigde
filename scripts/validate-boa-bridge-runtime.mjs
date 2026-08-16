import { readDraftAsset, readDraftHtml } from '../drafts.js';

const page = readDraftHtml('boa-totem-soya/25-recette-humaine-finale.html');
if (!page || !page.includes('Recette humaine finale')) {
  throw new Error('La page de recette Boa Totem n’est pas lisible par le runtime Bridge');
}

const rough = readDraftAsset('boa-totem-soya/assets/roughs/planche-12.svg');
if (!rough || rough.contentType !== 'image/svg+xml; charset=utf-8') {
  throw new Error('Le rough SVG de la planche 12 n’est pas servi comme asset protégé');
}
if (!rough.content.toString('utf8').includes('Planche 12')) {
  throw new Error('Le rough SVG servi ne correspond pas à la planche 12');
}

const shot = readDraftAsset('boa-totem-soya/assets/da/shot-050.svg');
if (!shot || !shot.content.toString('utf8').includes('PLAN 50')) {
  throw new Error('Le plan 50 de l’animatique n’est pas lisible par Bridge');
}

if (readDraftAsset('../package.json') !== null) {
  throw new Error('La protection anti-traversée de chemin des assets est cassée');
}
if (readDraftAsset('boa-totem-soya/manifest-finalisation.json') !== null) {
  throw new Error('Un type non autorisé est exposé comme asset');
}

console.log('Bridge Boa Totem: page finale + SVG protégés + garde-fous de chemin conformes.');
