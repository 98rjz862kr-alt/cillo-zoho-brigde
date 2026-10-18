import { hashPackage } from './package-hash.mjs';
const result=hashPackage('drafts/hub-lmi-editions');
console.log(`EDITIONS_RUNTIME_PACKAGE ${result.sha256} ${result.files.length}`);
