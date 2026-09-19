import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { readDraftHtml, listDraftFiles } from '../../drafts.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
let count=0;
for(const root of ['drafts/lmi-musee-complet','drafts/hub-lmi-editions']){
  const manifest=JSON.parse(readFileSync(path.join(root,'media-manifest.json'),'utf8'));
  for(const item of manifest.assets){
    const b=readFileSync(path.join(root,item.path));
    if(!item.sourceDriveId||!item.sourceBytesUnchanged||b.length!==item.bytes||sha(b)!==item.sha256)throw new Error('Canonical media differs from source: '+item.path);
    if(item.path.endsWith('.png')){
      if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Invalid PNG signature');
      let offset=8,ended=false;
      while(offset+12<=b.length){
        const n=b.readUInt32BE(offset),end=offset+12+n;
        if(end>b.length||crc32(b.subarray(offset+4,offset+8+n))!==b.readUInt32BE(offset+8+n))throw new Error('Truncated or corrupt PNG chunk: '+item.path);
        const type=b.subarray(offset+4,offset+8).toString();offset=end;
        if(type==='IEND'){ended=true;break;}
      }
      if(!ended||offset!==b.length)throw new Error('Incomplete PNG: '+item.path);
    }else if(item.path.endsWith('.jpg')){
      if(b.readUInt16BE(0)!==0xffd8||b.readUInt16BE(b.length-2)!==0xffd9)throw new Error('Incomplete JPEG: '+item.path);
    }
    count++;
  }
}
for(const f of listDraftFiles().filter(f=>f.relativePath.startsWith('hub-lmi-editions/'))){
  const html=readDraftHtml(f.relativePath);
  if(/IMG_9559|res\.cloudinary\.com/.test(html))throw new Error('Untraced external media restored in '+f.relativePath);
}
console.log('CANONICAL_MEDIA_SOURCE_AND_STRUCTURE_PASS',count,'assets; full decoder and visual review recorded in manifests; human publication approval remains pending');
