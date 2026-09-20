import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDraftHtml } from '../../drafts.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const contract=JSON.parse(readFileSync(path.join(root,'socle-v2/contracts/client-facing-routes.v1.json'),'utf8'));
const forbidden=/(?:^|[^\p{L}\p{N}_])(?:gate|candidate|placeholder|lorem|recette humaine|validation humaine|journal de recette|sommaire de contrôle|matrice QA|protocole d[’']exécution|Drive\s*→\s*SHA|SHA-?256|prépublication|accès privé|brouillon|atelier)(?=$|[^\p{L}\p{N}_])/iu;\nconst forbiddenBat=/(?:^|[^\p{L}\p{N}_])BAT(?=$|[^\p{L}\p{N}_])/u;
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
function hasDirectContactAction(html){
  return /href=["'](?:mailto:|tel:|https:\/\/(?:www\.)?wa\.me\/)/i.test(html);
}
function hasKeyboardFocusSupport(html,route){
  if(/:focus-visible\b/i.test(html))return true;
  for(const match of html.matchAll(/<link\b[^>]*>/gi)){
    const tag=match[0];
    if(!/\brel=["'][^"']*stylesheet[^"']*["']/i.test(tag))continue;
    const href=tag.match(/\bhref=["']([^"']+)["']/i)?.[1]||'';
    if(!href || /^(?:https?:|\/\/|data:)/i.test(href))continue;
    const raw=href.split(/[?#]/)[0];
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(route),raw));
    const disk=path.resolve(root,'drafts',target);
    if(existsSync(disk) && /:focus-visible\b/i.test(readFileSync(disk,'utf8')))return true;
  }
  return false;
}
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
    if(forbidden.test(visibleText)||forbiddenBat.test(visibleText))throw new Error(`${site}: internal production vocabulary leaked into visitor content: ${route}`);
    if(oldBrand.test(visibleText))throw new Error(`${site}: non-canonical brand leaked: ${route}`);
    const rawHtml=readFileSync(path.join(root,'drafts',route),'utf8');
    if(!hasKeyboardFocusSupport(rawHtml,route))throw new Error(`${site}: visible keyboard focus support missing: ${route}`);
    for(const match of rawHtml.matchAll(/href=["']([^"']+)["']/gi)){
      const href=match[1];
      if(!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:|javascript:|\/atelier\/|\/api\/)/i.test(href))continue;
      const raw=href.split(/[?#]/)[0];
      if(!raw.endsWith('.html'))continue;
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(route),raw));
      if((definition.internalRoutesExcluded||[]).includes(target))throw new Error(`${site}: visitor route links to internal control route: ${route} -> ${target}`);
      if(!existsSync(path.join('drafts',target)))throw new Error(`${site}: visitor route has missing local target: ${route} -> ${target}`);
      if(!definition.visitorRoutes.includes(target))throw new Error(`${site}: visitor route links outside qualified visitor scope: ${route} -> ${target}`);
    }
  }
  if(!definition.contactRoute || !definition.visitorRoutes.includes(definition.contactRoute))throw new Error(`${site}: contact route must be in visitor scope`);
  if(!definition.legalRoute || !definition.visitorRoutes.includes(definition.legalRoute))throw new Error(`${site}: legal/privacy route must be in visitor scope`);
  const legal=readDraftHtml(definition.legalRoute);
  if(!legal)throw new Error(`${site}: legal/privacy route missing`);
  const legalText=stripEnvironment(legal).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  for(const required of [/Éditeur du site/i,/Propriété intellectuelle/i,/(?:Données|confidentialité)/i,/Responsable de publication/i,/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i]){
    if(!required.test(legalText))throw new Error(`${site}: administrative/legal content incomplete: ${definition.legalRoute}`);
  }
  const contactRaw=readFileSync(path.join(root,'drafts',definition.contactRoute),'utf8');
  const legalBasename=path.posix.basename(definition.legalRoute);
  if(!contactRaw.includes(legalBasename))throw new Error(`${site}: legal/privacy route not discoverable from contact page`);
  const contact=readDraftHtml(definition.contactRoute);
  const contactText=stripEnvironment(contact||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  if(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(contactText) && !/WhatsApp|t[ée]l[ée]phone/i.test(contactText))throw new Error(`${site}: usable contact method missing`);
  if(!hasDirectContactAction(contact||''))throw new Error(`${site}: direct contact action missing on contact route`);
  const home=readDraftHtml(definition.home);
  if(!home)throw new Error(`${site}: home missing`);
  homes++;
  if(usefulImages(home).length<1)throw new Error(`${site}: homepage needs at least one approved non-logo visual`);
  if(actions(home).length<1)throw new Error(`${site}: homepage needs at least one visitor action`);
}
for(const site of Object.keys(contract.sites)){
  const recipePath=`socle-v2/recipe/${site}-human-recipe-2026-09-18.json`;
  if(!existsSync(recipePath))throw new Error(`${site}: human client recipe matrix missing`);
  const recipe=JSON.parse(readFileSync(recipePath,'utf8'));
  if(!Array.isArray(recipe.checks)||recipe.checks.length<12)throw new Error(`${site}: client recipe matrix incomplete`);
  if(recipe.checks.some(check=>check.result!=='PENDING'))throw new Error(`${site}: human recipe result recorded before human execution`);
  if(recipe.finalDecision!=='PENDING')throw new Error(`${site}: final human decision recorded prematurely`);
}
console.log(`CLIENT_READINESS_STRUCTURAL_PASS ${homes} sites / ${pages} visitor routes`);
console.log('HUMAN_AESTHETIC_COMMERCIAL_JUDGEMENT_PENDING');
