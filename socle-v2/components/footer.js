export function renderFooter({legalHref='/mentions-legales', privacyHref='/confidentialite'}={}){
  const year = new Date().getUTCFullYear();
  return `<footer class="lmi-footer" data-lmi-component="footer-v2"><div class="lmi-container"><strong>LES MOTS IMAGÉS</strong><span>LE VERBE PAR L’IMAGE</span><nav aria-label="Pied de page"><a href="${legalHref}">Mentions légales</a><a href="${privacyHref}">Confidentialité</a></nav><small>© ${year} LES MOTS IMAGÉS</small></div></footer>`;
}
export const footerCss = `.lmi-footer{margin-top:4rem;background:var(--lmi-night);color:#fff;padding:2.2rem 0}.lmi-footer .lmi-container{display:grid;gap:.6rem}.lmi-footer span,.lmi-footer small{color:rgba(255,255,255,.72)}.lmi-footer nav{display:flex;gap:1rem;flex-wrap:wrap}.lmi-footer a{color:#fff}`;
