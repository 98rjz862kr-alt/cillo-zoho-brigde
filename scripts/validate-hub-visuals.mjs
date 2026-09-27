import { createHash } from 'node:crypto';
import { readDraftAsset, readDraftHtml } from '../drafts.js';

const logo=readDraftAsset('hub-lmi-editions/assets/logo-lmi-hub.png');
const boa=readDraftAsset('hub-lmi-editions/assets/boa-totem-soya.jpg');
const fleuve=readDraftAsset('hub-lmi-editions/assets/le-fleuve-sans-nom.jpg');
const editionsHero=readDraftAsset('hub-lmi-editions/assets/LMI-EDT-WEB-HERO-V001.webp');
if(!logo?.content || logo.content.length<8000)throw new Error('Official LMI logo asset is missing or too small');
if(!boa?.content || boa.content.length<3000)throw new Error('Boa Totem approved visual is missing or empty');
if(!fleuve?.content || fleuve.content.length<2000)throw new Error('Fleuve sans nom approved visual is missing or empty');
if(!editionsHero?.content || editionsHero.content.length<100000)throw new Error('LMI Editions canonical web hero is missing or empty');
if(logo.contentType!=='image/png' || boa.contentType!=='image/jpeg' || fleuve.contentType!=='image/jpeg' || editionsHero.contentType!=='image/webp')throw new Error('Hub assets must preserve canonical PNG/JPEG/WebP format');

const home=readDraftHtml('hub-lmi-editions/01-accueil.html');
if(!home?.includes('id="lmi-hub-visual-style"'))throw new Error('Hub visual stylesheet missing on home');
if(!home.includes('id="lmi-hub-visual-script"'))throw new Error('Hub visual loader missing on home');
if(!home.includes('data-lmi-asset="logo-lmi-hub.png"'))throw new Error('Official LMI logo is not wired through protected asset loading');
if(!home.includes('data-lmi-approved="official-logo-2026-08-20"'))throw new Error('Official LMI identity marker is missing');
if(!home.includes('data-lmi-asset="LMI-EDT-WEB-HERO-V001.webp"'))throw new Error('Canonical LMI Editions hero missing from Hub home');
if(!home.includes('data-lmi-asset="boa-totem-soya.jpg"'))throw new Error('Boa cover missing from Hub home');
if(!home.includes('data-lmi-asset="le-fleuve-sans-nom.jpg"'))throw new Error('Fleuve cover missing from Hub home');
if(!home.includes('lmi-work-image'))throw new Error('Editorial work thumbnails missing from Hub home');

const boaPage=readDraftHtml('hub-lmi-editions/31-le-boa-totem-de-soya.html');
const fleuvePage=readDraftHtml('hub-lmi-editions/32-le-fleuve-sans-nom.html');
const catalogue=readDraftHtml('hub-lmi-editions/11-catalogue-editorial.html');
const food=readDraftHtml('hub-lmi-editions/07-lmi-food.html');
if(!boaPage?.includes('data-lmi-asset="boa-totem-soya.jpg"'))throw new Error('Boa editorial page has no validated cover');
if(!fleuvePage?.includes('data-lmi-asset="le-fleuve-sans-nom.jpg"'))throw new Error('Fleuve editorial page has no validated cover');
if(!catalogue?.includes('lmi-visual-band'))throw new Error('Editorial catalogue has no visual selection');
if(food?.includes('IMG_9559_rsjsim.jpg'))throw new Error('Food gateway reintroduces a photo removed for unverified provenance');

for(const [name,html] of [['home',home],['boa',boaPage],['fleuve',fleuvePage],['catalogue',catalogue],['food',food]]){
  if(/EXPLORATION-REJETEE|NON-APPROUVE|placeholder/i.test(html))throw new Error(`Rejected or placeholder visual leaked into ${name}`);
}

console.log('Validated official LMI logo, Hub editorial visuals, local assets and protected asset loading.');

const heroAsset='LMI-EDT-WEB-HERO-V001.webp';
const heroSha='e607517f5d980597469607fee3099e2884438eaaaa375ca055252cfd5290bbe7';
if(createHash('sha256').update(editionsHero.content).digest('hex')!==heroSha)throw new Error('HERO bytes no longer match the canonical source');
for(const [file,container] of [['11-catalogue-editorial.html','aside'],['19-presse-partenaires-droits.html','figure']]){
  const html=readDraftHtml('hub-lmi-editions/'+file)||'';
  const images=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>tag.includes('data-lmi-asset="'+heroAsset+'"'));
  if(images.length!==1)throw new Error(file+': exactly one restored HERO required');
  if(!images[0].includes('src="/atelier/file/hub-lmi-editions%2Fassets%2F'+heroAsset+'"'))throw new Error(file+': protected HERO source missing');
  if(!images[0].includes('width="1600" height="900"'))throw new Error(file+': HERO intrinsic dimensions missing');
  const slot=new RegExp('<'+container+'\\b[^>]*>\\s*<img[^>]*data-lmi-hero="editorial"','i');
  if(!slot.test(html))throw new Error(file+': HERO displaced from its editorial slot');
}
console.log('HUB_RESTORED_HERO_PASS P11 P19 SHA256');
