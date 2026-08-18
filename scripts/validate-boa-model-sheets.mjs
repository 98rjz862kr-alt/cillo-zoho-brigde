import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve('drafts/boa-totem-soya/final-assets/model-sheets');
const expected=['MODEL-SOYA-v001.png','MODEL-CILLO-v001.png','MODEL-SIDAAT-v001.png','LINEUP-TRIO-v001.png'];
const errors=[];

function pngSize(file){
  const b=readFileSync(file);
  if(b.length<24||b[0]!==0x89||b.toString('ascii',1,4)!=='PNG')return null;
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}

for(const name of expected){
  const file=resolve(root,name);
  if(!existsSync(file)){errors.push(`${name}: absent`);continue;}
  const bytes=statSync(file).size;
  if(bytes<300000)errors.push(`${name}: fichier anormalement léger (${bytes} octets)`);
  const size=pngSize(file);
  if(!size){errors.push(`${name}: PNG invalide`);continue;}
  if(size.width<1400||size.height<1000)errors.push(`${name}: dimensions insuffisantes ${size.width}x${size.height}`);
}

const qaPath=resolve(root,'QA-MODEL-SHEETS.json');
if(!existsSync(qaPath))errors.push('QA-MODEL-SHEETS.json absent');
else{
  const qa=JSON.parse(readFileSync(qaPath,'utf8'));
  if(qa.status!=='VISUALLY_INSPECTED_PASS')errors.push('QA globale model sheets non PASS');
  for(const id of ['SOYA','CILLO','SIDAAT']){
    const item=qa.characters?.[id];
    if(!item||item.status!=='VISUALLY_INSPECTED_PASS')errors.push(`${id}: QA visuelle non PASS`);
  }
  if(qa.characters?.CILLO?.backViewHairStopsAtNape!==true)errors.push('CILLO: contrôle arrière nuque non validé');
  if(qa.lineup?.status!=='VISUALLY_INSPECTED_PASS')errors.push('Line-up trio: QA visuelle non PASS');
  if(qa.lineup?.soyaTallest!==true||qa.lineup?.sidaatSmallest!==true)errors.push('Line-up trio: proportions relatives non validées');
}

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('BOA TOTEM — MODEL SHEETS: GATE TECHNIQUE + QA VISUELLE PASS');
