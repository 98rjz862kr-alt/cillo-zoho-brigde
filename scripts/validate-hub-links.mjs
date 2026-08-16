import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDraftHtml } from '../drafts.js';

const root=path.dirname(fileURLToPath(new URL('../package.json',import.meta.url)));
const hubRoot=path.join(root,'drafts','hub-lmi-editions');
const files=readdirSync(hubRoot).filter((name)=>name.toLowerCase().endsWith('.html')).sort();
const fileSet=new Set(files);

const sample=readDraftHtml('hub-lmi-editions/26-feodalisme-religieux.html');
if(!sample)throw new Error('Unable to render Hub route map sample');
const routeMatch=sample.match(/const routes=(\{[\s\S]*?\});const q=/);
if(!routeMatch)throw new Error('Hub route map is not exposed in the protected render');
const routes=JSON.parse(routeMatch[1]);

const unresolved=[];
const placeholders=[];
const directFiles=[];

for(const file of files){
  const html=readFileSync(path.join(hubRoot,file),'utf8');
  const hrefs=[...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["']/gi)].map((match)=>match[1].trim());
  for(const href of hrefs){
    if(!href||href==='#'){
      placeholders.push(`${file}: ${href||'(empty)'}`);
      continue;
    }
    if(href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||href.startsWith('javascript:'))continue;
    if(/^https?:\/\//i.test(href)||href.startsWith('//'))continue;
    if(href.includes('/atelier/file/')||href.startsWith('/preview/')||href.startsWith('/admin')||href.startsWith('/health'))continue;

    const clean=href.split(/[?#]/)[0];
    const fileMatch=clean.match(/(?:^|\/)([^/]+\.html)$/i);
    if(fileMatch){
      const target=fileMatch[1];
      if(!fileSet.has(target))directFiles.push(`${file} -> ${target}`);
      continue;
    }

    if(clean.startsWith('/')){
      const normalized=(clean.replace(/\/+$/,'')||'/').toLowerCase();
      if(!routes[normalized])unresolved.push(`${file} -> ${normalized}`);
    }
  }
}

if(directFiles.length)throw new Error(`Missing direct Hub HTML targets:\n${directFiles.join('\n')}`);
if(unresolved.length)throw new Error(`Unresolved internal Hub routes:\n${unresolved.join('\n')}`);
if(placeholders.length)throw new Error(`Hub placeholder links are forbidden:\n${placeholders.join('\n')}`);

for(const [route,target] of Object.entries(routes)){
  if(!fileSet.has(target))throw new Error(`Route ${route} targets missing file ${target}`);
}

console.log(`Validated ${files.length} Hub pages, ${Object.keys(routes).length} protected routes and all internal links without placeholders.`);
