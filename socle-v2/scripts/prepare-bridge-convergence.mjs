import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { buildRuntimeRegistry } from '../runtime-registry.mjs';

const integrationSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const status=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
if(status)throw new Error('Bridge convergence proof requires a clean worktree');
const manifest=buildRuntimeRegistry({integrationSha});
const siteIds=['editions','food','maison','musee'];
for(const site of siteIds){
  const item=manifest.sites?.[site];
  if(!item)throw new Error(`${site}: missing from runtime registry`);
  if(item.exactCandidateContent!==true)throw new Error(`${site}: integration content differs from candidate package`);
}
const textExt=new Set(['.html','.svg','.json','.md','.txt','.xml','.js','.mjs','.css']);
const badBrand=/LES MOTS IMAGES|Les Mots Images/;
function scan(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){scan(full);continue;}
    if(!entry.isFile()||!textExt.has(path.extname(entry.name).toLowerCase()))continue;
    let text='';
    try{text=readFileSync(full,'utf8');}catch{continue;}
    if(badBrand.test(text))throw new Error(`Non-canonical brand remains in ${path.relative(process.cwd(),full)}`);
  }
}
for(const site of siteIds)scan(path.resolve(manifest.sites[site].root));
const proof={
  type:'LMI_BRIDGE_CONVERGENCE_CANDIDATE',
  brand:'LES MOTS IMAGÉS',
  integrationSha,
  releaseRule:manifest.releaseRule,
  sites:manifest.sites,
  staticBrandScan:'PASS',
  runtimeSmokeGate:'npm run test:integration',
  deployPolicy:'PRIVATE_BRIDGE_ONLY_NO_PUBLICATION_NO_DNS_CHANGE'
};
const body=JSON.stringify(proof,null,2)+'\n';
const sha256=createHash('sha256').update(body).digest('hex');
process.stdout.write(body);
process.stderr.write(`BRIDGE_CONVERGENCE_PROOF_SHA256 ${sha256}\n`);
