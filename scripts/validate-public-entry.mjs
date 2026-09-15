import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../public-entry.js',import.meta.url),'utf8');
const core=readFileSync(new URL('../server.js',import.meta.url),'utf8');

const required=[
  "from './drafts.js'",
  'listDraftFiles',
  'readDraftHtml',
  'readDraftAsset',
  "import { isAuthorized } from './security.js'",
  'publicAtelier:false',
  "form method=\"post\" action=\"/atelier\"",
  "HttpOnly; SameSite=Strict",
  "hasSession(req)||isAuthorized({headers:req.headers})",
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
  'Atelier de brouillons en accès direct',
  '?password=',
  'query.password',
  'form method=\"get\" action=\"/atelier\"'
];
for(const token of forbidden){if(source.includes(token))throw new Error(`Public or raw Bridge behavior remains: ${token}`);}


const requiredCore=[
  "publicAtelier: false",
  "if (!isAuthorized({ headers: req.headers })) return sendHtml(res, adminLoginPage('Accès privé requis.'), 401);",
  "if (!isAuthorized({ headers: req.headers })) return sendJson(res, { error: 'Unauthorized' }, 401);",
  "process.env.INTERNAL_CORE === '1' ? '127.0.0.1' : '0.0.0.0'"
];
for(const token of requiredCore){if(!core.includes(token))throw new Error(`Protected Bridge core token missing: ${token}`);}
const forbiddenCore=[
  'publicAtelier: true',
  "if (req.method === 'GET' && url.pathname === '/atelier') return sendHtml(res, atelierPage(listDraftFiles()));",
  'query.password',
  '?password='
];
for(const token of forbiddenCore){if(core.includes(token))throw new Error(`Public Bridge core behavior remains: ${token}`);}

console.log('Validated protected Bridge entry, decorated draft/asset rendering, Boa recipe health and private atelier status.');
