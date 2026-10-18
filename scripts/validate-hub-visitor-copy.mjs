import { listDraftFiles, readDraftHtml } from '../drafts.js';

const PRIVATE='hub-lmi-editions/00-sommaire-hub-lmi-editions.html';
const visitor=listDraftFiles().filter(d=>/^hub-lmi-editions\/(?:0[1-9]|[12][0-9]|3[0-2])-.+\.html$/i.test(d.relativePath));
const internal=/(?:^|[^\p{L}\p{N}_])(?:brouillon|recette humaine|validation humaine|pose cms|statut du lot|version de recette|contrôle privé|prépublication|accès privé|placeholder|template|atelier|gate|candidate)(?=$|[^\p{L}\p{N}_])/iu;
const bat=/(?:^|[^\p{L}\p{N}_])BAT(?=$|[^\p{L}\p{N}_])/u;
function visible(html){return String(html||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<!--[^]*?-->/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
for(const d of visitor){
 const html=readDraftHtml(d.relativePath);
 const text=visible(html);
 if(internal.test(text)||bat.test(text))throw new Error('Internal production wording leaked into visitor copy: '+d.relativePath);
 if(/LES MOTS IMAGES\b|Les Mots Images\b/.test(text))throw new Error('Non-canonical displayed brand leaked into visitor copy: '+d.relativePath);
}
const privateHtml=readDraftHtml(PRIVATE);
if(!privateHtml||!/noindex/i.test(privateHtml))throw new Error('Private Hub sommaire must remain isolated and noindex');
const home=readDraftHtml('hub-lmi-editions/01-accueil.html');
if(!visible(home).includes('Des mots qui deviennent images, mémoire et transmission.'))throw new Error('Current canonical Hub home H1 missing');
console.log('HUB_VISITOR_COPY_PASS '+visitor.length);
