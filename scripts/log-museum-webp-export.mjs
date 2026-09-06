import { readFileSync } from 'node:fs';
const file='drafts/lmi-musee-complet/assets/lmi-logo-main.webp';
const b64=readFileSync(file).toString('base64');
const start=9*1024;
const target=b64.slice(start,start+1024);
for(let i=0;i<8;i++) console.log(`LMI_MUSEE_WEBP_B64_10 ${i+1}/8 ${target.slice(i*128,(i+1)*128)}`);
