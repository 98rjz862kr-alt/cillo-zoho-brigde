const DEFAULT_LINKS = [
  ['Éditions','https://editions.lesmotsimages.com'],
  ['Food','https://food.lesmotsimages.com'],
  ['Maison','https://maison.lesmotsimages.com'],
  ['Musée','https://musee.lesmotsimages.com']
];

export function renderSiteShell({current='editions', title='', links=DEFAULT_LINKS, bridge=false}={}) {
  const nav = links.map(([label,href]) => `<a${label.toLowerCase().includes(current) ? ' aria-current="page"' : ''} href="${href}">${label}</a>`).join('');
  return `${bridge ? '<div class="lmi-prepub-banner">Brouillon privé de prépublication · validation humaine obligatoire</div>' : ''}
<header class="lmi-shell" data-lmi-component="site-shell-v2">
  <div class="lmi-container lmi-shell__inner">
    <a class="lmi-shell__brand" href="https://www.lesmotsimages.com" aria-label="LES MOTS IMAGÉS — accueil">
      <span class="lmi-shell__name">LES MOTS IMAGÉS</span>
      <span class="lmi-shell__tagline">LE VERBE PAR L’IMAGE</span>
    </a>
    <div class="lmi-shell__title">${title}</div>
    <nav class="lmi-shell__nav" aria-label="Écosystème LMI">${nav}</nav>
  </div>
</header>`;
}

export const siteShellCss = `
.lmi-shell{background:rgba(246,241,232,.96);border-bottom:1px solid rgba(20,59,125,.14);backdrop-filter:blur(12px)}
.lmi-shell__inner{min-height:78px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1.4rem}
.lmi-shell__brand{text-decoration:none;color:var(--lmi-blue)}
.lmi-shell__name{display:block;font-family:Georgia,'Times New Roman',serif;font-weight:700;letter-spacing:.02em}
.lmi-shell__tagline{display:block;margin-top:.2rem;color:var(--lmi-sand);font-size:.62rem;font-weight:800;letter-spacing:.14em}
.lmi-shell__title{font-family:Georgia,'Times New Roman',serif;color:var(--lmi-ink);font-weight:700;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lmi-shell__nav{display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end}
.lmi-shell__nav a{padding:.5rem .75rem;border-radius:999px;text-decoration:none;font-size:.8rem;font-weight:800}
.lmi-shell__nav a[aria-current="page"]{background:var(--lmi-blue);color:#fff}
@media(max-width:860px){.lmi-shell__inner{grid-template-columns:1fr}.lmi-shell__nav{justify-content:flex-start}.lmi-shell__title{white-space:normal}}
`;
