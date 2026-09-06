import { readFileSync } from 'node:fs';
const file='drafts/lmi-musee-complet/assets/lmi-logo-main.webp';
const b64=readFileSync(file).toString('base64');
const chunkSize=1024;
const total=Math.ceil(b64.length/chunkSize);
for(let i=0;i<total;i++) console.log(`LMI_MUSEE_WEBP_B64 ${i+1}/${total} ${b64.slice(i*chunkSize,(i+1)*chunkSize)}`);
