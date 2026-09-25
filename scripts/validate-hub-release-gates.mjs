import { readFileSync } from 'node:fs';
import { listDraftFiles, readDraftHtml } from '../drafts.js';
import { getHubAssetIntegrity } from '../hub-asset-integrity.js';

const PUBLIC_PAGE=/^hub-lmi-editions\/(?:0[1-9]|[12][0-9]|3[0-2])-[^/]+\.html$/;
const pages=listDraftFiles().filter(d=>PUBLIC_PAGE.test(d.relativePath));
if(pages.length!==32)throw new Error(`Expected 32 visitor Hub pages, found ${pages.length}`);
const manifest=JSON.parse(readFileSync(new URL('../drafts/hub-lmi-editions/media-manifest.json',import.meta.url),'utf8'));
if(manifest.publicRelease!=='NOT_APPROVED')throw new Error('Hub public release lock must remain NOT_APPROVED before human recipe');
for(const asset of manifest.assets){
  const name=asset.path.replace(/^assets\//,'');
  const integrity=getHubAssetIntegrity(name);
  if(integrity.sha256!==asset.sha256||integrity.size!==asset.bytes)throw new Error(`Release gate asset mismatch: ${name}`);
  if(asset.publicationApproval!=='HUMAN_RECIPE_REQUIRED')throw new Error(`Unexpected publication approval state: ${name}`);
}
const forbidden=/(?:^|[^\p{L}\p{N}_])(?:brouillon|recette humaine|validation humaine|pose cms|statut du lot|placeholder|prépublication|accès privé|atelier|candidate|gate)(?=$|[^\p{L}\p{N}_])/iu;
const bat=/(?:^|[^\p{L}\p{N}_])BAT(?=$|[^\p{L}\p{N}_])/u;
for(const page of pages){
  const html=readDraftHtml(page.relativePath)||'';
  const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  if(forbidden.test(visible)||bat.test(visible))throw new Error(`Internal production wording remains in ${page.relativePath}`);
}
console.log(JSON.stringify({site:'editions.lesmotsimages.com',privateCandidate:'CROSS_BRANCH_QUALIFIED',publicPublication:'LOCKED_HUMAN_RECIPE_REQUIRED',visitorPages:pages.length,hashedServedVisuals:manifest.assets.length,p0Technical:0},null,2));
