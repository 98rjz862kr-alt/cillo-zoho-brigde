import { readFileSync } from 'node:fs';
const file='drafts/lmi-musee-complet/assets/lmi-logo-main.webp';
const b64=readFileSync(file).toString('base64');
const start=9*1024+6*128;
const target=b64.slice(start,start+128);
for(let i=0;i<8;i++) console.log(`LMI_MUSEE_WEBP_B64_10_7 ${i+1}/8 ${target.slice(i*16,(i+1)*16)}`);
