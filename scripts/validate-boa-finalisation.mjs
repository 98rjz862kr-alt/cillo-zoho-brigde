import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve('drafts/boa-totem-soya');
const fail=[];
const must=(cond,msg)=>{if(!cond)fail.push(msg)};
const txt=p=>readFileSync(resolve(root,p),'utf8');

must(existsSync(root),'Dossier boa-totem-soya absent');
const roughDir=resolve(root,'assets/roughs');
const daDir=resolve(root,'assets/da');
const albumDir=resolve(root,'assets/album');
const modelDir=resolve(root,'assets/models');
const roughs=existsSync(roughDir)?readdirSync(roughDir).filter(x=>x.endsWith('.svg')):[];
const shots=existsSync(daDir)?readdirSync(daDir).filter(x=>x.endsWith('.svg')):[];
const spreads=existsSync(albumDir)?readdirSync(albumDir).filter(x=>x.endsWith('.svg')):[];
const models=existsSync(modelDir)?readdirSync(modelDir).filter(x=>x.endsWith('.svg')):[];
must(roughs.length===18,`Roughs BD: ${roughs.length}/18`);
must(shots.length===50,`Plans DA: ${shots.length}/50`);
must(spreads.length===12,`Doubles pages album: ${spreads.length}/12`);
must(models.length===3,`Model sheets: ${models.length}/3`);

const htmlFiles=['00-index-production.html','19-roughs-bd-01-18.html','20-model-sheets-line-art.html','21-album-maquette-finale-32p.html','22-da-asset-exposure-sheet.html','23-da-animatic-interne.html','24-qa-finale-transmedia.html','25-recette-humaine-finale.html'];
for(const f of htmlFiles){
 must(existsSync(resolve(root,f)),`${f}: absent`);
 if(existsSync(resolve(root,f))){const s=txt(f);must(s.startsWith('<!doctype html>'),`${f}: doctype absent`);must(s.includes('noindex,nofollow,noarchive'),`${f}: noindex absent`);}
}

const cillo='Attends... ça recommence seulement quand tu avances.';
const soya="C'est moi que le signe a arrêtée. Alors c'est moi qui dois commencer.";
const cilloFiles=['01-bd-18-planches.html','03-da-storyboard.html','06-script-bd-dialogues.html','07-album-graphique-texte-integral.html','08-da-script-technique.html','09-da-sous-titres-fr.srt','14-guide-lettrage-bd.html','16-album-maquette-pagination.html','18-dialogues-verrouilles-reference.html'];
for(const f of cilloFiles){if(existsSync(resolve(root,f)))must(txt(f).includes(cillo),`${f}: réplique CILLO non canonique`)}
const soyaFiles=['01-bd-18-planches.html','03-da-storyboard.html','06-script-bd-dialogues.html','07-album-graphique-texte-integral.html','08-da-script-technique.html','09-da-sous-titres-fr.srt','14-guide-lettrage-bd.html','16-album-maquette-pagination.html','18-dialogues-verrouilles-reference.html'];
for(const f of soyaFiles){if(existsSync(resolve(root,f)))must(txt(f).includes(soya),`${f}: réplique SOYA non canonique`)}

for(const f of readdirSync(root).filter(x=>/\.(html|srt|json)$/i.test(x))){
 const s=txt(f).toLowerCase();
 must(!s.includes('braconnage'),`${f}: axe braconnage interdit`);
 must(!s.includes('braconnier'),`${f}: terme braconnier interdit`);
 if(f.endsWith('.html')) must(!txt(f).includes('Attends… ça recommence seulement quand tu avances.'),`${f}: ellipse typographique interdite dans la réplique canonique`);
}

const index=txt('00-index-production.html');
for(const f of htmlFiles.slice(1))must(index.includes(f),`Portail: lien absent vers ${f}`);
const recipe=txt('25-recette-humaine-finale.html');
for(const f of ['19-roughs-bd-01-18.html','20-model-sheets-line-art.html','21-album-maquette-finale-32p.html','23-da-animatic-interne.html','24-qa-finale-transmedia.html'])must(recipe.includes(f),`Recette: lien absent vers ${f}`);
const anim=txt('23-da-animatic-interne.html');
must((anim.match(/shot-\d{3}\.svg/g)||[]).length===50,'Animatique: 50 sources de plans non trouvées');
must(anim.includes('speechSynthesis'),'Animatique: voix témoin navigateur absente');
const manifest=JSON.parse(txt('manifest-finalisation.json'));
must(manifest.counts?.bdRoughs===18,'Manifest: roughs != 18');
must(manifest.counts?.albumSpreads===12,'Manifest: spreads != 12');
must(manifest.counts?.daShots===50,'Manifest: plans != 50');

if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('BOA TOTEM DE SOYA — validation finale automatisée: CONFORME');
console.log('18 roughs BD · 12 doubles pages · 50 plans DA · 3 model sheets · recette finale raccordée');
