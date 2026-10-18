import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderHeader, renderFooter } from './components/lmi-shell.mjs';
import { previewUrl } from './preview-paths.mjs';

const contract = JSON.parse(readFileSync(new URL('./contracts/client-facing-routes.v1.json', import.meta.url), 'utf8'));
const tokens = readFileSync(new URL('./styles/lmi-tokens.css', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./styles/socle.css', import.meta.url), 'utf8');
const routes = new Map(Object.entries(contract.sites).flatMap(([id, site]) => site.visitorRoutes.map(route => [route, { id, ...site }])));
const toPreview = route => `/atelier/file/${encodeURIComponent(route)}`;
const siteLinks = Object.fromEntries(Object.entries(contract.sites).map(([id, site]) => [id, { href: toPreview(site.home) }]));
const DEFAULT_NAV = {
  editions: [['Accueil', '01-accueil.html'], ['Catalogue', '11-catalogue-editorial.html'], ['Manuscrits', '09-manuscrits-textes.html'], ['Audio', '14-audio-transmission.html'], ['Presse & droits', '19-presse-partenaires-droits.html'], ['Contact', '05-contact.html']],
  food: [['Accueil', '00-bat-lmi-food.html'], ['Petits déjeuners', '02-petits-dejeuners-collations.html'], ['Épicerie', '04-epicerie-condiments.html'], ['Recettes & livres', '08-collection-editoriale-recettes.html'], ['Contact', 'contact.html']],
  maison: [['Accueil', '00-bat-lmi-maison.html'], ['Collection', '01-collection-inaugurale-lmi-maison.html'], ['Votre projet', '06-parcours-commercial-prive-lmi-maison.html'], ['Contact', 'contact.html']],
  musee: [['Accueil', 'index.html'], ['Archives', 'archives-fonds-traces.html'], ['Collections', 'collections.html'], ['Méthode', 'recherche-transmission.html'], ['Contact', 'contact.html'], ['Soutenir', 'soutenir.html']],
};

export const OFFICIAL_LOGO_PROVENANCE = Object.freeze({
  driveId: '1i2Gvfxp7X3V8Q6EzOR0-bDFmpcDQCJTX',
  sha256: 'd796f29475383b8cc1bfda8ac44bb1b66933fdf96d0050004252b79a9b1b499b',
});

function decodeText(value) {
  return String(value).replace(/&#(x[0-9a-f]+|\d+);/gi, (match, code) => {
    const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
  }).replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, entity) => ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' })[entity]);
}

function linksFrom(fragment, relativePath) {
  return [...fragment.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].filter(match => !/<img\b/i.test(match[2])).map(match => ({
    href: previewUrl(relativePath, decodeText(match[1])),
    label: decodeText(match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()),
  })).filter(link => link.label);
}

function uniqueLinks(links) {
  return [...new Map(links.map(link => [link.href, link])).values()];
}

// Balanced div ranges keep a branding bar's nested wrappers together and leave
// the following hero and main content untouched.
function removeLegacyBrandBars(html) {
  const stack = [];
  const ranges = [];
  for (const match of html.matchAll(/<\/?div\b[^>]*>/gi)) {
    if (!/^<\//.test(match[0])) stack.push({ index: match.index, end: match.index + match[0].length, tag: match[0] });
    else {
      const open = stack.pop();
      if (!open) continue;
      const content = html.slice(open.end, match.index);
      if (/\bclass=["'](?:[^"']*\s)?(?:top|topbar)(?:\s[^"']*)?["']/i.test(open.tag) && /class=["'][^"']*\b(?:brand|identity)\b/i.test(content) && !/<(?:h1|main|section|article)\b/i.test(content)) ranges.push([open.index, match.index + match[0].length]);
    }
  }
  for (const [start, end] of ranges.sort((a, b) => b[0] - a[0])) html = html.slice(0, start) + html.slice(end);
  return html;
}

