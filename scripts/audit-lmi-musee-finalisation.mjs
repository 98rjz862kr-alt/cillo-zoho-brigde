import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root=path.resolve('drafts/lmi-musee-complet');
const publicPages=[
 'index.html','pourquoi-un-musee-lmi-editions.html','comprendre-le-monde-par-ses-peripheries.html','archives-fonds-traces.html','collections-editoriales.html',
 'collections-editoriales/atlas-des-humanites-disparues.html','collections-editoriales/les-routes-invisibles.html','collections-editoriales/archives-des-seuils.html',
 'principes-curatoriaux.html','references-et-filiations.html','journal-de-construction.html','contact.html','mentions-legales-confidentialite.html',
 'parcours/presse.html','parcours/partenaires.html','parcours/programmateurs.html','parcours/prescripteurs.html'
];
const forbiddenVisible=['lorem ipsum','placeholder','texte template','texte atelier','à compléter','a completer','todo:','fixme:','exemple fictif','donnée fictive','donnee fictive'];
const forbiddenPublic=['candidat privé','brouillon privé','accès privé','recette humaine','non publié','a_requalifier'];
const sha256=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const walk=(dir,out=[])=>{for(const name of readdirSync(dir)){const file=path.join(dir,name);if(statSync(file).isDirectory())walk(file,out);else out.push(file);}return out;};
const resolveLink=(pageFile,href)=>path.resolve(path.dirname(pageFile),href);

assert(existsSync(root),'Museum root missing');
const allFiles=walk(root); const pages=allFiles.filter(f=>f.toLowerCase().endsWith('.html')).sort();
for(const rel of publicPages) assert(existsSync(path.join(root,rel)),`Missing public page ${rel}`);
for(const file of pages){
 const rel=path.relative(root,file),html=readFileSync(file,'utf8'),lower=html.toLowerCase();
 assert(/<html[^>]*lang=["']fr["']/i.test(html),`lang=fr missing in ${rel}`);
 assert(/<meta[^>]+viewport/i.test(html),`viewport missing in ${rel}`);
 assert(/<title>[^<]+<\/title>/i.test(html),`title missing in ${rel}`);
 assert(/name=["']description["']/i.test(html),`description missing in ${rel}`);
 assert(/styles\.css/.test(html),`shared CSS missing in ${rel}`);
 assert(/assets\/lmi-logo-officiel\.svg/.test(html),`official logo wrapper missing in ${rel}`);
 for(const term of forbiddenVisible) assert(!lower.includes(term),`Forbidden unfinished marker '${term}' in ${rel}`);
 for(const href of [...html.matchAll(/href=["']([^"'#?]+\.html)(?:#[^"']*)?["']/g)].map(m=>m[1])) assert(existsSync(resolveLink(file,href)),`Broken local link ${href} from ${rel}`);
}
for(const rel of publicPages){
 const html=readFileSync(path.join(root,rel),'utf8'),lower=html.toLowerCase();
 assert(/content=["']index,follow["']/i.test(html),`Public robots missing in ${rel}`);
 assert(/https:\/\/musee\.lesmotsimages\.com/i.test(html),`Canonical public URL missing in ${rel}`);
 for(const term of forbiddenPublic) assert(!lower.includes(term),`Private marker '${term}' in public ${rel}`);
}
for(const file of pages.filter(f=>!publicPages.includes(path.relative(root,f)))){
 const rel=path.relative(root,file),html=readFileSync(file,'utf8');
 assert(/noindex,nofollow,noarchive/i.test(html),`Non-public route not locked: ${rel}`);
}
const css=readFileSync(path.join(root,'styles.css'),'utf8');
for(const color of ['#143B7D','#CC7722','#75553F','#D4AF37','#0F2747','#F6F1E8','#C8A96B','#C9C3BA']) assert(css.includes(color),`Missing LMI palette color ${color}`);
assert(css.includes(':focus-visible'),'Keyboard focus style missing'); assert(/@media\(max-width:900px\)/.test(css),'Responsive breakpoint missing');
const manifest=JSON.parse(readFileSync(path.join(root,'source-manifest.json'),'utf8'));
assert(manifest.site==='musee.lesmotsimages.com','Wrong source manifest site');
assert(manifest.status==='CANDIDATE_PRIVATE','Manifest must remain CANDIDATE_PRIVATE before transverse validation');
assert(Array.isArray(manifest.documents)&&manifest.documents.length>=8,'Insufficient canonical documents in manifest');
for(const doc of manifest.documents){assert(/^[a-f0-9]{64}$/.test(doc.sha256),`Invalid document SHA256 for ${doc.title}`);assert(doc.driveId,`Drive ID missing for ${doc.title}`);}
const blockedSources=manifest.documents.filter(d=>d.status==='A_REQUALIFIER');
assert(blockedSources.some(d=>d.driveId==='1lScGWVLo8cD-Yr_Nnj0lBrWAhkhif5j7_0LfcPjhj1k'),'Atlas A_REQUALIFIER lock missing');
const atlasArchived=readFileSync(path.join(root,'atlas-humanites.html'),'utf8');
assert(/noindex,nofollow,noarchive/i.test(atlasArchived),'Atlas route is not locked while source remains A_REQUALIFIER');
const hashes=Object.fromEntries(allFiles.sort().map(file=>[path.relative(root,file),sha256(file)]));
console.log(JSON.stringify({site:'musee.lesmotsimages.com',status:'CANDIDATE_AUDITED_PRIVATE_ATLAS_LOCKED',pages:pages.length,publicPages:publicPages.length,sourceDocuments:manifest.documents.length,files:hashes},null,2));
