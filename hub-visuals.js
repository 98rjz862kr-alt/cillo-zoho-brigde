const HUB_DRAFT_PATTERN=/^hub-lmi-editions\/.+\.html$/i;
const ASSET_ROOT='hub-lmi-editions/assets/';

const VISUAL_STYLE=`<style id="lmi-hub-visual-style">
.lmi-editorial-visual{position:relative;overflow:hidden;border-radius:28px;background:#0f2747;box-shadow:0 24px 60px rgba(7,26,53,.20)}
.lmi-editorial-visual img{display:block;width:100%;height:100%;object-fit:cover}
.lmi-editorial-visual figcaption{position:absolute;left:0;right:0;bottom:0;padding:38px 20px 16px;background:linear-gradient(transparent,rgba(7,26,53,.92));color:#fff;font-size:.78rem;font-weight:800;letter-spacing:.04em}
.lmi-hero-visuals{display:grid;grid-template-columns:.78fr 1.22fr;gap:14px;margin:0 0 28px;align-items:end}
.lmi-hero-visuals figure{margin:0;min-height:250px}.lmi-hero-visuals figure:first-child{transform:translateY(18px) rotate(-2deg)}.lmi-hero-visuals figure:last-child{transform:rotate(1.4deg)}
.lmi-visual-band{width:min(calc(100% - 36px),1240px);margin:34px auto 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.lmi-visual-band figure{margin:0;min-height:280px}
.lmi-work-image{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:18px;margin-bottom:18px;box-shadow:0 12px 28px rgba(7,26,53,.16)}
.lmi-feature-visual{width:min(calc(100% - 36px),980px);margin:28px auto 44px}.lmi-feature-visual figure{margin:0;min-height:340px}
.lmi-food-photo{background-image:linear-gradient(180deg,rgba(7,26,53,.05),rgba(7,26,53,.42)),url('https://res.cloudinary.com/dzmpy5oij/image/upload/v1775504533/IMG_9559_rsjsim.jpg');background-size:cover;background-position:center;min-height:300px;border-radius:28px;box-shadow:0 20px 48px rgba(7,26,53,.14)}
@media(max-width:760px){.lmi-hero-visuals,.lmi-visual-band{grid-template-columns:1fr}.lmi-hero-visuals figure:first-child,.lmi-hero-visuals figure:last-child{transform:none}.lmi-hero-visuals figure,.lmi-visual-band figure,.lmi-feature-visual figure{min-height:240px}.lmi-feature-visual{margin-top:20px}}
</style>`;

const ASSET_SCRIPT=`<script id="lmi-hub-visual-script">(function(){var q=location.search||'';document.querySelectorAll('img[data-lmi-asset]').forEach(function(img){var p='${ASSET_ROOT}'+img.getAttribute('data-lmi-asset');img.src='/atelier/file/'+encodeURIComponent(p)+q;});})();</script>`;

function img(asset,alt,cls=''){return `<img ${cls?`class="${cls}"`:''} data-lmi-asset="${asset}" alt="${alt}" loading="eager" decoding="async">`;}
function figure(asset,alt,caption=''){return `<figure class="lmi-editorial-visual">${img(asset,alt)}${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;}

function addHomeVisuals(html){
  let out=html;
  const stack=`<div class="lmi-hero-visuals" aria-label="Œuvres LMI en images">${figure('boa-totem-soya.webp','Couverture du Boa Totem de Soya','Le Boa Totem de Soya')}${figure('le-fleuve-sans-nom.webp','Couverture du Fleuve sans nom','Le Fleuve sans nom')}</div>`;
  out=out.replace(/(<aside\b[^>]*class=["'][^"']*editorial-card[^"']*["'][^>]*>)/i,`$1${stack}`);
  out=out.replace(/(<a\b[^>]*href=["']31-le-boa-totem-de-soya\.html["'][^>]*class=["'][^"']*work[^"']*["'][^>]*>)/i,`$1${img('boa-totem-soya.webp','Couverture du Boa Totem de Soya','lmi-work-image')}`);
  out=out.replace(/(<a\b[^>]*href=["']32-le-fleuve-sans-nom\.html["'][^>]*class=["'][^"']*work[^"']*["'][^>]*>)/i,`$1${img('le-fleuve-sans-nom.webp','Couverture du Fleuve sans nom','lmi-work-image')}`);
  return out;
}

function addCatalogueVisuals(html){
  const band=`<section class="lmi-visual-band" aria-label="Sélection visuelle LMI Éditions">${figure('boa-totem-soya.webp','Couverture du Boa Totem de Soya','Jeunesse · récit illustré')}${figure('le-fleuve-sans-nom.webp','Couverture du Fleuve sans nom','Récit · adaptation graphique')}</section>`;
  return html.replace(/(<main\b[^>]*>)/i,`$1${band}`);
}

function addWorkVisual(html,asset,alt){
  const visual=`<div class="lmi-feature-visual">${figure(asset,alt)}</div>`;
  const replaced=html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/i,`$1${visual}`);
  return replaced===html?html.replace(/(<main\b[^>]*>)/i,`$1${visual}`):replaced;
}

function addFoodVisual(html){
  const block='<div class="lmi-feature-visual"><div class="lmi-food-photo" role="img" aria-label="Création culinaire LMI Food — photographie de production"></div></div>';
  return html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/i,`$1${block}`);
}

export function integrateHubVisuals(relativePath,html){
  const normalized=String(relativePath||'').replace(/^\/+/, '');
  if(!HUB_DRAFT_PATTERN.test(normalized))return html;
  const file=normalized.split('/').pop();
  let out=String(html||'');
  if(file==='01-accueil.html')out=addHomeVisuals(out);
  if(['11-catalogue-editorial.html','12-catalogue-bd-adaptations.html','13-univers-illustres-da.html'].includes(file))out=addCatalogueVisuals(out);
  if(file==='31-le-boa-totem-de-soya.html')out=addWorkVisual(out,'boa-totem-soya.webp','Couverture du Boa Totem de Soya');
  if(file==='32-le-fleuve-sans-nom.html')out=addWorkVisual(out,'le-fleuve-sans-nom.webp','Couverture du Fleuve sans nom');
  if(file==='07-lmi-food.html')out=addFoodVisual(out);
  if(!out.includes('id="lmi-hub-visual-style"'))out=out.replace(/<\/head>/i,`${VISUAL_STYLE}</head>`);
  if(!out.includes('id="lmi-hub-visual-script"'))out=out.replace(/<\/body>/i,`${ASSET_SCRIPT}</body>`);
  return out;
}
