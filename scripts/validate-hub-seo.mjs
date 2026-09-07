import { listDraftFiles, readDraftHtml } from '../drafts.js';

const PUBLIC_PREFIXES = new Set(['01','02','03','04','05','06','07','08']);
const drafts = listDraftFiles().filter((draft) => draft.relativePath.startsWith('hub-lmi-editions/'));
for (const draft of drafts) {
  const file = draft.relativePath.split('/').pop();
  if (!PUBLIC_PREFIXES.has(file.slice(0,2))) continue;
  const html = readDraftHtml(draft.relativePath);
  if (!html) throw new Error(`Unable to render ${draft.relativePath}`);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim() || '';
  const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim() || '';
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m)=>m[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
  if (title.length < 20) throw new Error(`Weak or missing title on ${draft.relativePath}`);
  if (description.length < 60) throw new Error(`Weak or missing description on ${draft.relativePath}`);
  if (h1s.length !== 1 || h1s[0].length < 12) throw new Error(`Invalid H1 structure on ${draft.relativePath}`);
  if (/brouillon|bridge|recette|bat\b/i.test(`${title} ${description} ${h1s[0]}`)) throw new Error(`Internal wording in visitor SEO fields on ${draft.relativePath}`);
}

console.log('Validated visitor SEO essentials on Hub pages 01–32: title, description and single visitor-ready H1.');
