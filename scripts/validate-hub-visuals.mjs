import { readDraftAsset, readDraftHtml } from '../drafts.js';
import { getHubVisualProvenance, listHubVisualProvenance } from '../hub-provenance.js';

const logo=readDraftAsset('hub-lmi-editions/assets/logo-lmi-hub.webp');
const boa=readDraftAsset('hub-lmi-editions/assets/boa-totem-soya.webp');
const fleuve=readDraftAsset('hub-lmi-editions/assets/le-fleuve-sans-nom.webp');
if(!logo?.content || logo.content.length<8000)throw new Error('Official LMI logo asset is missing or too small');
if(!boa?.content || boa.content.length<3000)throw new Error('Boa Totem approved visual is missing or empty');
if(!fleuve?.content || fleuve.content.length<2000)throw new Error('Fleuve sans nom approved visual is missing or empty');
if(logo.contentType!=='image/webp' || boa.contentType!=='image/webp' || fleuve.contentType!=='image/webp')throw new Error('Hub local visual assets must be served as WebP');
for(const [name,asset] of [['logo',logo],['boa',boa],['fleuve',fleuve]]){
  if(!/^[a-f0-9]{64}$/.test(asset.sha256||''))throw new Error(`${name} asset has no computed SHA-256`);
}

const expectedProvenance={
  'logo-lmi-hub.webp':{driveId:'1tRvVtzTrDsaYg59cxmtdu5ITLv02Vrgy',sourceSha256:'f20a38b1106c04f1265831474b60d7f607776fda3e98ad0e2db00c02622566b3'},
  'boa-totem-soya.webp':{driveId:'1qKmgxf40Dl4rS16ZA1PRodF29NmUowDA',sourceSha256:'13ac00be26e61f6537cbeb1fb32977689a558437e94ceb0aed86c8d7495f6f5e'},
  'le-fleuve-sans-nom.webp':{driveId:'105ruK0gmwVqt9tcNL6vSf5w8P1BMgYij',sourceSha256:'3803846c2c5651c5d7f6c1fd775806d0ac3eac57367ab0f58911c381dc4e88aa'}
};
for(const [assetName,expected] of Object.entries(expectedProvenance)){
  const p=getHubVisualProvenance(assetName);
  if(p.sourceDriveId!==expected.driveId)throw new Error(`${assetName} Drive provenance mismatch`);
  if(p.sourceSha256!==expected.sourceSha256)throw new Error(`${assetName} source SHA-256 mismatch`);
  if(!/^[a-f0-9]{64}$/.test(p.sourceSha256))throw new Error(`${assetName} source SHA-256 is malformed`);
}
if(listHubVisualProvenance().length!==3)throw new Error('Unexpected Hub visual provenance inventory size');

const home=readDraftHtml('hub-lmi-editions/01-accueil.html');
if(!home?.includes('id="lmi-hub-visual-style"'))throw new Error('Hub visual stylesheet missing on home');
if(!home.includes('id="lmi-hub-visual-script"'))throw new Error('Hub visual loader missing on home');
if(!home.includes('data-lmi-asset="logo-lmi-hub.webp"'))throw new Error('Official LMI logo is not wired through protected asset loading');
if(!home.includes('data-lmi-approved="official-logo-2026-08-20"'))throw new Error('Official LMI identity marker is missing');
if(!home.includes(`data-lmi-sha256="${logo.sha256}"`))throw new Error('Official LMI logo SHA-256 marker is missing or divergent');
if(!home.includes('data-lmi-asset="boa-totem-soya.webp"'))throw new Error('Boa cover missing from Hub home');
if(!home.includes(`data-lmi-sha256="${boa.sha256}"`))throw new Error('Boa cover SHA-256 marker is missing or divergent');
if(!home.includes('data-lmi-asset="le-fleuve-sans-nom.webp"'))throw new Error('Fleuve cover missing from Hub home');
if(!home.includes(`data-lmi-sha256="${fleuve.sha256}"`))throw new Error('Fleuve cover SHA-256 marker is missing or divergent');
if(!home.includes('lmi-work-image'))throw new Error('Editorial work thumbnails missing from Hub home');

for(const assetName of Object.keys(expectedProvenance)){
  const p=getHubVisualProvenance(assetName);
  if(!home.includes(`data-lmi-drive-id="${p.sourceDriveId}"`))throw new Error(`${assetName} Drive ID marker missing from rendered Hub home`);
  if(!home.includes(`data-lmi-source-sha256="${p.sourceSha256}"`))throw new Error(`${assetName} canonical source SHA-256 marker missing from rendered Hub home`);
}

const boaPage=readDraftHtml('hub-lmi-editions/31-le-boa-totem-de-soya.html');
const fleuvePage=readDraftHtml('hub-lmi-editions/32-le-fleuve-sans-nom.html');
const catalogue=readDraftHtml('hub-lmi-editions/11-catalogue-editorial.html');
const food=readDraftHtml('hub-lmi-editions/07-lmi-food.html');
if(!boaPage?.includes(`data-lmi-sha256="${boa.sha256}"`))throw new Error('Boa editorial page has no SHA-256-bound approved cover');
if(!fleuvePage?.includes(`data-lmi-sha256="${fleuve.sha256}"`))throw new Error('Fleuve editorial page has no SHA-256-bound approved cover');
if(!catalogue?.includes('lmi-visual-band'))throw new Error('Editorial catalogue has no visual selection');
if(/res\.cloudinary\.com|IMG_9559/i.test(food||''))throw new Error('Untraced external LMI Food image leaked into Hub candidate');

for(const [name,html] of [['home',home],['boa',boaPage],['fleuve',fleuvePage],['catalogue',catalogue],['food',food]]){
  if(/EXPLORATION-REJETEE|NON-APPROUVE|placeholder/i.test(html))throw new Error(`Rejected or placeholder visual leaked into ${name}`);
}

console.log('Validated Hub visual integrity: local assets are SHA-256-bound, canonical Drive provenance is embedded, and untraced external media is excluded.');
