import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { hashPackage } from './package-hash.mjs';

const repoRoot=process.cwd();
const socleRoot=path.join(repoRoot,'socle-v2');
const origins=JSON.parse(readFileSync(path.join(socleRoot,'site-origins.json'),'utf8'));
const integrationSha=process.env.RENDER_GIT_COMMIT||process.env.GIT_COMMIT||process.env.SOURCE_COMMIT||null;
const generatedAt=new Date().toISOString();

const sites={};
for(const [siteId,origin] of Object.entries(origins.sites)){
  const pkg=hashPackage(path.join(repoRoot,origin.root));
  const expected=origin.candidatePackageSha256||null;
  sites[siteId]={
    root:origin.root,
    candidateSourceSha:origin.candidateSourceSha||null,
    expectedPackageSha256:expected,
    runtimePackageSha256:pkg.sha256,
    exactCandidateContent:Boolean(expected&&pkg.sha256===expected),
    files:pkg.files.length,
    state:origin.state
  };
}

const manifest={
  schemaVersion:'2.0.0-alpha.1',
  brand:'LES MOTS IMAGÉS',
  bridgeRole:'private-prepublication-draft',
  generatedAt,
  integrationSha,
  releaseRule:'SOURCE_SHA -> BUILD -> RUNTIME_BRIDGE -> MEDIA_MANIFEST -> RECIPE_GATE',
  sites
};

const outDir=path.join(socleRoot,'generated');
mkdirSync(outDir,{recursive:true});
writeFileSync(path.join(outDir,'bridge-runtime-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(JSON.stringify(manifest,null,2));
