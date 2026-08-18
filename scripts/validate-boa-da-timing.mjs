import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve('drafts/boa-totem-soya');
const html=readFileSync(resolve(root,'08-da-script-technique.html'),'utf8');
const srt=readFileSync(resolve(root,'09-da-sous-titres-fr.srt'),'utf8').trim();
const errors=[];

const planRegex=/<div class="shot"><b>Plan (\d+)<\/b><span>(\d+) s<\/span>/g;
const plans=[];
let match;
while((match=planRegex.exec(html))){plans.push({number:Number(match[1]),duration:Number(match[2])});}
if(plans.length!==50)errors.push(`Plans DA: ${plans.length}/50`);
let cursor=0;
const windows=new Map();
for(const p of plans){windows.set(p.number,{start:cursor,end:cursor+p.duration});cursor+=p.duration;}
if(cursor!==645)errors.push(`Durée totale DA: ${cursor}s au lieu de 645s (10:45)`);
for(let i=1;i<=50;i++)if(!windows.has(i))errors.push(`Plan ${i} absent du timing`);

function timeToSeconds(value){
  const m=value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if(!m)return NaN;
  return Number(m[1])*3600+Number(m[2])*60+Number(m[3])+Number(m[4])/1000;
}

const cues=srt.split(/\n\s*\n/).map(block=>{
  const lines=block.split('\n');
  const n=Number(lines[0]);
  const [startRaw,endRaw]=lines[1].split(' --> ');
  return {n,start:timeToSeconds(startRaw),end:timeToSeconds(endRaw),text:lines.slice(2).join('\n')};
});
if(cues.length!==18)errors.push(`Sous-titres: ${cues.length}/18 cues`);

const cueToPlan=[2,7,8,12,15,17,18,21,23,26,27,31,34,35,36,37,38,41];
cues.forEach((cue,index)=>{
  const plan=cueToPlan[index];
  const w=windows.get(plan);
  if(!w)return;
  if(!(cue.start>=w.start&&cue.end<=w.end))errors.push(`Cue ${cue.n} hors plan ${plan}: ${cue.start}-${cue.end}s / fenêtre ${w.start}-${w.end}s`);
  if(index>0&&cue.start<cues[index-1].end)errors.push(`Cue ${cue.n} chevauche le cue précédent`);
});

const expected={
  5:'Attends... ça recommence seulement quand tu avances.',
  6:'Soya, tes jambes ont peur ?',
  8:'On doit demander qui les a faites.',
  16:'Le boa aussi a eu mal ?',
  18:"C'est moi que le signe a arrêtée. Alors c'est moi qui dois commencer."
};
for(const [n,text] of Object.entries(expected)){
  const cue=cues.find(x=>x.n===Number(n));
  if(!cue||cue.text!==text)errors.push(`Cue ${n}: divergence de dialogue verrouillé`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('BOA TOTEM DE SOYA — timing DA/SRT: CONFORME');
console.log('50 plans · 645 s · 18 cues contenus dans leurs plans · dialogues verrouillés concordants.');
