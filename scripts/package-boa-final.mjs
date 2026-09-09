import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const repo=resolve('.');
const root=resolve('drafts/boa-totem-soya');
const out=resolve('dist/LE-BOA-TOTEM-DE-SOYA-FINAL');

const gate=spawnSync(process.execPath,['scripts/validate-boa-visual-final.mjs'],{stdio:'inherit'});
if(gate.status!==0)throw new Error('Packaging interdit: le gate visuel final n\'est pas PASS.');

const qa=JSON.parse(readFileSync(resolve(root,'visual-qa-final.json'),'utf8'));
if(qa.state!=='READY_FOR_HUMAN_RECIPE')throw new Error('Packaging interdit: état de recette incorrect.');

rmSync(out,{recursive:true,force:true});
mkdirSync(out,{recursive:true});
cpSync(resolve(root,'final-assets'),resolve(out,'final-assets'),{recursive:true});

const editorial=[
  '04-bible-visuelle.html',
  '06-script-bd-dialogues.html',
  '07-album-graphique-texte-integral.html',
  '08-da-script-technique.html',
  '09-da-sous-titres-fr.srt',
  '10-couverture-et-4e.html',
  '11-specifications-fabrication-proposees.html',
  '14-guide-lettrage-bd.html',
  '15-plan-voix-et-direction-acteurs.html',
  '17-da-plan-sonore.html',
  '18-dialogues-verrouilles-reference.html',
  'PRODUCTION_STATUS.json',
  'visual-reference-register.json',
  'character-source-map.json',
  'naming-locks.json',
  'visual-qa-final.json'
];
for(const file of editorial){
  const src=resolve(root,file);
  if(!existsSync(src))throw new Error(`Fichier de packaging manquant: ${file}`);
  cpSync(src,resolve(out,file));
}

function walk(dir){
  const files=[];
  for(const name of readdirSync(dir)){
    const p=resolve(dir,name);
    if(statSync(p).isDirectory())files.push(...walk(p)); else files.push(p);
  }
  return files;
}
function sha256(file){return createHash('sha256').update(readFileSync(file)).digest('hex');}

const files=walk(out).map(file=>({
  path:relative(out,file).replaceAll('\\','/'),
  bytes:statSync(file).size,
  sha256:sha256(file)
})).sort((a,b)=>a.path.localeCompare(b.path));

const manifest={
  project:'LE BOA TOTEM DE SOYA',
  packageStatus:'READY_FOR_HUMAN_RECIPE',
  generatedAt:new Date().toISOString(),
  sourceRevision:process.env.GITHUB_SHA||'',
  visualQaReviewedAt:qa.reviewedAt,
  fileCount:files.length,
  files
};
writeFileSync(resolve(out,'PACKAGE-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(`Package final préparé: ${out} (${files.length} fichiers avant manifeste)`);
