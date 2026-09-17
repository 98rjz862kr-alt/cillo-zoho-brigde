import { listDraftFiles, readDraftHtml } from '../drafts.js';

const pages=listDraftFiles().filter((draft)=>/^hub-lmi-editions\/(?:0[1-9]|[12][0-9]|3[0-2])-/.test(draft.relativePath));
if(pages.length!==32)throw new Error(`Expected 32 visitor pages, found ${pages.length}`);

for(const page of pages){
  let html=readDraftHtml(page.relativePath)||'';
  html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
  for(const match of html.matchAll(/<img\b([^>]*)>/gi)){
    if(!/\balt=["'][^"']*["']/i.test(match[1]))throw new Error(`Rendered image missing alt on ${page.relativePath}`);
  }
  for(const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)){
    const text=match[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    if(!text&&!/aria-label=["'][^"']+/i.test(match[1]))throw new Error(`Rendered button has no accessible name on ${page.relativePath}`);
  }
  if(!/lang=["']fr["']/i.test(html))throw new Error(`French language declaration missing on ${page.relativePath}`);
  const full=readDraftHtml(page.relativePath)||'';
  if(!full.includes('id="lmi-accessibility-script"')||!full.includes("skip.className='lmi-skip-link'"))throw new Error(`Runtime skip-link accessibility layer missing on ${page.relativePath}`);
}
console.log(`Validated rendered Hub accessibility basics on ${pages.length} visitor pages: language, skip links, image alt text and button accessible names.`);
