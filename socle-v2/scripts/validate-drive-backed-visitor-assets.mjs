import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const contract=JSON.parse(readFileSync(path.join(root,'socle-v2/contracts/client-facing-routes.v1.json'),'utf8'));
let pages=0, images=0;
for(const [site,definition] of Object.entries(contract.sites)){
  for(const route of definition.visitorRoutes){
    pages++;
    const disk=path.join(root,'drafts',route);
    const html=readFileSync(disk,'utf8');
    for(const match of html.matchAll(/<img\b[^>]*>/gi)){
      images++;
      const tag=match[0];
      const src=tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]||'';
      const driveId=tag.match(/\bdata-lmi-drive-id=["']([^"']+)["']/i)?.[1]||'';
      const expected=tag.match(/\bdata-lmi-sha256=["']([0-9a-f]{64})["']/i)?.[1]||'';
      if(!src)throw new Error(`${site}: image src missing: ${route}`);
      if(/^data:/i.test(src))throw new Error(`${site}: embedded/generated image forbidden: ${route}`);
      if(!driveId)throw new Error(`${site}: Drive ID missing on visitor image: ${route} -> ${src}`);
      if(!expected)throw new Error(`${site}: SHA-256 missing on visitor image: ${route} -> ${src}`);
      if(/^(?:https?:|\/\/)/i.test(src))throw new Error(`${site}: remote visitor image forbidden without local exact-byte mirror: ${route} -> ${src}`);
      const raw=src.split(/[?#]/)[0];
      const target=path.resolve(path.dirname(disk),raw);
      if(!existsSync(target))throw new Error(`${site}: visitor image file missing: ${route} -> ${src}`);
      const actual=crypto.createHash('sha256').update(readFileSync(target)).digest('hex');
      if(actual!==expected)throw new Error(`${site}: visitor image SHA mismatch: ${route} -> ${src}; expected ${expected}, got ${actual}`);
    }
  }
}
console.log(`DRIVE_BACKED_VISITOR_ASSETS_PASS ${Object.keys(contract.sites).length} sites / ${pages} pages / ${images} image refs`);
