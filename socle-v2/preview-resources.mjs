import path from 'node:path';
import { readFileSync } from 'node:fs';
import { listDraftFiles, readDraftHtml, readDraftAsset } from '../drafts.js';

export function collectPreviewResources() {
  const origins=JSON.parse(readFileSync(new URL('./site-origins.json',import.meta.url),'utf8'));
  const roots=new Map(Object.entries(origins.sites).map(([site,o])=>[o.root.replace(/^drafts\//,''),site]));
  const files=listDraftFiles().filter(f=>roots.has(f.relativePath.split('/')[0]));
  const resources=new Map(), links=[];
  for(const file of files){
    const html=readDraftHtml(file.relativePath);
    if(!html)throw new Error('Draft not rendered: '+file.relativePath);
    resources.set(file.relativePath,{site:roots.get(file.relativePath.split('/')[0]),type:'html',body:Buffer.from(html)});
    for(const tag of html.matchAll(/<(?:a|link|img|script|source|video|audio)\b[^>]*>/gi)){
      for(const match of tag[0].matchAll(/\s(href|src|poster)\s*=\s*(["'])([^"']*)\2/gi)){
        const value=match[3];
        if(!value||/^(?:#|data:|https?:|mailto:|tel:|javascript:)/i.test(value))continue;
        if(!value.startsWith('/atelier/file/'))continue;
        const url=new URL(value.replaceAll('&amp;','&'),'http://preview.invalid');
        const relative=decodeURIComponent(url.pathname.slice('/atelier/file/'.length));
        links.push({from:file.relativePath,to:relative});
        if(resources.has(relative))continue;
        if(relative.endsWith('.html')){
          const rendered=readDraftHtml(relative);
          if(!rendered)throw new Error('Broken preview link: '+file.relativePath+' -> '+relative);
          resources.set(relative,{site:roots.get(relative.split('/')[0])||'linked',type:'html',body:Buffer.from(rendered)});
        }else{
          const asset=readDraftAsset(relative);
          if(!asset)throw new Error('Missing preview resource: '+file.relativePath+' -> '+relative);
          resources.set(relative,{site:roots.get(relative.split('/')[0])||'linked',type:asset.contentType,body:Buffer.from(asset.content)});
        }
      }
    }
  }
  return {resources,links,pageCount:files.length};
}
