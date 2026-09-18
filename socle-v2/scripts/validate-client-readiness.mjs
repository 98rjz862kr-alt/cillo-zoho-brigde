import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { readDraftHtml } from '../../drafts.js';

const contract=JSON.parse(readFileSync('socle-v2/contracts/client-facing-routes.v1.json','utf8'));
const forbidden=/\b(?:BAT|gate|candidate|placeholder|lorem|recette humaine|validation humaine|journal de recette|sommaire de contrôle|matrice QA|protocole d[’']exécution|Drive\s*→\s*SHA|SHA-?256)\b/i;
const oldBrand=/LES MOTS IMAGES(?![A-ZÉ])/i;
function stripEnvironment(html){
  return html
    .replace(/<div\b[^>]*class=["'][^"']*(?:bridge|private|top|bar)[^"']*["'][^>]*>[\s\S]*?<\/div>/i,'')
    .replace(/<style\b[\s\S]*?<\/style>/gi,'')
    .replace(/<script\b[\s\S]*?<\/script>/gi,'');
}
function usefulImages(html){
  return [...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>{
    const alt=(tag.match(/\balt=["']([^"']*)["']/i)?.[1]||'').trim();
    return alt.length>=8 && !/logo/i.test(alt);
  });
}
function actions(html){return [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].filter(m=>/class=["'][^"']*(?:btn|button|action|work|textlink)/i.test(m[0]));}
let pages=0, homes=0;
for(const [site,definition] of Object.entries(contract.sites)){
  for(const route of definition.visitorRoutes){
    const html=readDraftHtml(route);
    if(!html)throw new Error(`${site}: visitor route missing: ${route}`);
    pages++;
    if(!/<meta[^>]+name=["']viewport["']/i.test(html))throw new Error(`${site}: viewport missing: ${route}`);
    if((html.match(/<h1\b/gi)||[]).length!==1)throw new Error(`${site}: exactly one h1 required: ${route}`);
    if(!/<title[^>]*>[^<]+<\/title>/i.test(html))throw new Error(`${site}: title missing: ${route}`);
    const description=html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i)?.[1] || '';
    if(description.trim().length<40)throw new Error(`${site}: useful meta description missing: ${route}`);
    const content=stripEnvironment(html);
    const visibleText=content.replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ');
    if(forbidden.test(visibleText))throw new Error(`${site}: internal production vocabulary leaked into visitor content: ${route}`);
    if(oldBrand.test(visibleText))throw new Error(`${site}: non-canonical brand leaked: ${route}`);
    for(const match of html.matchAll(/href=["']([^"']+)["']/gi)){
      const href=match[1];
      if(!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:|javascript:|\/atelier\/|\/api\/)/i.test(href))continue;
      const raw=href.split(/[?#]/)[0];
      if(!raw.endsWith('.html'))continue;
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(route),raw));
      if((definition.internalRoutesExcluded||[]).includes(target))throw new Error(`${site}: visitor route links to internal control route: ${route} -> ${target}`);
      if(!existsSync(path.join('drafts',target)))throw new Error(`${site}: visitor route has missing local target: ${route} -> ${target}`);
    }
  }
  if(!definition.contactRoute || !definition.visitorRoutes.includes(definition.contactRoute))throw new Error(`${site}: contact route must be in visitor scope`);
  const contact=readDraftHtml(definition.contactRoute);
  const contactText=stripEnvironment(contact||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  if(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(contactText) && !/WhatsApp|t[ée]l[ée]phone/i.test(contactText))throw new Error(`${site}: usable contact method missing`);
  const home=readDraftHtml(definition.home);
  if(!home)throw new Error(`${site}: home missing`);
  homes++;
  if(usefulImages(home).length<1)throw new Error(`${site}: homepage needs at least one approved non-logo visual`);
  if(actions(home).length<1)throw new Error(`${site}: homepage needs at least one visitor action`);
}
console.log(`CLIENT_READINESS_STRUCTURAL_PASS ${homes} sites / ${pages} visitor routes`);
console.log('HUMAN_AESTHETIC_COMMERCIAL_JUDGEMENT_PENDING');
