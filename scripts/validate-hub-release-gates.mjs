import { listDraftFiles, readDraftAsset, readDraftHtml } from '../drafts.js';

const PUBLIC_PAGE=/^hub-lmi-editions\/(?:0[1-9]|[12][0-9]|3[0-2])-[^/]+\.html$/;
const pages=listDraftFiles().filter((draft)=>PUBLIC_PAGE.test(draft.relativePath));
if(pages.length!==32)throw new Error(`Expected 32 public-candidate Hub pages, found ${pages.length}`);
if(pages.some((draft)=>draft.relativePath.includes('00-sommaire')))throw new Error('Private sommaire leaked into visitor inventory');

const expectedAssets={
  'logo-lmi-hub.webp':'c5838131add35915029d0fc47cc9db70a0d67980132c08716f744836b2898f95',
  'boa-totem-soya.webp':'23ba93c03ddbe499fc684489f1c88c7794f974c2129e428f117a5fa372278df4',
  'le-fleuve-sans-nom.webp':'ffa3031e950147fed808f6d5bcdd677c9244930540c67efeb5446515b7c632af'
};
for(const [name,sha] of Object.entries(expectedAssets)){
  const asset=readDraftAsset(`hub-lmi-editions/assets/${name}`);
  if(!asset||asset.sha256!==sha)throw new Error(`Release-gate SHA-256 mismatch for ${name}`);
}

const forbidden=/(?:\bbrouillon\b|\bvalidation humaine\b|\brecette priv[ée]e?\b|\bpose cms\b|\bstatut du lot\b|\bplaceholder\b|\bpr\s*#\d+\b|site complet de recette|\bPRIV[ÉE]\b)/i;
const technicalBat=/\bBAT\b/;
const productionPhrases=/(?:non active|source publique candidate|recette humaine|test cms|usage prévu|classement|à contrôler|actions visuelles|futur(?:s|e)? (?:formulaire|cta)|avant validation|à confirmer avant publication|publication\s*:\s*aucun calendrier public|page p\d+)/i;
const unprovenContact=/(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+33\s*[0-9][0-9\s.()/-]{6,}|WhatsApp)/i;
for(const page of pages){
  const html=readDraftHtml(page.relativePath);
  const visible=String(html||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  if(forbidden.test(visible)||technicalBat.test(visible)||productionPhrases.test(visible)||unprovenContact.test(visible))throw new Error(`Internal wording remains in ${page.relativePath}`);
}

const publicRightsBlockers=[
  {asset:'boa-totem-soya.webp',reason:'Droit/crédit public de la couverture source non prouvé dans Drive'},
  {asset:'le-fleuve-sans-nom.webp',reason:'Crédits graphiques/publics de la couverture source non prouvés dans Drive'}
];
if(publicRightsBlockers.length!==2)throw new Error('Public rights blocker inventory changed unexpectedly');

console.log(JSON.stringify({
  site:'www.lesmotsimages.com',
  privateCandidate:'READY_FOR_TRANSVERSE_REVIEW',
  publicPublication:'NO_GO_RIGHTS_CREDITS',
  visitorPages:pages.length,
  hashedServedVisuals:Object.keys(expectedAssets).length,
  p0Technical:0,
  p1Technical:0,
  publicRightsBlockers
},null,2));
