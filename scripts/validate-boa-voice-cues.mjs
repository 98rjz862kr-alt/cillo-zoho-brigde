import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve('drafts/boa-totem-soya');
const sheet=JSON.parse(readFileSync(resolve(root,'voice-cues-1045.json'),'utf8'));
const srt=readFileSync(resolve(root,'09-da-sous-titres-fr.srt'),'utf8').trim();
const errors=[];

const blocks=srt.split(/\n\s*\n/).map(block=>{
  const lines=block.split('\n');
  const [start,end]=lines[1].split(' --> ');
  return {cue:Number(lines[0]),start,end,text:lines.slice(2).join('\n')};
});

for(const block of blocks){
  const entries=sheet.cues.filter(x=>x.cue===block.cue);
  if(!entries.length){errors.push(`Cue ${block.cue}: absent de la feuille voix`);continue;}
  const start=entries[0].start;
  const end=entries[entries.length-1].end;
  const text=entries.map(x=>x.text).join('\n');
  if(start!==block.start)errors.push(`Cue ${block.cue}: début ${start} != SRT ${block.start}`);
  if(end!==block.end)errors.push(`Cue ${block.cue}: fin ${end} != SRT ${block.end}`);
  if(text!==block.text)errors.push(`Cue ${block.cue}: texte voix != SRT`);
}
if(blocks.length!==18)errors.push(`SRT: ${blocks.length}/18 blocs`);
const distinct=[...new Set(sheet.cues.map(x=>x.cue))];
if(distinct.length!==18)errors.push(`Feuille voix: ${distinct.length}/18 numéros de cue distincts`);
if(sheet.durationSeconds!==645)errors.push(`Durée feuille voix: ${sheet.durationSeconds}/645 s`);

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('BOA TOTEM — feuille de cues voix / SRT: PASS');
