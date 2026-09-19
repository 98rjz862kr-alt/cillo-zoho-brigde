const CANONICAL_BRAND='LES MOTS IMAGÉS';
const TAGLINE='LE VERBE PAR L’IMAGE';
const SITES={
  editions:{label:'Éditions',href:'https://www.lesmotsimages.com/'},
  food:{label:'Food',href:'https://food.lesmotsimages.com/'},
  maison:{label:'Maison',href:'https://maison.lesmotsimages.com/'},
  musee:{label:'Musée',href:'https://musee.lesmotsimages.com/'}
};

function esc(value=''){
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

export function renderPrepublicationBanner(){
  return '<div class="lmi-prepublication" role="status">Brouillon privé de prépublication · validation humaine obligatoire</div>';
}

export function renderHeader({siteId='editions',homeHref='/',logoSrc='',prepublication=true}={}){
  if(!SITES[siteId]) throw new Error(`Unknown LMI site: ${siteId}`);
  const nav=Object.entries(SITES).map(([id,site])=>`<a href="${site.href}"${id===siteId?' aria-current="page"':''}>${site.label}</a>`).join('');
  const logo=logoSrc?`<img src="${esc(logoSrc)}" alt="" width="64" height="40" decoding="async">`:'';
  return `${prepublication?renderPrepublicationBanner():''}<a class="lmi-skip-link" href="#contenu">Aller au contenu</a><header class="lmi-header lmi-shell"><div class="lmi-header__inner"><a class="lmi-brand" href="${esc(homeHref)}">${logo}<span><span class="lmi-brand__name">${CANONICAL_BRAND}</span><small class="lmi-brand__tagline">${TAGLINE}</small></span></a><nav class="lmi-nav" aria-label="Écosystème LMI">${nav}</nav></div></header>`;
}

export function renderFooter({siteId='editions'}={}){
  if(!SITES[siteId]) throw new Error(`Unknown LMI site: ${siteId}`);
  return `<footer class="lmi-footer lmi-shell"><div class="lmi-footer__inner"><strong>${CANONICAL_BRAND}</strong><span>${SITES[siteId].label} · ${TAGLINE}</span></div></footer>`;
}

export const LMI_SITES=Object.freeze(SITES);
export const LMI_BRAND=Object.freeze({name:CANONICAL_BRAND,tagline:TAGLINE});
