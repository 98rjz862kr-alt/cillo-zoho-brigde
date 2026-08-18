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

// Ces compteurs attestent uniquement la complétude de la PREPRODUCTION schématique.
must(roughs.length===18,`Roughs schématiques BD: ${roughs.length}/18`);
must(shots.length===50,`Layouts schématiques DA: ${shots.length}/50`);
must(spreads.length===12,`Maquettes schématiques album: ${spreads.length}/12`);
must(models.length===3,`Model sheets schématiques: ${models.length}/3`);

const htmlFiles=['00-index-production.html','19-roughs-bd-01-18.html','20-model-sheets-line-art.html','21-album-maquette-finale-32p.html','22-da-asset-exposure-sheet.html','23-da-animatic-interne.html','24-qa-finale-transmedia.html','25-recette-humaine-finale.html'];
for(const f of htmlFiles){
  must(existsSync(resolve(root,f)),`${f}: absent`);
  if(existsSync(resolve(root,f))){
    const s=txt(f);
    must(s.startsWith('<!doctype html>'),`${f}: doctype absent`);
    must(s.includes('noindex,nofollow,noarchive'),`${f}: noindex absent`);
  }
}

const cillo='Attends... ça recommence seulement quand tu avances.';
const soya="C'est moi que le signe a arrêtée. Alors c'est moi qui dois commencer.";
const canonFiles=['01-bd-18-planches.html','03-da-storyboard.html','06-script-bd-dialogues.html','07-album-graphique-texte-integral.html','08-da-script-technique.html','09-da-sous-titres-fr.srt','14-guide-lettrage-bd.html','16-album-maquette-pagination.html','18-dialogues-verrouilles-reference.html'];
for(const f of canonFiles){
  if(existsSync(resolve(root,f))){
    must(txt(f).includes(cillo),`${f}: réplique CILLO non canonique`);
    must(txt(f).includes(soya),`${f}: réplique SOYA non canonique`);
  }
}

const srt=txt('09-da-sous-titres-fr.srt');
const srtBlocks=srt.trim().split(/\n\s*\n/);
must(srtBlocks.length===18,`Sous-titres: ${srtBlocks.length}/18 cues`);

for(const f of readdirSync(root).filter(x=>/\.(html|srt|json)$/i.test(x))){
  const s=txt(f).toLowerCase();
  must(!s.includes('braconnage'),`${f}: axe braconnage interdit`);
  must(!s.includes('braconnier'),`${f}: terme braconnier interdit`);
}

const manifest=JSON.parse(txt('manifest-finalisation.json'));
must(manifest.status==='PREPRODUCTION_GRAPHIC_REVIEW_REQUIRED','Manifest: statut de préproduction graphique obligatoire');
must(manifest.humanRecipe==='SUSPENDED','Manifest: recette humaine doit rester suspendue');
must(manifest.schematicAssets?.finalArtwork===false,'Manifest: les SVG schématiques ne doivent jamais être déclarés artworks finaux');
must(manifest.authoritativeVisualReference?.driveDocumentId==='1-Sds8HUOvPxHnivPTsarik_xxBXhXd9Kwpv0E9UY-xQ','Manifest: source visuelle prioritaire manquante');

const recipe=txt('25-recette-humaine-finale.html').toLowerCase();
must(recipe.includes('recette humaine suspendue'),'Recette: suspension explicite absente');
must(recipe.includes('ne pas valider ce lot'),'Recette: interdiction de validation absente');
must(!recipe.includes('lot prêt pour recette humaine'),'Recette: ancien faux statut final encore présent');

const qa=txt('24-qa-finale-transmedia.html').toLowerCase();
must(qa.includes('qa corrective'),'QA: statut correctif absent');
must(qa.includes('non conforme'),'QA: non-conformité graphique absente');

const index=txt('00-index-production.html').toLowerCase();
must(index.includes('préproduction'),'Index: requalification préproduction absente');
must(index.includes('recette suspendue'),'Index: suspension de recette absente');

const anim=txt('23-da-animatic-interne.html');
must((anim.match(/shot-\d{3}\.svg/g)||[]).length===50,'Animatique: 50 sources de plans schématiques non trouvées');

if(fail.length){
  console.error(fail.join('\n'));
  process.exit(1);
}

console.log('BOA TOTEM DE SOYA — contrôle structurel de PREPRODUCTION: CONFORME');
console.log('Statut graphique: NON FINAL · recette humaine: SUSPENDUE');
console.log('18 roughs schématiques · 12 maquettes album · 50 layouts DA · 3 sheets schématiques · dialogues structurés');
