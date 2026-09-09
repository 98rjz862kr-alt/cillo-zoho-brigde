import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../public-entry.js',import.meta.url),'utf8');

const required=[
  "from './drafts.js'",
  'listDraftFiles',
  'readDraftHtml',
  'readDraftAsset',
  "import { isAuthorized } from './security.js'",
  'publicAtelier:false',
  "if(!isAuthorized({headers:req.headers,query}))",
  'readDraftHtml(relativePath)',
  'readDraftAsset(relativePath)',
  'boaRecipeReady',
  'boaAssetReady',
  'Bridge protected atelier running'
];
for(const token of required){if(!source.includes(token))throw new Error(`Protected Bridge entry token missing: ${token}`);}

const forbidden=[
  "readFileSync(absolutePath,'utf8')",
  'publicAtelier: true',
  'Atelier de brouillons en accès direct'
];
for(const token of forbidden){if(source.includes(token))throw new Error(`Public or raw Bridge behavior remains: ${token}`);}

console.log('Validated protected Bridge entry, decorated draft/asset rendering, Boa recipe health and private atelier status.');
