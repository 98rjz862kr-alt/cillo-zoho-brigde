import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-musee-complet');
const requiredCanonical = [
  'index.html','pourquoi-un-musee-lmi-editions.html','comprendre-le-monde-par-ses-peripheries.html',
  'archives-fonds-traces.html','collections-editoriales.html',
  'collections-editoriales/atlas-des-humanites-disparues.html',
  'collections-editoriales/les-routes-invisibles.html',
  'collections-editoriales/archives-des-seuils.html',
  'principes-curatoriaux.html','references-et-filiations.html','journal-de-construction.html','contact.html'
];
const forbiddenVisible = ['lorem ipsum','placeholder','texte template','texte atelier','à compléter','a completer','todo:','fixme:','exemple fictif','donnée fictive','donnee fictive'];
function sha256(file){return createHash('sha256').update(readFileSync(file)).digest('hex');}
function assert(ok,message){if(!ok)throw new Error(message);}
function walk(dir,out=[]){for(const name of readdirSync(dir)){const file=path.join(dir,name);if(statSync(file).isDirectory())walk(file,out);else out.push(file);}return out;}
function resolveLink(pageFile,href){return path.resolve(path.dirname(pageFile),href);}

assert(existsSync(root),'Museum root missing');
const allFiles=walk(root);
const pages=allFiles.filter(f=>f.toLowerCase().endsWith('.html')).sort();
for(const rel of requiredCanonical)assert(existsSync(path.join(root,rel)),`Missing canonical page ${rel}`);
for(const file of pages){
  const rel=path.relative(root,file); const html=readFileSync(file,'utf8'); const lower=html.toLowerCase();
  assert(/noindex,nofollow,noarchive/i.test(html),`Robots lock missing in ${rel}`);
  assert(/<html[^>]*lang=["']fr["']/i.test(html),`lang=fr missing in ${rel}`);
  assert(/<meta[^>]+viewport/i.test(html),`viewport missing in ${rel}`);
  assert(/<title>[^<]+<\/title>/i.test(html),`title missing in ${rel}`);
  assert(/name=["']description["']/i.test(html),`description missing in ${rel}`);
  assert(/styles\.css/.test(html),`shared CSS missing in ${rel}`);
  assert(/assets\/lmi-logo-officiel\.svg/.test(html),`official logo wrapper missing in ${rel}`);
  for(const term of forbiddenVisible)assert(!lower.includes(term),`Forbidden unfinished marker '${term}' in ${rel}`);
  for(const href of [...html.matchAll(/href=["']([^"'#?]+\.html)(?:#[^"']*)?["']/g)].map(m=>m[1]))assert(existsSync(resolveLink(file,href)),`Broken local link ${href} from ${rel}`);
}
const css=readFileSync(path.join(root,'styles.css'),'utf8');
for(const color of ['#143B7D','#CC7722','#75553F','#D4AF37','#0F2747','#F6F1E8','#C8A96B','#C9C3BA'])assert(css.includes(color),`Missing LMI palette color ${color}`);
assert(css.includes(':focus-visible'),'Keyboard focus style missing'); assert(/@media\(max-width:900px\)/.test(css),'Responsive breakpoint missing');
const sourceManifest=JSON.parse(readFileSync(path.join(root,'source-manifest.json'),'utf8'));
assert(sourceManifest.site==='musee.lesmotsimages.com','Wrong source manifest site');
assert(Array.isArray(sourceManifest.documents)&&sourceManifest.documents.length>=8,'Insufficient canonical documents in manifest');
for(const doc of sourceManifest.documents){assert(/^[a-f0-9]{64}$/.test(doc.sha256),`Invalid document SHA256 for ${doc.title}`);assert(doc.driveId,`Drive ID missing for ${doc.title}`);}
const hashes=Object.fromEntries(allFiles.sort().map(file=>[path.relative(root,file),sha256(file)]));
for(const [name,hash] of Object.entries(hashes))assert(/^[a-f0-9]{64}$/.test(hash),`Invalid generated hash ${name}`);
console.log(JSON.stringify({site:'musee.lesmotsimages.com',status:'CANDIDATE_AUDITED_PRIVATE',pages:pages.length,canonicalPages:requiredCanonical.length,sourceDocuments:sourceManifest.documents.length,files:hashes},null,2));
