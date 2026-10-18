import { readFileSync } from 'node:fs';
const map=JSON.parse(readFileSync('socle-v2/contracts/site-content-control-map.v1.json','utf8'));
let routes=0,sources=0;
for(const [site,def] of Object.entries(map.sites||{})){
  if(!Array.isArray(def.routes)||!def.routes.length)throw new Error(`${site}: routes missing`);
  for(const row of def.routes){
    routes++;
    if(!Array.isArray(row.sources)||!row.sources.length)throw new Error(`${site}: ${row.route} has no source`);
    for(const src of row.sources){
      sources++;
      if(!src.driveId)throw new Error(`${site}: ${row.route} source Drive ID missing`);
      const hashes=[src.sha256,src.docxSha256,src.pdfSha256].filter(Boolean);
      if(!hashes.length||hashes.some(x=>!/^[0-9a-f]{64}$/.test(x)))throw new Error(`${site}: ${row.route} source SHA-256 missing/invalid`);
    }
  }
}
console.log(`SITE_CONTENT_CONTROL_MAP_PASS ${Object.keys(map.sites).length} sites / ${routes} routes / ${sources} source bindings`);
