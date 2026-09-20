import { listDraftFiles, readDraftHtml } from '../drafts.js';

const files=listDraftFiles().filter(d=>/^hub-lmi-editions\/(?:0[1-9]|[12][0-9]|3[0-2])-.+\.html$/i.test(d.relativePath));
for(const draft of files){
  const html=readDraftHtml(draft.relativePath);
  const title=html?.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim()||'';
  const description=html?.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim()
    ||html?.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i)?.[1]?.trim()||'';
  const h1s=[...(html||'').matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
  if(title.length<12)throw new Error('Weak/missing title: '+draft.relativePath);
  if(description.length<40)throw new Error('Weak/missing description: '+draft.relativePath);
  if(h1s.length!==1||h1s[0].length<10)throw new Error('Invalid H1 structure: '+draft.relativePath);
  if(/LES MOTS IMAGES\b|Les Mots Images\b/.test(title+' '+description+' '+h1s[0]))throw new Error('Non-canonical brand in SEO: '+draft.relativePath);
  if(/\b(?:brouillon|recette|prépublication|atelier|BAT)\b/i.test(title+' '+description+' '+h1s[0]))throw new Error('Internal production wording in SEO: '+draft.relativePath);
}
console.log('HUB_SEO_PASS '+files.length);
