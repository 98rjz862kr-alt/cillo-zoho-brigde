import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../public-entry.js',import.meta.url),'utf8');

const required=[
  "from './drafts.js'",
  "from './hub-provenance.js'",
  'listDraftFiles',
  'readDraftHtml',
  'readDraftAsset',
  'listHubVisualProvenance',
  "import { isAuthorized } from './security.js'",
  'publicAtelier:false',
  "if(!isAuthorized({headers:req.headers,query}))",
  'readDraftHtml(relativePath)',
  'readDraftAsset(relativePath)',
  'boaRecipeReady',
  'boaAssetReady',
  'hubIntegrityStatus',
  "url.pathname==='/api/hub-integrity'",
  "'x-lmi-sha256':asset.sha256",
  "'etag':`\"sha256-${asset.sha256}\"`",
  "'content-length':asset.size",
  'hubIntegrityReady:hub.ready',
  'Bridge protected atelier running'
];
for(const token of required){if(!source.includes(token))throw new Error(`Protected Bridge entry token missing: ${token}`);}

const forbidden=[
  "readFileSync(absolutePath,'utf8')",
  'publicAtelier: true',
  'Atelier de brouillons en accès direct'
];
for(const token of forbidden){if(source.includes(token))throw new Error(`Public or raw Bridge behavior remains: ${token}`);}

console.log('Validated protected Bridge entry, authenticated Hub integrity manifest, SHA-256 asset headers and private atelier status.');
