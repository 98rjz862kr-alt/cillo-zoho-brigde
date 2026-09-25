import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const IGNORED=new Set(['.DS_Store']);

function walk(root,current=root){
  const entries=readdirSync(current,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'));
  return entries.flatMap((entry)=>{
    if(IGNORED.has(entry.name)) return [];
    const absolute=path.join(current,entry.name);
    if(entry.isDirectory()) return walk(root,absolute);
    if(!entry.isFile()) return [];
    return [path.relative(root,absolute).split(path.sep).join('/')];
  });
}

export function hashPackage(root){
  const absolute=path.resolve(root);
  if(!statSync(absolute).isDirectory()) throw new Error(`Not a directory: ${root}`);
  const manifest=[];
  for(const relative of walk(absolute)){
    const bytes=readFileSync(path.join(absolute,relative));
    const sha256=createHash('sha256').update(bytes).digest('hex');
    manifest.push({path:relative,size:bytes.length,sha256});
  }
  const digest=createHash('sha256');
  for(const item of manifest) digest.update(`${item.path}\0${item.size}\0${item.sha256}\n`,'utf8');
  return {sha256:digest.digest('hex'),files:manifest};
}

if(import.meta.url===new URL(`file://${process.argv[1]}`).href){
  const root=process.argv[2];
  if(!root) throw new Error('Usage: node package-hash.mjs <directory>');
  console.log(JSON.stringify(hashPackage(root),null,2));
}
