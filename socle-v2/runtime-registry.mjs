import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPackage } from './scripts/package-hash.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'..');
const origins=JSON.parse(readFileSync(path.join(here,'site-origins.json'),'utf8'));

export function buildRuntimeRegistry({integrationSha=null, generatedAt=new Date().toISOString()}={}){
  const sites={};
  for(const [siteId,origin] of Object.entries(origins.sites)){
    const pkg=hashPackage(path.join(repoRoot,origin.root));
    const expected=origin.candidatePackageSha256||null;
    sites[siteId]={
      root:origin.root,
      candidateSourceSha:origin.candidateSourceSha||null,
      candidatePackageSha256:expected,
      runtimePackageSha256:pkg.sha256,
      exactCandidateContent:Boolean(expected&&pkg.sha256===expected),
      files:pkg.files.length,
      state:origin.state
    };
  }
  return {
    schemaVersion:'2.0.0-alpha.2',
    brand:'LES MOTS IMAGÉS',
    bridgeRole:'private-prepublication-draft',
    generatedAt,
    integrationSha,
    releaseRule:'CANDIDATE_SOURCE -> CANDIDATE_PACKAGE_SHA256 -> INTEGRATION_SHA -> RUNTIME_PACKAGE_SHA256 -> MEDIA_MANIFEST -> RECIPE_GATE',
    sites
  };
}
