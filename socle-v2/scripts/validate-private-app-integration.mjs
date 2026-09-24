import { readFileSync } from 'node:fs';
const contract=JSON.parse(readFileSync(new URL('../contracts/private-app-integration.json',import.meta.url),'utf8'));
const fail=(m)=>{throw new Error(`PRIVATE_APP_INTEGRATION_INVALID: ${m}`)};
if(contract.brand!=='LES MOTS IMAGÉS')fail('canonical brand');
if(contract.protocolId!=='lmi-sites-publication-protocol@1.2.0')fail('protocol id');
if(contract.principle!=='PRIVATE_APP_CONTROL_PLANE_PUBLIC_SITES_PRESENTATION_PLANE')fail('architecture principle');
const expected=['editions','maison','food','musee'];
for(const id of expected){
  if(!contract.privateApp.universes.includes(id))fail(`missing private-app universe ${id}`);
  if(contract.sites?.[id]?.appRoute!==`/${id}`)fail(`route ${id}`);
}
if(contract.privateApp.publicExposure!==false)fail('private app must remain private');
if(contract.security.sitesMayCallPrivateAppDirectlyFromBrowser!==false)fail('browser direct call forbidden');
if(contract.security.serverToServerAuthRequired!==true)fail('server-to-server auth required');
if(contract.brandContract?.id!=='lmi-brand-roles@2.0.0')fail('brand contract id');
if(contract.brandContract?.authorityPath!=='assets/brand/lmi-brand-authority.json')fail('brand authority path');
if(contract.brandContract?.authoritySchema!=='lmi.brand.authority/1')fail('brand authority schema');
if(contract.brandContract?.privateAppSourceSha!=='9b9dd5cbe1dd9a1b9d213905cdfb581b36fab69d')fail('private app source sha');
if(contract.privateApp?.sourceSha!==contract.brandContract?.privateAppSourceSha)fail('private app source alignment');
if(contract.privateApp?.sourceRegistryPath!=='integration/sites-source-registry.v1.json')fail('private app source registry path');
const canonical=['#143B7D','#CC7722','#75553F','#D4AF37','#0F2747','#F6F1E8','#C8A96B','#C9C3BA'];
if(JSON.stringify(contract.brandContract?.canonicalPalette)!==JSON.stringify(canonical))fail('canonical palette');
if(contract.brandContract?.canonicalPalette?.includes('#C9A13B'))fail('obsolete non-canonical gold');
if(contract.management?.authority!=='private-app')fail('management authority');
if(contract.management?.uiEndpoint!=='/applications/sites-operations.html')fail('management ui');
if(contract.management?.serviceRecipeMayStartWithoutCommercialEvidence!==true)fail('service recipe separation');
if(contract.management?.publicPublication!==false||contract.management?.publicOrdering!==false)fail('publication/order lock');
if(contract.exchange.failClosed!==true)fail('fail-closed required');
for(const field of ['lmiId','universe','version','status','updatedAt','provenance','sha256']){
  if(!contract.exchange.requiredFields.includes(field))fail(`missing field ${field}`);
}
console.log('PRIVATE_APP_INTEGRATION_CONTRACT_PASS 4 PROTOCOL_1_2');
