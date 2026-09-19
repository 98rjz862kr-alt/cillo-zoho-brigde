import { execFileSync } from 'node:child_process';
const sha='f8d046bdfea2c0854364579cca59cbd2fd85a8b9';
const object=sha+':drafts/lmi-musee-complet/source-manifest.json';
try { execFileSync('git',['cat-file','-e',object],{stdio:'ignore'}); }
catch { execFileSync('git',['fetch','--no-tags','origin',sha],{stdio:'inherit'}); }
execFileSync('git',['cat-file','-e',object],{stdio:'inherit'});
console.log('BUILD_HISTORY_READY '+sha);
