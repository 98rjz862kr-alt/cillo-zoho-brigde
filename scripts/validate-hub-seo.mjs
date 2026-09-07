import { listDraftFiles, readDraftHtml } from '../drafts.js';

const drafts = listDraftFiles().filter((draft) => draft.relativePath.startsWith('hub-lmi-editions/'));
function decodeHtml(value){return String(value||'').replace(/&amp;/g,'&').replace(/&quot;/g,'\"').replace(/&#039;/g,"'");}
for (const draft of drafts) {
  const file = draft.relativePath.split('/').pop();
  if (!/^(?:0[1-9]|[12][0-9]|3[0-2])-/.test(file)) continue;
  const html = readDraftHtml(draft.relativePath);
  if (!html) throw new Error(`Unable to render ${draft.relativePath}`);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim() || '';
  const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim() || '';
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m)=>m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
  if (title.length < 20) throw new Error(`Weak or missing title on ${draft.relativePath}`);
  if (description.length < 60) throw new Error(`Weak or missing description on ${draft.relativePath}`);
  if (h1s.length !== 1 || h1s[0].length < 12) throw new Error(`Invalid H1 structure on ${draft.relativePath}`);
  if (/brouillon|bridge|recette|bat\b/i.test(`${title} ${description} ${h1s[0]}`)) throw new Error(`Internal wording in visitor SEO fields on ${draft.relativePath}`);
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const ogTitle = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const ogDescription = html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const ogUrl = html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const expectedPath = file==='01-accueil.html' ? '/' : `/${file.replace(/^\d{2}-/,'').replace(/\.html$/i,'')}`;
  const expectedUrl = `https://www.lesmotsimages.com${expectedPath}`;
  if (canonical !== expectedUrl) throw new Error(`Canonical mismatch on ${draft.relativePath}: ${canonical}`);
  if (ogUrl !== expectedUrl) throw new Error(`OpenGraph URL mismatch on ${draft.relativePath}: ${ogUrl}`);
  if (decodeHtml(ogTitle) !== decodeHtml(title) || decodeHtml(ogDescription) !== decodeHtml(description)) throw new Error(`OpenGraph metadata mismatch on ${draft.relativePath}`);
}

console.log('Validated visitor SEO essentials on Hub pages 01–32: title, description and single visitor-ready H1.');
