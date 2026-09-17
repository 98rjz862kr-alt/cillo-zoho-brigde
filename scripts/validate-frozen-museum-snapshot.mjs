import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { hashPackage } from '../socle-v2/scripts/package-hash.mjs';

const sha='f8d046bdfea2c0854364579cca59cbd2fd85a8b9';
const root='drafts/lmi-musee-complet';
const expectedPackage='ec2a52a24e6de4d88f67422484a977c176d34be32359d32aec0a0067fb1fd4cd';
const frozenObject=`${sha}:${root}/source-manifest.json`;
try { execFileSync('git',['cat-file','-e',frozenObject],{stdio:'ignore'}); }
catch { execFileSync('git',['fetch','--no-tags','origin',sha],{stdio:'inherit'}); }
execFileSync('git',['cat-file','-e',frozenObject],{stdio:'ignore'});
const manifest=JSON.parse(execFileSync('git',['show',frozenObject],{encoding:'utf8'}));
if(manifest.status!=='READY_TO_PUBLISH')throw new Error(`Frozen Museum manifest expected READY_TO_PUBLISH, got ${manifest.status}`);
if(manifest.documents?.some((d)=>d.status==='A_REQUALIFIER'))throw new Error('Frozen Museum snapshot contains blocking A_REQUALIFIER source');
const temp=mkdtempSync(path.join(tmpdir(),'lmi-musee-frozen-'));
try{
  const archive=execFileSync('git',['archive','--format=tar',sha,root],{maxBuffer:64*1024*1024});
  const tarPath=path.join(temp,'snapshot.tar');
  writeFileSync(tarPath,archive);
  execFileSync('tar',['-xf',tarPath,'-C',temp]);
  const packageResult=hashPackage(path.join(temp,root));
  if(packageResult.sha256!==expectedPackage)throw new Error(`Frozen Museum package SHA mismatch: ${packageResult.sha256}`);
  console.log(`FROZEN_MUSEUM_PASS ${sha} ${packageResult.sha256} ${packageResult.files.length} files`);
} finally {
  rmSync(temp,{recursive:true,force:true});
}
