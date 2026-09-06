import { readDraftAsset, readDraftHtml } from '../drafts.js';

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

console.log('Validated Hub visual integrity: approved local assets are SHA-256-bound and untraced external media is excluded.');
