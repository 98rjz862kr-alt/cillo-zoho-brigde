import { test, expect } from '@playwright/test';

const password='hub-qa-local';
const pages=[
  ['accueil','01-accueil.html'],
  ['food','07-lmi-food.html'],
  ['catalogue','11-catalogue-editorial.html'],
  ['boa','31-le-boa-totem-de-soya.html'],
  ['fleuve','32-le-fleuve-sans-nom.html']
];

function url(file){return `http://127.0.0.1:3000/atelier/file/${encodeURIComponent(`hub-lmi-editions/${file}`)}?password=${password}`;}

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
  for(const [slug,file] of pages){
    test(`${viewport.name} ${slug}`,async({page})=>{
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      const errors=[];
      page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
      page.on('pageerror',err=>errors.push(err.message));
      const response=await page.goto(url(file),{waitUntil:'networkidle'});
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('.lmi-official-logo').first()).toBeVisible();
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(4);
      const deadLinks=await page.locator('a[href="#"],a:not([href])').count();
      expect(deadLinks).toBe(0);
      const localAssets=page.locator('img[data-lmi-asset]');
      for(let i=0;i<await localAssets.count();i++){
        const ok=await localAssets.nth(i).evaluate(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0);
        expect(ok).toBeTruthy();
      }
      if(file==='01-accueil.html')expect(await localAssets.count()).toBeGreaterThanOrEqual(4);
      if(file==='31-le-boa-totem-de-soya.html'||file==='32-le-fleuve-sans-nom.html')expect(await localAssets.count()).toBeGreaterThanOrEqual(1);
      expect(errors).toEqual([]);
      await page.screenshot({path:`artifacts/hub-browser/${viewport.name}-${slug}.png`,fullPage:true});
    });
  }
}
