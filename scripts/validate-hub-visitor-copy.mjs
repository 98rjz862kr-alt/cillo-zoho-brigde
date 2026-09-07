import { listDraftFiles, readDraftHtml } from '../drafts.js';

const PRIVATE_SOMMAIRE='hub-lmi-editions/00-sommaire-hub-lmi-editions.html';
const internalMarkers = [
  /\bbrouillon\b/i,
  /bridge\.lesmotsimages\.com/i,
  /\bvalidation humaine(?: obligatoire)?\b/i,
  /\bpose cms\b/i,
  /\bstatut du lot\b/i,
  /\bpage p\d+\b/i,
  /\bversion de recette\b/i,
  /\baucune publication\b/i,
  /\brecette priv[ée]e?\b/i,
  /\bcontr[oô]le priv[ée]\b/i,
  /\bplaceholder\b/i,
  /\btemplate\b/i,
  /\bpr\s*#\d+\b/i,
  /\brc\d+\b/i,
  /\bBAT\b/,
  /site complet de recette/i,
  /PRIV[ÉE]/
];

function visibleText(html) {
  return String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const canonical = {
  '01-accueil.html': [
    'Un écosystème structuré autour de LMI Éditions',
    'LMI Éditions porte la source éditoriale, narrative et visuelle ; LMI Maison, LMI Food et LMI Musée en prolongent les usages dans des métiers distincts.'
  ],
  '02-comprendre-lmi.html': ['LMI Éditions, pôle source de l’écosystème LMI'],
  '03-choisir-son-pole.html': ['Choisir son pôle dans l’écosystème LMI'],
  '04-poles-associes.html': ['Les pôles associés à LMI Éditions'],
  '05-contact.html': ['Les Mots Images — informations et contacts officiels'],
  '06-lmi-maison.html': ['LMI Maison — le prolongement domestique, textile et décoratif'],
  '07-lmi-food.html': ['LMI Food — un univers culinaire premium, universel et transmissible'],
  '08-lmi-musee.html': ['LMI Musée — conserver, documenter et transmettre']
};

const hubDrafts = listDraftFiles().filter((draft) => draft.relativePath.startsWith('hub-lmi-editions/') && draft.relativePath!==PRIVATE_SOMMAIRE);
for (const draft of hubDrafts) {
  const html = readDraftHtml(draft.relativePath);
  const text = visibleText(html);
  for (const marker of internalMarkers) {
    if (marker.test(text)) throw new Error(`Internal production wording leaked into visitor copy: ${draft.relativePath} (${marker})`);
  }
  const file = draft.relativePath.split('/').pop();
  for (const expected of canonical[file] || []) {
    if (!text.includes(expected)) throw new Error(`Canonical visitor copy missing from ${draft.relativePath}: ${expected}`);
  }
}

const expectedPoleLinks={
  '06-lmi-maison.html':'https://maison.lesmotsimages.com',
  '07-lmi-food.html':'https://food.lesmotsimages.com',
  '08-lmi-musee.html':'https://musee.lesmotsimages.com'
};
for(const [file,href] of Object.entries(expectedPoleLinks)){const html=readDraftHtml(`hub-lmi-editions/${file}`);if(!html.includes(`href="${href}"`))throw new Error(`Canonical inter-site link missing from ${file}: ${href}`);}

const sommaire=readDraftHtml(PRIVATE_SOMMAIRE);
if(!sommaire)throw new Error('Private Hub sommaire is missing');
if(!/noindex/i.test(sommaire))throw new Error('Private Hub sommaire must remain non-indexable');

console.log(`Validated visitor-ready copy on ${hubDrafts.length} public-candidate Hub pages; private sommaire remains isolated and noindex.`);
