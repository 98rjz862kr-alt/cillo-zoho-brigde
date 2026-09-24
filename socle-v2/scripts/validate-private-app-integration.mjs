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
if(contract.brandContract?.privateAppSourceSha!=='374497fe6f8db7878d30c75ae03a0dbe010c33a5')fail('private app source sha');
if(contract.privateApp?.sourceSha!==contract.brandContract?.privateAppSourceSha)fail('private app source alignment');
if(contract.privateApp?.sourceRegistryPath!=='integration/sites-source-registry.v1.json')fail('private app source registry path');
if(contract.privateApp?.crossRepositoryReferencePolicy!=='NO_MUTUAL_LATEST_SHA_CYCLE')fail('cross-repository reference policy');
if(contract.privateApp?.sitePackageAuthority!=='PRIVATE_APP_SOURCE_REGISTRY_REGISTERED_SHA256')fail('site package authority');
if(contract.privateApp?.sourceRegistryBlobSha!=='4f943cd6a7b106dd21b0e3e0c3faba0146fa99b9')fail('source registry blob sha');
if(contract.privateApp?.sourceRegistryBridgeSnapshotSha!=='91c0688f6f64275828a6ff0cb645eaadd9aef965')fail('source registry bridge snapshot sha');
const registered={editions:'67ee1f124902612476b46b66532849f14c996fff22e54c619dd9665216fcf950',food:'c7b75fb1620af0ab2e458fe2a2645f1457d9fb7f828c7ded2bd73f3c977aeb22',maison:'695fdbc0bc935d4dc31238ee375f35c86755a16080cc75ca15f539d39eb57926',musee:'a3f2848ffbc12957a77ac897206522c3ca13eafffcc2ca711491a7f352c6dbf1'};
for(const [site,sha] of Object.entries(registered))if(contract.privateApp?.registeredSitePackageSha256?.[site]!==sha)fail(`registered site package ${site}`);
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