/** Apply the common shell only to the 67 qualified visitor routes. */
export function applySharedSiteShell(relativePath, source) {
  const site = routes.get(relativePath);
  if (!site || !source || /data-lmi-shell="shared-v1"/.test(source)) return source;
  // Runtime scripts contain HTML templates; don't mistake those strings for DOM.
  const protectedBlocks = [];
  let html = source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, block => `\u0000LMI_BLOCK_${protectedBlocks.push(block) - 1}\u0000`);
  const navigation = [];
  const footerLinks = [];
  const footerCopy = [];
  html = html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, header => {
    if (/<h1\b/i.test(header)) return header.replace(/^<header\b/i, '<section').replace(/<\/header>$/i, '</section>');
    navigation.push(...linksFrom(header, relativePath));
    return '';
  });
  html = removeLegacyBrandBars(html);
  html = html.replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi, (_, content) => {
    footerLinks.push(...linksFrom(content, relativePath));
    footerCopy.push(content);
    return '';
  });
  let contentId = 'lmi-main-content';
  if (/<main\b/i.test(html)) {
    html = html.replace(/<main\b([^>]*)>/i, (tag, attributes) => {
      contentId = decodeText(attributes.match(/\bid=["']([^"']+)["']/i)?.[1] || contentId);
      return `<main${attributes}${/\bid=/i.test(attributes) ? '' : ` id="${contentId}"`}${/\btabindex=/i.test(attributes) ? '' : ' tabindex="-1"'}>`;
    });
  } else {
    html = html.replace(/(<body\b[^>]*>)([\s\S]*?)(<\/body>)/i, `$1<main class="lmi-content-root" id="${contentId}" tabindex="-1">$2</main>$3`);
  }
  const homeHref = toPreview(site.home);
  const currentHref = toPreview(relativePath);
  const defaults = DEFAULT_NAV[site.id].map(([label, file]) => ({ label, href: toPreview(`${path.posix.dirname(site.home)}/${file}`) }));
  const localNav = uniqueLinks(navigation.length ? [{ label: 'Accueil', href: homeHref }, ...navigation, { label: 'Contact', href: toPreview(site.contactRoute) }] : defaults);
  const logoName = site.id === 'editions' ? 'logo-lmi-hub.png' : 'lmi-logo-main.png';
  // Retain the Editions identity guard's approved-logo and asset-loader markers
  // when its legacy header is replaced by the shared header.
  const header = renderHeader({ siteId: site.id, homeHref, logoSrc: toPreview(`${path.posix.dirname(site.home)}/assets/${logoName}`), logoDriveId: OFFICIAL_LOGO_PROVENANCE.driveId, logoSha256: OFFICIAL_LOGO_PROVENANCE.sha256, ...(site.id === 'editions' ? { logoAsset: logoName, logoApproval: 'official-logo-2026-08-20' } : {}), siteLinks, navigation: localNav, currentHref, contentId, prepublication: false });
  let footer = renderFooter({ siteId: site.id, currentHref, links: uniqueLinks([{ label: 'Accueil', href: homeHref }, { label: 'Contact', href: toPreview(site.contactRoute) }, { label: 'Mentions légales & confidentialité', href: toPreview(site.legalRoute) }, ...footerLinks]) });
  if (footerCopy.length) footer = footer.replace('</nav></div></footer>', `</nav><div class="lmi-footer__context">${footerCopy.join('')}</div></div></footer>`);
  html = html.replace(/<body\b([^>]*)>/i, `<body$1 data-lmi-shell="shared-v1" data-lmi-site="${site.id}">${header}`)
    .replace(/<\/head>/i, `<style id="lmi-shared-tokens">${tokens}</style><style id="lmi-shared-shell-style">${styles}</style></head>`)
    .replace(/<\/body>/i, `${footer}</body>`);
  return html.replace(/\u0000LMI_BLOCK_(\d+)\u0000/g, (_, index) => protectedBlocks[Number(index)]);
}
