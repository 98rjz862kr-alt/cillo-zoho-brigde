import { listDraftFiles, readDraftHtml } from '../drafts.js';

const expectedHubFiles = [
  '00-sommaire-hub-lmi-editions.html','01-accueil.html','02-comprendre-lmi.html','03-choisir-son-pole.html','04-poles-associes.html','05-contact.html','06-lmi-maison.html','07-lmi-food.html','08-lmi-musee.html','09-manuscrits-textes.html','10-ressources-acces-fiches.html','11-catalogue-editorial.html','12-catalogue-bd-adaptations.html','13-univers-illustres-da.html','14-audio-transmission.html','15-livres-audio.html','16-actualites-evenements.html','17-a-propos-ressources.html','18-blog.html','19-presse-partenaires-droits.html','20-mentions-legales-confidentialite.html','21-destination-connue-itineraires-incertains.html','22-lettres-a-ceux-qui-viendront.html','23-sombres-memoires-verbes-muets.html','24-la-femme-maitresse-du-monde-mais-ostracisee.html','25-le-peuple-sans-messager.html','26-feodalisme-religieux.html','27-l-utopie-pour-faconner-le-reel.html','28-l-autocensure.html','29-le-racisme-est-universel.html','30-l-otage-de-l-absurde.html','31-le-boa-totem-de-soya.html','32-le-fleuve-sans-nom.html'
];

const allDrafts=listDraftFiles();
const hubDrafts=allDrafts.filter((draft)=>draft.relativePath.startsWith('hub-lmi-editions/'));
const actualFiles=new Set(hubDrafts.map((draft)=>draft.relativePath.split('/').pop()));
for(const file of expectedHubFiles){if(!actualFiles.has(file))throw new Error(`Hub file missing: ${file}`);}

for(const draft of hubDrafts){
  const html=readDraftHtml(draft.relativePath);
  if(!html)throw new Error(`Unable to read decorated Hub draft: ${draft.relativePath}`);
  if(!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html))throw new Error(`Robots noindex missing: ${draft.relativePath}`);
  if(!html.includes('id="lmi-hub-final-script"'))throw new Error(`Hub finalisation layer missing: ${draft.relativePath}`);
  if(!html.includes('id="lmi-accessibility-style"'))throw new Error(`Accessibility stylesheet missing: ${draft.relativePath}`);
  if(!html.includes('id="lmi-accessibility-script"'))throw new Error(`Accessibility script missing: ${draft.relativePath}`);
  if(!html.includes('prefers-reduced-motion'))throw new Error(`Reduced motion support missing: ${draft.relativePath}`);
  if(!html.includes('lmi-mobile-menu'))throw new Error(`Responsive navigation missing: ${draft.relativePath}`);

  const pageNumber=Number.parseInt(draft.relativePath.split('/').pop().slice(0,2),10);
  if(pageNumber>=2&&pageNumber<=32){
    if(!html.includes('data-lmi-runtime="premium-v2"'))throw new Error(`Premium runtime missing: ${draft.relativePath}`);
    if(!html.includes('id="lmi-premium-runtime-script"'))throw new Error(`Premium script missing: ${draft.relativePath}`);
    if(!html.includes('id="lmi-runtime-stability-script"'))throw new Error(`Runtime stability layer missing: ${draft.relativePath}`);
  }

  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((match)=>match[1]);
  for(const script of scripts){if(script.trim())new Function(script);}
}

const decoratedPage=readDraftHtml('hub-lmi-editions/26-feodalisme-religieux.html');
if(!decoratedPage.includes('"/feodalisme-religieux-fragmentation":"26-feodalisme-religieux.html"'))throw new Error('Legacy Féodalisme religieux route alias is missing');
if(!decoratedPage.includes('"/le-fleuve-sans-nom":"32-le-fleuve-sans-nom.html"'))throw new Error('Le Fleuve sans nom route alias is missing');
if(!decoratedPage.includes('lmi-route-breadcrumb'))throw new Error('Hub breadcrumb layer is missing');
if(!decoratedPage.includes('lmi-runtime-pager'))throw new Error('Hub previous/next navigation is missing');
if(decoratedPage.includes('class="lmi-wordmark-mark"'))throw new Error('Unofficial LMI monogram remains in protected Hub output');

console.log(`Validated ${hubDrafts.length} Hub LMI draft pages with protected routing, premium presentation, accessibility and responsive navigation.`);
