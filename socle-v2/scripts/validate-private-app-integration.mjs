import { readFileSync } from 'node:fs';
const contract=JSON.parse(readFileSync(new URL('../contracts/private-app-integration.json',import.meta.url),'utf8'));
const fail=(m)=>{throw new Error(`PRIVATE_APP_INTEGRATION_INVALID: ${m}`)};
if(contract.brand!=='LES MOTS IMAGÉS')fail('canonical brand');
if(contract.principle!=='PRIVATE_APP_CONTROL_PLANE_PUBLIC_SITES_PRESENTATION_PLANE')fail('architecture principle');
const expected=['editions','maison','food','musee'];
for(const id of expected){
  if(!contract.privateApp.universes.includes(id))fail(`missing private-app universe ${id}`);
  if(contract.sites?.[id]?.appRoute!==`/${id}`)fail(`route ${id}`);
}
if(contract.privateApp.publicExposure!==false)fail('private app must remain private');
if(contract.security.sitesMayCallPrivateAppDirectlyFromBrowser!==false)fail('browser direct call forbidden');
if(contract.security.serverToServerAuthRequired!==true)fail('server-to-server auth required');
if(contract.exchange.failClosed!==true)fail('fail-closed required');
for(const field of ['lmiId','universe','version','status','updatedAt','provenance','sha256']){
  if(!contract.exchange.requiredFields.includes(field))fail(`missing field ${field}`);
}
console.log('PRIVATE_APP_INTEGRATION_CONTRACT_PASS 4');
