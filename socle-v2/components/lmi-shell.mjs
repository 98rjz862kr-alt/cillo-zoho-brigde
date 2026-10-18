import { mobileNavigationScript } from './mobile-navigation.mjs';

const CANONICAL_BRAND = 'LES MOTS IMAGÉS';
const TAGLINE = 'LE VERBE PAR L’IMAGE';
const SITES = Object.freeze({
  editions: Object.freeze({ label: 'Éditions', href: 'https://www.lesmotsimages.com/' }),
  food: Object.freeze({ label: 'Food', href: 'https://food.lesmotsimages.com/' }),
  maison: Object.freeze({ label: 'Maison', href: 'https://maison.lesmotsimages.com/' }),
  musee: Object.freeze({ label: 'Musée', href: 'https://musee.lesmotsimages.com/' }),
});

function esc(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function safeHref(value) {
  const href = String(value || '');
  if (!href || /[\u0000-\u0020\u007f]/.test(href) || /^(?:javascript|data|vbscript):/i.test(href) || href.startsWith('//')) throw new TypeError('Invalid shared-shell URL');
  if (!/^(?:\/|#|https?:\/\/|mailto:|tel:)/i.test(href)) throw new TypeError('Shared-shell URL must be absolute or root-relative');
  return esc(href);
}

function siteDefinition(siteId) {
  if (!Object.hasOwn(SITES, siteId)) throw new TypeError(`Unknown LMI site: ${siteId}`);
  return SITES[siteId];
}

function renderLinks(links, currentHref) {
  return links.map(({ href, label }) => `<a href="${safeHref(href)}"${href === currentHref ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
}

export function renderPrepublicationBanner() {
  return '<div class="lmi-prepublication" role="status">Brouillon privé de prépublication · validation humaine obligatoire</div>';
}

export function renderHeader({ siteId = 'editions', homeHref = '/', logoSrc = '', logoDriveId = '', logoSha256 = '', logoAsset = '', logoApproval = '', siteLinks = SITES, navigation = [], contextNavigation = [], currentHref = '', contentId = 'lmi-main-content', prepublication = false } = {}) {
  const site = siteDefinition(siteId);
  const ecosystem = Object.entries(SITES).map(([id, definition]) => `<a data-lmi-site-link="${id}" href="${safeHref(siteLinks[id]?.href || definition.href)}"${id === siteId ? ' aria-current="true"' : ''}>${esc(definition.label)}</a>`).join('');
  const logo = logoSrc ? `<img class="lmi-brand__logo" src="${safeHref(logoSrc)}" alt="${CANONICAL_BRAND}" width="1000" height="635" loading="eager" decoding="async"${logoDriveId ? ` data-lmi-drive-id="${esc(logoDriveId)}"` : ''}${logoSha256 ? ` data-lmi-sha256="${esc(logoSha256)}"` : ''}${logoAsset ? ` data-lmi-asset="${esc(logoAsset)}"` : ''}${logoApproval ? ` data-lmi-approved="${esc(logoApproval)}"` : ''}>` : '';
  const context = contextNavigation.length ? `<div class="lmi-context-navigation"><nav class="lmi-context-nav" aria-label="Dans cette rubrique">${renderLinks(contextNavigation, currentHref)}</nav></div>` : '';
  return `${prepublication ? renderPrepublicationBanner() : ''}<a class="lmi-skip-link" href="#${esc(contentId)}">Aller au contenu</a><header class="lmi-header lmi-shell" data-lmi-shared-header="${esc(siteId)}"><div class="lmi-header__inner"><a class="lmi-brand" href="${safeHref(homeHref)}">${logo}<span class="lmi-brand__copy"><span class="lmi-brand__name">LMI ${esc(site.label)}</span><small class="lmi-brand__tagline">${TAGLINE}</small></span></a><button class="lmi-menu-toggle" type="button" data-lmi-menu-toggle aria-label="Menu LMI ${esc(site.label)}" aria-controls="lmi-site-navigation" aria-expanded="true" hidden>Menu <span class="lmi-menu-toggle__mark" aria-hidden="true">+</span></button><nav class="lmi-ecosystem-nav" aria-label="Écosystème Les Mots Imagés">${ecosystem}</nav></div><div class="lmi-header__navigation" id="lmi-site-navigation"><nav class="lmi-site-nav" aria-label="Navigation LMI ${esc(site.label)}">${renderLinks(navigation, currentHref)}</nav></div>${context}</header><script id="lmi-mobile-navigation">${mobileNavigationScript}</script>`;
}

export function renderFooter({ siteId = 'editions', links = [], currentHref = '' } = {}) {
  const site = siteDefinition(siteId);
  return `<footer class="lmi-footer lmi-shell" data-lmi-shared-footer="${esc(siteId)}"><div class="lmi-footer__inner"><div class="lmi-footer__identity"><strong>${CANONICAL_BRAND}</strong><span>LMI ${esc(site.label)} · ${TAGLINE}</span></div><nav class="lmi-footer__links" aria-label="Informations LMI ${esc(site.label)}">${renderLinks(links, currentHref)}</nav></div></footer>`;
}

export const LMI_SITES = SITES;
export const LMI_BRAND = Object.freeze({ name: CANONICAL_BRAND, tagline: TAGLINE });
