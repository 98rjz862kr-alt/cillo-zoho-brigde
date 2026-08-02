const HUB_PAGE_PATTERN = /^hub-lmi-editions\/(?:0[2-9]|[12][0-9]|3[0-2])-[^/]+\.html$/i;

const PAGE_FILES = [
  '00-sommaire-hub-lmi-editions.html',
  '01-accueil.html',
  '02-comprendre-lmi.html',
  '03-choisir-son-pole.html',
  '04-poles-associes.html',
  '05-contact.html',
  '06-lmi-maison.html',
  '07-lmi-food.html',
  '08-lmi-musee.html',
  '09-manuscrits-textes.html',
  '10-ressources-acces-fiches.html',
  '11-catalogue-editorial.html',
  '12-catalogue-bd-adaptations.html',
  '13-univers-illustres-da.html',
  '14-audio-transmission.html',
  '15-livres-audio.html',
  '16-actualites-evenements.html',
  '17-a-propos-ressources.html',
  '18-blog.html',
  '19-presse-partenaires-droits.html',
  '20-mentions-legales-confidentialite.html',
  '21-destination-connue-itineraires-incertains.html',
  '22-lettres-a-ceux-qui-viendront.html',
  '23-sombres-memoires-verbes-muets.html',
  '24-la-femme-maitresse-du-monde-mais-ostracisee.html',
  '25-le-peuple-sans-messager.html',
  '26-feodalisme-religieux.html',
  '27-l-utopie-pour-faconner-le-reel.html',
  '28-l-autocensure.html',
  '29-le-racisme-est-universel.html',
  '30-l-otage-de-l-absurde.html',
  '31-le-boa-totem-de-soya.html',
  '32-le-fleuve-sans-nom.html'
];

function pageGroup(pageNumber) {
  if (pageNumber <= 5) return 'orientation';
  if (pageNumber <= 8) return 'poles';
  if (pageNumber <= 20) return 'ressources';
  return 'oeuvres';
}

