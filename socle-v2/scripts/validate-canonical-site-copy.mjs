import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const evidence=JSON.parse(readFileSync(path.join(root,'socle-v2/evidence/canonical-site-copy-drive-2026-09-23.json'),'utf8'));
const contract=JSON.parse(readFileSync(path.join(root,'socle-v2/contracts/client-facing-routes.v1.json'),'utf8'));
function visible(html){return html.replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').toLowerCase();}
let pages=0;
for(const [site,def] of Object.entries(contract.sites)){
  const cfg=evidence.sites[site];
  if(!cfg)throw new Error(`${site}: canonical copy evidence missing`);
  const texts=[];
  for(const route of def.visitorRoutes){
    pages++;
    const html=readFileSync(path.join(root,'drafts',route),'utf8');
    const text=visible(html); texts.push(text);
    for(const pattern of evidence.forbiddenVisiblePatterns){if(text.includes(pattern.toLowerCase()))throw new Error(`${site}: forbidden visible production copy ${pattern} in ${route}`);}
  }
  const merged=texts.join(' ');
  const missing=cfg.requiredConcepts.filter(x=>!merged.includes(x.toLowerCase()));
  if(missing.length)throw new Error(`${site}: canonical Drive concepts missing from visitor scope: ${missing.join(', ')}`);
}
console.log(`CANONICAL_SITE_COPY_PASS ${Object.keys(contract.sites).length} sites / ${pages} pages`);
