import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { buildRuntimeRegistry } from '../runtime-registry.mjs';

const integrationSha=process.env.RENDER_GIT_COMMIT||process.env.GIT_COMMIT||process.env.SOURCE_COMMIT||null;
const manifest=buildRuntimeRegistry({integrationSha});
const outDir=path.resolve(process.cwd(),'socle-v2/generated');
mkdirSync(outDir,{recursive:true});
writeFileSync(path.join(outDir,'bridge-runtime-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(JSON.stringify(manifest,null,2));
