import { readDraftAsset, readDraftHtml } from '../drafts.js';

const logo=readDraftAsset('hub-lmi-editions/assets/logo-lmi-hub.webp');
const boa=readDraftAsset('hub-lmi-editions/assets/boa-totem-soya.webp');
const fleuve=readDraftAsset('hub-lmi-editions/assets/le-fleuve-sans-nom.webp');
if(!logo?.content || logo.content.length<8000)throw new Error('Official LMI logo asset is missing or too small');
if(!boa?.content || boa.content.length<3000)throw new Error('Boa Totem approved visual is missing or empty');
if(!fleuve?.content || fleuve.content.length<2000)throw new Error('Fleuve sans nom approved visual is missing or empty');
if(logo.contentType!=='image/webp' || boa.contentType!=='image/webp' || fleuve.contentType!=='image/webp')throw new Error('Hub local visual assets must be served as WebP');

const home=readDraftHtml('hub-lmi-editions/01-accueil.html');
if(!home?.includes('id="lmi-hub-visual-style"'))throw new Error('Hub visual stylesheet missing on home');
if(!home.includes('id="lmi-hub-visual-script"'))throw new Error('Hub visual loader missing on home');
if(!home.includes('data-lmi-asset="logo-lmi-hub.webp"'))throw new Error('Official LMI logo is not wired through protected asset loading');
if(!home.includes('data-lmi-approved="official-logo-2026-08-20"'))throw new Error('Official LMI identity marker is missing');
if(!home.includes('data-lmi-asset="boa-totem-soya.webp"'))throw new Error('Boa cover missing from Hub home');
if(!home.includes('data-lmi-asset="le-fleuve-sans-nom.webp"'))throw new Error('Fleuve cover missing from Hub home');
if(!home.includes('lmi-work-image'))throw new Error('Editorial work thumbnails missing from Hub home');

const boaPage=readDraftHtml('hub-lmi-editions/31-le-boa-totem-de-soya.html');
const fleuvePage=readDraftHtml('hub-lmi-editions/32-le-fleuve-sans-nom.html');
const catalogue=readDraftHtml('hub-lmi-editions/11-catalogue-editorial.html');
const food=readDraftHtml('hub-lmi-editions/07-lmi-food.html');
if(!boaPage?.includes('data-lmi-asset="boa-totem-soya.webp"'))throw new Error('Boa editorial page has no validated cover');
if(!fleuvePage?.includes('data-lmi-asset="le-fleuve-sans-nom.webp"'))throw new Error('Fleuve editorial page has no validated cover');
if(!catalogue?.includes('lmi-visual-band'))throw new Error('Editorial catalogue has no visual selection');
if(!food?.includes('res.cloudinary.com/dzmpy5oij/image/upload/v1775504533/IMG_9559_rsjsim.jpg'))throw new Error('LMI Food gateway visual is missing');

for(const [name,html] of [['home',home],['boa',boaPage],['fleuve',fleuvePage],['catalogue',catalogue],['food',food]]){
  if(/EXPLORATION-REJETEE|NON-APPROUVE|placeholder/i.test(html))throw new Error(`Rejected or placeholder visual leaked into ${name}`);
}

console.log('Validated official LMI logo, Hub editorial visuals, local assets and protected asset loading.');
