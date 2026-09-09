const HUB_DRAFT_PATTERN = /^hub-lmi-editions\/.+\.html$/i;

const OFFICIAL_LOGO_ALT = 'Les Mots Images — Le verbe par l’image';
const OFFICIAL_LOGO_MARKUP = `<img class="lmi-official-logo" data-lmi-approved="official-logo-2026-08-20" data-lmi-asset="logo-lmi-hub.webp" alt="${OFFICIAL_LOGO_ALT}" width="700" height="439" loading="eager" decoding="async">`;

const IDENTITY_CSS = `
<style id="lmi-official-identity-guard">
body .lmi-official-logo{display:block;width:clamp(168px,17vw,190px);height:auto;max-height:116px;object-fit:contain;background:#fff;border-radius:12px;padding:4px;box-shadow:0 10px 28px rgba(7,26,53,.14)}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark{gap:0!important;min-width:174px;align-items:center}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark .lmi-official-logo{width:174px;max-height:108px;padding:3px;border-radius:10px;box-shadow:0 8px 22px rgba(7,26,53,.12)}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark-copy{display:none!important}
body .brand,body .identity{gap:0!important}
body .brand>.lmi-official-logo+div,body .identity>.lmi-official-logo+div{display:none!important}
body .brand .lmi-official-logo,body .identity .lmi-official-logo{width:184px;max-height:116px}
@media(max-width:700px){body .lmi-official-logo,body .brand .lmi-official-logo,body .identity .lmi-official-logo{width:146px;max-height:92px}body[data-lmi-runtime="premium-v2"] .lmi-wordmark .lmi-official-logo{width:146px;max-height:92px}}
</style>`;

function removeUnapprovedVisuals(html) {
  return String(html || '')
    .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<(?:object|embed)\b[^>]*>(?:[\s\S]*?<\/(?:object|embed)>)?/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<source\b[^>]*>/gi, '')
    .replace(/\s+poster=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/background(?:-image)?\s*:\s*url\([^;}]+\)\s*;?/gi, 'background-image:none;');
}

function injectOfficialLogo(html) {
  let output = String(html || '')
    .replace(/<span\s+class=["'][^"']*\blmi-wordmark-mark\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<div\s+class=["'][^"']*\bmark\b[^"']*["'][^>]*>\s*LMI\s*<\/div>/gi, '')
    .replace(/\.lmi-wordmark-mark\{[^}]*\}/gi, '');

  if (/class=["'][^"']*\blmi-wordmark\b/i.test(output)) {
    return output.replace(/(<a\b[^>]*class=["'][^"']*\blmi-wordmark\b[^"']*["'][^>]*>)/i, `$1${OFFICIAL_LOGO_MARKUP}`);
  }
  if (/class=["'][^"']*\bidentity\b/i.test(output)) {
    return output.replace(/(<div\b[^>]*class=["'][^"']*\bidentity\b[^"']*["'][^>]*>)/i, `$1${OFFICIAL_LOGO_MARKUP}`);
  }
  if (/class=["'][^"']*\bbrand\b/i.test(output)) {
    return output.replace(/(<div\b[^>]*class=["'][^"']*\bbrand\b[^"']*["'][^>]*>)/i, `$1${OFFICIAL_LOGO_MARKUP}`);
  }
  return output.replace(/(<body(?:\s[^>]*)?>)/i, `$1${OFFICIAL_LOGO_MARKUP}`);
}

export function enforceOfficialHubIdentity(relativePath, html) {
  const normalized = String(relativePath || '').replace(/^\/+/, '');
  if (!HUB_DRAFT_PATTERN.test(normalized)) return html;

  let output = removeUnapprovedVisuals(html);
  output = injectOfficialLogo(output);
  if (!output.includes('id="lmi-official-identity-guard"')) {
    output = output.replace(/<\/head>/i, `${IDENTITY_CSS}</head>`);
  }
  return output;
}