const PREMIUM_CSS = `
<style id="lmi-premium-runtime-style">
:root{--lmi-blue:#143B7D;--lmi-night:#071A35;--lmi-ochre:#CC7722;--lmi-sand:#75553F;--lmi-gold:#D4AF37;--lmi-ivory:#F5F1E8;--lmi-paper:#FFFDF8;--lmi-ink:#172235;--lmi-muted:#5E697A;--lmi-line:rgba(20,59,125,.14);--lmi-shadow:0 22px 64px rgba(7,26,53,.12);--lmi-max:1180px}
body[data-lmi-runtime="premium-v2"]{margin:0!important;background:radial-gradient(circle at 8% 18%,rgba(204,119,34,.07),transparent 380px),radial-gradient(circle at 92% 42%,rgba(20,59,125,.08),transparent 440px),var(--lmi-ivory)!important;color:var(--lmi-ink)!important;font-family:Arial,Helvetica,sans-serif!important;line-height:1.68!important;overflow-x:hidden}
body[data-lmi-runtime="premium-v2"] *{box-sizing:border-box}
body[data-lmi-runtime="premium-v2"] a{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease}
body[data-lmi-runtime="premium-v2"] .lmi-shell-nav{position:sticky;top:32px;z-index:90;background:rgba(245,241,232,.94);border-bottom:1px solid var(--lmi-line);backdrop-filter:blur(18px);box-shadow:0 8px 28px rgba(7,26,53,.06)}
body[data-lmi-runtime="premium-v2"] .lmi-shell-inner{width:min(calc(100% - 38px),var(--lmi-max));min-height:82px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:26px}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark{display:flex;align-items:center;gap:14px;color:var(--lmi-blue);text-decoration:none!important}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark-mark{width:45px;height:45px;border-radius:16px;background:linear-gradient(145deg,var(--lmi-blue),var(--lmi-night));box-shadow:inset 0 0 0 1px rgba(212,175,55,.55),0 10px 24px rgba(7,26,53,.16);display:grid;place-items:center;color:var(--lmi-gold);font:700 16px Georgia,serif;letter-spacing:.04em}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark-copy strong{display:block;font:700 1.06rem Georgia,serif;letter-spacing:.01em}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark-copy small{display:block;margin-top:3px;color:var(--lmi-sand);font-size:.63rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
body[data-lmi-runtime="premium-v2"] .lmi-shell-title{min-width:0;flex:1;padding-left:24px;border-left:1px solid var(--lmi-line)}
body[data-lmi-runtime="premium-v2"] .lmi-shell-title span{display:block;color:var(--lmi-ochre);font-size:.64rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
body[data-lmi-runtime="premium-v2"] .lmi-shell-title strong{display:block;max-width:430px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--lmi-ink);font:700 1rem Georgia,serif}
body[data-lmi-runtime="premium-v2"] .lmi-shell-links{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
body[data-lmi-runtime="premium-v2"] .lmi-shell-links a{padding:9px 12px;border-radius:999px;color:var(--lmi-blue)!important;text-decoration:none!important;font-size:.74rem;font-weight:900;border:1px solid transparent;background:transparent!important}
body[data-lmi-runtime="premium-v2"] .lmi-shell-links a:hover{border-color:var(--lmi-line);background:#fff!important;transform:translateY(-1px)}
body[data-lmi-runtime="premium-v2"] .lmi-page-rail{position:fixed;left:18px;top:50%;z-index:55;transform:translateY(-50%);width:42px;padding:14px 0;border-radius:24px;background:rgba(7,26,53,.92);color:#fff;display:grid;place-items:center;gap:12px;box-shadow:0 16px 42px rgba(7,26,53,.26)}
body[data-lmi-runtime="premium-v2"] .lmi-page-rail strong{font:700 1rem Georgia,serif;color:var(--lmi-gold)}
body[data-lmi-runtime="premium-v2"] .lmi-page-rail span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:.56rem;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.72)}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero{position:relative!important;isolation:isolate;overflow:hidden!important;margin:0!important;padding:92px max(24px,calc((100vw - var(--lmi-max))/2)) 84px!important;background:linear-gradient(132deg,var(--lmi-night) 0%,var(--lmi-blue) 66%,#245298 100%)!important;color:#fff!important;border:0!important;border-radius:0!important;box-shadow:none!important;max-width:none!important;width:100%!important}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero:before{content:"";position:absolute;z-index:-2;width:560px;height:560px;border-radius:50%;right:-190px;top:-280px;border:1px solid rgba(212,175,55,.34);box-shadow:0 0 0 60px rgba(212,175,55,.05),0 0 0 122px rgba(212,175,55,.025)}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero:after{content:"";position:absolute;z-index:-1;inset:0;background-image:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px);background-size:44px 44px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 88%)}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero>*{position:relative;z-index:1}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero h1{max-width:920px!important;margin:0!important;color:#fff!important;font:700 clamp(3.25rem,7vw,7.2rem)/.98 Georgia,'Times New Roman',serif!important;letter-spacing:-.05em!important;text-wrap:balance}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero h1:before{content:attr(data-lmi-kicker);display:block;margin:0 0 19px;color:#F2D88A;font:900 .72rem/1.3 Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-hero p{max-width:820px!important;color:rgba(255,255,255,.8)!important;font-size:clamp(1rem,1.7vw,1.22rem)!important;line-height:1.7!important}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-section{position:relative;width:min(calc(100% - 42px),var(--lmi-max))!important;margin:0 auto!important;padding:76px 0!important;background:transparent!important;border:0!important;max-width:none!important}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-section+.lmi-runtime-section{border-top:1px solid var(--lmi-line)!important}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-section:nth-of-type(even){background:linear-gradient(145deg,rgba(255,255,255,.72),rgba(255,255,255,.25))!important;border-radius:34px!important;padding-left:38px!important;padding-right:38px!important;margin-bottom:34px!important;box-shadow:0 14px 46px rgba(7,26,53,.05)}
body[data-lmi-runtime="premium-v2"] h2{margin:0 0 20px!important;color:var(--lmi-blue)!important;font:700 clamp(2.15rem,4.5vw,4.4rem)/1.04 Georgia,'Times New Roman',serif!important;letter-spacing:-.04em!important;text-wrap:balance}
body[data-lmi-runtime="premium-v2"] h3{color:var(--lmi-blue)!important;font-family:Georgia,'Times New Roman',serif!important;line-height:1.15!important}
body[data-lmi-runtime="premium-v2"] p{color:var(--lmi-muted);font-size:1rem}
body[data-lmi-runtime="premium-v2"] .lmi-card-runtime{position:relative!important;overflow:hidden!important;border:1px solid var(--lmi-line)!important;border-radius:24px!important;background:linear-gradient(150deg,#fff,#fbf8f1)!important;box-shadow:0 14px 42px rgba(7,26,53,.075)!important;padding:26px!important}
body[data-lmi-runtime="premium-v2"] .lmi-card-runtime:after{content:"";position:absolute;width:130px;height:130px;border-radius:50%;right:-78px;bottom:-82px;background:rgba(20,59,125,.045)}
body[data-lmi-runtime="premium-v2"] .lmi-card-runtime:hover{transform:translateY(-2px);box-shadow:var(--lmi-shadow)!important;border-color:rgba(204,119,34,.35)!important}
body[data-lmi-runtime="premium-v2"] .lmi-card-runtime h3,body[data-lmi-runtime="premium-v2"] .lmi-card-runtime h2{position:relative;z-index:1}
body[data-lmi-runtime="premium-v2"] .lmi-card-runtime p,body[data-lmi-runtime="premium-v2"] .lmi-card-runtime li{position:relative;z-index:1}
body[data-lmi-runtime="premium-v2"] main a:not(.lmi-shell-link):not(.lmi-wordmark){border-radius:999px!important;text-decoration:none!important;font-weight:900!important}
body[data-lmi-runtime="premium-v2"] main a[href]{display:inline-flex;align-items:center;gap:8px;color:var(--lmi-blue)!important}
body[data-lmi-runtime="premium-v2"] main a[href]:hover{color:var(--lmi-ochre)!important}
body[data-lmi-runtime="premium-v2"] ul,body[data-lmi-runtime="premium-v2"] ol{padding-left:1.25rem}
body[data-lmi-runtime="premium-v2"] li{margin:.55rem 0;color:var(--lmi-muted)}
body[data-lmi-runtime="premium-v2"] table{width:100%;border-collapse:separate!important;border-spacing:0!important;overflow:hidden;border:1px solid var(--lmi-line);border-radius:20px;background:#fff;box-shadow:0 12px 36px rgba(7,26,53,.06)}
body[data-lmi-runtime="premium-v2"] th{background:var(--lmi-blue)!important;color:#fff!important;text-align:left;padding:15px!important}
body[data-lmi-runtime="premium-v2"] td{padding:15px!important;border-top:1px solid var(--lmi-line)!important}
body[data-lmi-runtime="premium-v2"] blockquote{margin:32px 0!important;padding:24px 28px!important;border-left:5px solid var(--lmi-ochre)!important;background:#fff8ec!important;color:var(--lmi-sand)!important;border-radius:0 18px 18px 0!important}
body[data-lmi-runtime="premium-v2"] footer:not(.lmi-runtime-pager){background:var(--lmi-night)!important;color:rgba(255,255,255,.72)!important;padding:32px max(24px,calc((100vw - var(--lmi-max))/2))!important;border:0!important}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-pager{width:min(calc(100% - 42px),var(--lmi-max));margin:28px auto 84px;padding:26px;border-top:1px solid var(--lmi-line);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-pager a{min-height:72px;padding:16px 20px;border:1px solid var(--lmi-line);border-radius:20px!important;background:#fff;color:var(--lmi-blue)!important;box-shadow:0 10px 30px rgba(7,26,53,.06);display:flex!important;flex-direction:column;justify-content:center;align-items:flex-start;line-height:1.2}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-pager a:last-child{align-items:flex-end;text-align:right}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-pager a:hover{transform:translateY(-2px);border-color:rgba(204,119,34,.35)}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-pager small{color:var(--lmi-ochre);font-size:.62rem;font-weight:900;letter-spacing:.11em;text-transform:uppercase}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-pager strong{margin-top:6px;font:700 1rem Georgia,serif}
body[data-lmi-runtime="premium-v2"] .lmi-runtime-pager .home{width:48px;height:48px;min-height:48px;padding:0;border-radius:50%!important;align-items:center;justify-content:center;font-size:1.1rem;background:var(--lmi-blue);color:#fff!important}
body[data-lmi-runtime="premium-v2"][data-lmi-group="poles"] .lmi-runtime-hero{background:linear-gradient(132deg,#10294b 0%,var(--lmi-blue) 62%,#86552c 130%)!important}
body[data-lmi-runtime="premium-v2"][data-lmi-group="ressources"] .lmi-runtime-hero{background:linear-gradient(132deg,#08172f 0%,#173f7d 60%,#9b612b 135%)!important}
body[data-lmi-runtime="premium-v2"][data-lmi-group="oeuvres"] .lmi-runtime-hero{background:radial-gradient(circle at 78% 22%,rgba(204,119,34,.24),transparent 320px),linear-gradient(132deg,#071A35 0%,#143B7D 72%)!important}
body[data-lmi-runtime="premium-v2"][data-lmi-group="oeuvres"] .lmi-runtime-hero h1{max-width:1040px!important}
@media(max-width:980px){body[data-lmi-runtime="premium-v2"] .lmi-shell-inner{align-items:flex-start;flex-direction:column;padding:15px 0}.lmi-shell-title{padding-left:0!important;border-left:0!important}.lmi-shell-links{justify-content:flex-start!important}.lmi-page-rail{display:none!important}.lmi-runtime-hero{padding-left:24px!important;padding-right:24px!important}.lmi-runtime-section{width:min(calc(100% - 32px),var(--lmi-max))!important}.lmi-runtime-pager{grid-template-columns:1fr 48px 1fr}}
@media(max-width:640px){body[data-lmi-runtime="premium-v2"] .lmi-shell-nav{top:30px}.lmi-shell-links a:nth-child(n+3){display:none}.lmi-runtime-hero{padding-top:64px!important;padding-bottom:58px!important}.lmi-runtime-section{padding:54px 0!important}.lmi-runtime-section:nth-of-type(even){padding-left:22px!important;padding-right:22px!important;border-radius:24px!important}.lmi-card-runtime{padding:22px!important}.lmi-runtime-pager{width:calc(100% - 28px);grid-template-columns:1fr 1fr}.lmi-runtime-pager .home{display:none!important}.lmi-runtime-pager a{min-height:66px;padding:13px}.lmi-wordmark-copy small{display:none!important}}
</style>`;

