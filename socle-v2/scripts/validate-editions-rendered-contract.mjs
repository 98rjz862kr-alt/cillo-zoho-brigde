import { readdirSync } from 'node:fs';
import { readDraftHtml } from '../../drafts.js';

const files=readdirSync('drafts/hub-lmi-editions').filter((f)=>f.endsWith('.html')).sort();
if(files.length!==33)throw new Error(`Expected 33 Editions HTML pages, found ${files.length}`);
for(const file of files){
  const html=readDraftHtml(`hub-lmi-editions/${file}`)||'';
  if(!html)throw new Error(`Rendered Editions page unavailable: ${file}`);
  if(/LES MOTS IMAGES|Les Mots Images/.test(html))throw new Error(`Non-canonical brand leaked into rendered Editions page: ${file}`);
  if(!/noindex/i.test(html))throw new Error(`Bridge noindex lock missing from rendered Editions page: ${file}`);
}
console.log(`EDITIONS_RENDERED_CONTRACT_PASS ${files.length}`);
