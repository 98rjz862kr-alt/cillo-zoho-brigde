import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const roots = [
  'drafts/hub-lmi-editions',
  'drafts/lmi-food-site',
  'drafts/lmi-maison-site',
  'drafts/lmi-musee-complet'
];
// Canonical brand copy is validated on textual/site surfaces. Exact Drive-backed
// SVG wrappers are integrity-checked separately by the visitor asset SHA gate and
// must not be rewritten merely to normalize non-rendered metadata.
const textExt = new Set(['.html','.css','.js','.mjs','.json','.xml','.md','.txt']);
const forbidden = /LES MOTS IMAGES|Les Mots Images/g;
const findings = [];

function walk(current) {
  for (const entry of readdirSync(current,{withFileTypes:true})) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && textExt.has(path.extname(entry.name))) {
      const text = readFileSync(full,'utf8');
      const matches = [...text.matchAll(forbidden)];
      if (matches.length) findings.push({file:path.relative(process.cwd(),full),count:matches.length});
    }
  }
}for (const root of roots) walk(root);

if (findings.length) {
  console.error(JSON.stringify({status:'FAIL', findings}, null, 2));
  process.exit(1);
}

console.log(`CANONICAL_BRAND_ALL_SITES_PASS ${roots.length}`);
