import { listDraftFiles, readDraftHtml } from '../drafts.js';

const pages=listDraftFiles().filter(d=>/^hub-lmi-editions\/(?:0[1-9]|[12][0-9]|3[0-2])-.+\.html$/i.test(d.relativePath));
if(pages.length!==32)throw new Error(`Expected 32 visitor pages, found ${pages.length}`);
for(const page of pages){
  const full=readDraftHtml(page.relativePath)||'';
  const html=full.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
  for(const match of html.matchAll(/<img\b([^>]*)>/gi)){
    if(!/\balt=["'][^"']*["']/i.test(match[1]))throw new Error(`Rendered image missing alt on ${page.relativePath}`);
  }
  for(const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)){
    const text=match[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    if(!text&&!/aria-label=["'][^"']+/i.test(match[1]))throw new Error(`Rendered button has no accessible name on ${page.relativePath}`);
  }
  if(!/lang=["']fr["']/i.test(html))throw new Error(`French language declaration missing on ${page.relativePath}`);
  if(!full.includes('lmi-skip-link'))throw new Error(`Runtime skip-link accessibility layer missing on ${page.relativePath}`);
  if(!/:focus-visible\b/i.test(full))throw new Error(`Visible focus treatment missing on ${page.relativePath}`);
}
console.log(`HUB_A11Y_RENDERED_PASS ${pages.length}`);
