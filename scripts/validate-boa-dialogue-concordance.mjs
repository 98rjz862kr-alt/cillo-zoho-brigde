import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve('drafts/boa-totem-soya');
const read=f=>readFileSync(resolve(root,f),'utf8');
const errors=[];
const must=(cond,msg)=>{if(!cond)errors.push(msg)};

const locks={
  cillo1:'Attends... ça recommence seulement quand tu avances.',
  sidaat1:'Soya, tes jambes ont peur ?',
  cillo2:'On doit demander qui les a faites.',
  sidaat2:'Le boa aussi a eu mal ?',
  soya:"C'est moi que le signe a arrêtée. Alors c'est moi qui dois commencer.",
  nene:'Certains animaux protègent une lignée.'
};

const bd=read('06-script-bd-dialogues.html');
const lettering=read('14-guide-lettrage-bd.html');
const srt=read('09-da-sous-titres-fr.srt');
const voice=read('15-plan-voix-et-direction-acteurs.html');
const overview=read('01-bd-18-planches.html');
const ref=read('18-dialogues-verrouilles-reference.html');

for(const [id,text] of Object.entries(locks)){
  const targets=id==='nene'?[bd,lettering,srt]:[bd,lettering,srt,ref];
  for(const [index,target] of targets.entries())must(target.includes(text),`${id}: formulation absente du support ${index+1}`);
}
must(voice.includes(locks.cillo1),'Plan voix: CILLO 1 divergent');
must(voice.includes(locks.cillo2),'Plan voix: CILLO 2 divergent');
must(voice.includes(locks.sidaat1),'Plan voix: SIDAAT 1 divergent');
must(voice.includes(locks.sidaat2),'Plan voix: SIDAAT 2 divergent');
must(voice.includes(locks.soya),'Plan voix: SOYA divergent');
must(!bd.includes('Certains animaux protègent une famille.'),'Script BD: ancienne variante « famille » encore présente');

const p16=(overview.split('Planche 16')[1]||'').split('Planche 17')[0]||'';
const p18=overview.split('Planche 18')[1]||'';
must(p16.includes(locks.soya),'Découpage: décision SOYA absente de P16');
must(!p18.includes(locks.soya),'Découpage: décision SOYA répétée en P18');

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('BOA TOTEM — concordance dialogues: PASS');
