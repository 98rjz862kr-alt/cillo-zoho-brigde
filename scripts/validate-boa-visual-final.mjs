import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve('drafts/boa-totem-soya');
const manifestPath=resolve(root,'visual-qa-final.json');
const errors=[];
const fail=(msg)=>errors.push(msg);
const requiredText=(value,label)=>{if(typeof value!=='string'||value.trim().length<3)fail(`${label}: valeur absente`)};

if(!existsSync(manifestPath)){
  console.error('BOA TOTEM DE SOYA — recette graphique NON PRETE');
  console.error('visual-qa-final.json absent: aucun lot ne peut etre declare graphiquement final.');
  process.exit(1);
}

let manifest;
try{manifest=JSON.parse(readFileSync(manifestPath,'utf8'))}catch{console.error('visual-qa-final.json invalide');process.exit(1)}

if(manifest.project!=='LE BOA TOTEM DE SOYA')fail('Projet incorrect');
if(manifest.state!=='READY_FOR_HUMAN_RECIPE')fail('state doit etre READY_FOR_HUMAN_RECIPE');
if(manifest.visualQaStatus!=='PASS')fail('visualQaStatus doit etre PASS');
if(manifest.machineOnly===true)fail('Une validation machine seule est interdite');
requiredText(manifest.reviewedAt,'reviewedAt');
requiredText(manifest.reviewMethod,'reviewMethod');
if(!String(manifest.reviewMethod||'').toLowerCase().includes('visuel'))fail('reviewMethod doit mentionner un controle visuel reel');

const groups={
  modelSheets:{count:3,names:['SOYA','CILLO','SIDAAT']},
  bd:{count:18},
  album:{count:12},
  da:{count:50}
};

for(const [groupName,rule] of Object.entries(groups)){
  const assets=manifest.assets?.[groupName];
  if(!Array.isArray(assets)){fail(`${groupName}: liste absente`);continue}
  if(assets.length!==rule.count)fail(`${groupName}: ${assets.length}/${rule.count}`);
  assets.forEach((asset,index)=>{
    const label=`${groupName}[${index}]`;
    requiredText(asset.id,label+'.id');
    requiredText(asset.driveFileId,label+'.driveFileId');
    requiredText(asset.sha256,label+'.sha256');
    if(!/^[a-f0-9]{64}$/i.test(asset.sha256||''))fail(`${label}.sha256 invalide`);
    if(asset.status!=='VISUALLY_INSPECTED_PASS')fail(`${label}: statut visuel non valide`);
    if(asset.placeholder===true||asset.schematic===true)fail(`${label}: placeholder/schema interdit`);
    if(!Number.isFinite(asset.width)||!Number.isFinite(asset.height)||asset.width<1000||asset.height<1000)fail(`${label}: dimensions insuffisantes ou absentes`);
    requiredText(asset.visualNotes,label+'.visualNotes');
  });
  if(rule.names){
    const got=new Set(assets.map(x=>String(x.id||'').toUpperCase()));
    for(const name of rule.names)if(!got.has(name))fail(`modelSheets: ${name} absent`);
  }
}

const locks=manifest.continuityLocks||{};
for(const key of ['soyaHeroineCentral','cilloHairNoRearExtension','sidaatAgeDistinct','boaProtectiveNonAggressive','noReligiousSigns','watercolorDigitalRealistic']){
  if(locks[key]!==true)fail(`continuityLocks.${key} doit etre true`);
}

const dialogues=manifest.dialogues||{};
const canon={
  cillo1:'Attends... ça recommence seulement quand tu avances.',
  sidaat1:'Soya, tes jambes ont peur ?',
  cillo2:'On doit demander qui les a faites.',
  sidaat2:'Le boa aussi a eu mal ?',
  soya:"C'est moi que le signe a arrêtée. Alors c'est moi qui dois commencer."
};
for(const [k,v] of Object.entries(canon))if(dialogues[k]!==v)fail(`dialogues.${k}: divergence canonique`);

if(manifest.prepress?.status!=='PASS')fail('Prepress non valide');
if(manifest.lettering?.status!=='PASS')fail('Lettrage non valide');
if(manifest.daAudio?.status!=='PASS')fail('DA audio non valide');
if(manifest.animation?.status!=='PASS')fail('Animation non valide');

if(errors.length){
  console.error('BOA TOTEM DE SOYA — recette graphique NON PRETE');
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('BOA TOTEM DE SOYA — GATE VISUEL FINAL: PASS');
console.log('3 model sheets + 18 planches BD + 12 doubles pages + 50 plans DA controles visuellement; prepress, lettrage, animation et audio PASS.');
