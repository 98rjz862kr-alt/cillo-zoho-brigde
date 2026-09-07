import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('drafts/lmi-musee-complet');
const candidatePages = [
  "index.html",
  "pourquoi-un-musee-lmi-editions.html",
  "comprendre-le-monde-par-ses-peripheries.html",
  "archives-fonds-traces.html",
  "collections-editoriales.html",
  "collections-editoriales/atlas-des-humanites-disparues.html",
  "collections-editoriales/les-routes-invisibles.html",
  "collections-editoriales/archives-des-seuils.html",
  "principes-curatoriaux.html",
  "references-et-filiations.html",
  "journal-de-construction.html",
  "contact.html",
  "mentions-legales-confidentialite.html",
  "parcours/presse.html",
  "parcours/partenaires.html",
  "parcours/programmateurs.html",
  "parcours/prescripteurs.html"
];
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const assert = (ok,message) => { if (!ok) throw new Error(message); };
const walk = (dir,out=[]) => { for (const name of readdirSync(dir)) { const file=path.join(dir,name); statSync(file).isDirectory()?walk(file,out):out.push(file); } return out; };

assert(existsSync(root),'Museum root missing');
const allFiles=walk(root);
const pages=allFiles.filter(f=>f.toLowerCase().endsWith('.html')).sort();
for (const rel of candidatePages) assert(existsSync(path.join(root,rel)), `Missing candidate page ${rel}`);
for (const file of pages) {
  const rel=path.relative(root,file), html=readFileSync(file,'utf8'), lower=html.toLowerCase();
  assert(/<html[^>]*lang=["']fr["']/i.test(html), `lang=fr missing in ${rel}`);
  assert(/<meta[^>]+viewport/i.test(html), `viewport missing in ${rel}`);
  assert(/<title>[^<]+<\/title>/i.test(html), `title missing in ${rel}`);
  assert(/name=["']description["']/i.test(html), `description missing in ${rel}`);
  assert(/styles\.css/.test(html), `shared CSS missing in ${rel}`);
  assert(/assets\/lmi-logo-officiel\.svg/.test(html), `official logo missing in ${rel}`);
  assert(/noindex,nofollow,noarchive/i.test(html), `Private robots lock missing in ${rel}`);
  for (const term of ['lorem ipsum','placeholder','texte template','texte atelier','à compléter','a completer','todo:','fixme:','exemple fictif','donnée fictive','donnee fictive']) {
    assert(!lower.includes(term), `Forbidden unfinished marker '${term}' in ${rel}`);
  }
}
const manifest=JSON.parse(readFileSync(path.join(root,'source-manifest.json'),'utf8'));
assert(manifest.site==='musee.lesmotsimages.com','Wrong source manifest site');
assert(manifest.status==='CANDIDATE_PRIVATE','Manifest status must remain CANDIDATE_PRIVATE');
assert(manifest.publicationGate?.status==='LOCKED','Publication gate must remain LOCKED');
assert(Array.isArray(manifest.documents)&&manifest.documents.length>=8,'Insufficient canonical documents in manifest');
for(const doc of manifest.documents){assert(/^[a-f0-9]{64}$/.test(doc.sha256),`Invalid document SHA256 for ${doc.title}`);assert(doc.driveId,`Drive ID missing for ${doc.title}`);}
const hashes=Object.fromEntries(allFiles.sort().map(file=>[path.relative(root,file),sha256(file)]));
console.log(JSON.stringify({site:'musee.lesmotsimages.com',status:'CANDIDATE_PRIVATE_AUDITED',publication:'LOCKED',pages:pages.length,candidatePages:candidatePages.length,sourceDocuments:manifest.documents.length,files:hashes},null,2));