function premiumScript(pageNumber, group) {
  const files = JSON.stringify(PAGE_FILES);
  return `
<script id="lmi-premium-runtime-script">
(function(){
  const pageNumber=${pageNumber};
  const group=${JSON.stringify(group)};
  const files=${files};
  const q=location.search||'';
  const draft=(file)=>'/atelier/file/'+encodeURIComponent('hub-lmi-editions/'+file)+q;
  const body=document.body;
  if(!body||body.dataset.lmiEnhanced==='yes')return;
  body.dataset.lmiEnhanced='yes';

  const allBodyChildren=[...body.children];
  const statusBar=allBodyChildren.find((el)=>/(bridge|status)/i.test(el.className||''));
  const pageTitle=(body.querySelector('h1')?.textContent||document.title||'Hub LMI Éditions').replace(/\s+/g,' ').trim();
  const shell=document.createElement('div');
  shell.className='lmi-shell-nav';
  shell.innerHTML='<div class="lmi-shell-inner"><a class="lmi-wordmark" href="'+draft(files[0])+'"><span class="lmi-wordmark-mark">LMI</span><span class="lmi-wordmark-copy"><strong>Les Mots Images</strong><small>Le verbe par l’image</small></span></a><div class="lmi-shell-title"><span>Page '+String(pageNumber).padStart(2,'0')+' · '+group+'</span><strong>'+pageTitle+'</strong></div><nav class="lmi-shell-links"><a class="lmi-shell-link" href="'+draft(files[1])+'">Accueil</a><a class="lmi-shell-link" href="'+draft(files[11])+'">Catalogue</a><a class="lmi-shell-link" href="'+draft(files[17])+'">À propos</a><a class="lmi-shell-link" href="'+draft(files[5])+'">Contact</a></nav></div>';
  if(statusBar&&statusBar.nextSibling)body.insertBefore(shell,statusBar.nextSibling);else body.insertBefore(shell,body.firstChild);

  const rail=document.createElement('aside');
  rail.className='lmi-page-rail';
  rail.innerHTML='<strong>'+String(pageNumber).padStart(2,'0')+'</strong><span>'+group+'</span>';
  body.appendChild(rail);

  const h1=body.querySelector('h1');
  if(h1){
    h1.dataset.lmiKicker=group==='oeuvres'?'Collection éditoriale LMI':group==='poles'?'Écosystème LMI':group==='ressources'?'Ressources et transmission':'Comprendre et s’orienter';
    const hero=h1.closest('section,header,main,div');
    if(hero&&!hero.classList.contains('lmi-shell-nav'))hero.classList.add('lmi-runtime-hero');
  }

  const sections=[...body.querySelectorAll('main section,body>section')].filter((section)=>!section.classList.contains('lmi-runtime-hero')&&!section.classList.contains('lmi-shell-nav'));
  sections.forEach((section)=>section.classList.add('lmi-runtime-section'));

  const cardSelectors='article,.card,.panel,.item,.pole,.axis,.offer,.feature,.bloc,.block,.notice,.scope,.note,.box,.tile';
  body.querySelectorAll(cardSelectors).forEach((el)=>{
    if(!el.closest('.lmi-shell-nav')&&!el.classList.contains('lmi-runtime-hero')&&!el.closest('.lmi-runtime-hero'))el.classList.add('lmi-card-runtime');
  });

  body.querySelectorAll('img').forEach((img)=>{
    if(!img.closest('.lmi-shell-nav')){
      img.style.borderRadius=img.style.borderRadius||'22px';
      img.style.boxShadow=img.style.boxShadow||'0 18px 48px rgba(7,26,53,.14)';
    }
  });

  const pager=document.createElement('footer');
  pager.className='lmi-runtime-pager';
  const previous=pageNumber>1?files[pageNumber-1]:files[0];
  const next=pageNumber<files.length-1?files[pageNumber+1]:files[0];
  const titleFromFile=(file)=>file.replace(/^\d{2}-/,'').replace(/\.html$/,'').replace(/-/g,' ').replace(/\b\w/g,(c)=>c.toUpperCase());
  pager.innerHTML='<a href="'+draft(previous)+'"><small>Page précédente</small><strong>'+titleFromFile(previous)+'</strong></a><a class="home" href="'+draft(files[0])+'" aria-label="Sommaire">⌂</a><a href="'+draft(next)+'"><small>Page suivante</small><strong>'+titleFromFile(next)+'</strong></a>';
  const existingFooter=body.querySelector('footer:not(.lmi-runtime-pager)');
  if(existingFooter)body.insertBefore(pager,existingFooter);else body.appendChild(pager);
})();
</script>`;
}

export function decorateHubDraft(relativePath, html) {
  const normalized = String(relativePath || '').replace(/^\/+/, '');
  if (!HUB_PAGE_PATTERN.test(normalized)) return html;
  if (String(html || '').includes('data-lmi-runtime="premium-v2"')) return html;

  const fileName = normalized.split('/').pop() || '';
  const pageNumber = Number.parseInt(fileName.slice(0, 2), 10);
  const group = pageGroup(pageNumber);
  const bodyTag = `<body data-lmi-runtime="premium-v2" data-lmi-group="${group}" data-lmi-page="${String(pageNumber).padStart(2, '0')}">`;

  return String(html || '')
    .replace(/<body(?:\s[^>]*)?>/i, bodyTag)
    .replace(/<\/head>/i, `${PREMIUM_CSS}</head>`)
    .replace(/<\/body>/i, `${premiumScript(pageNumber, group)}</body>`);
}
