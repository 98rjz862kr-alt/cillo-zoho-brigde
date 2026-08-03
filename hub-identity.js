const HUB_DRAFT_PATTERN = /^hub-lmi-editions\/.+\.html$/i;

const IDENTITY_CSS = `
<style id="lmi-official-identity-guard">
body[data-lmi-runtime="premium-v2"] .lmi-wordmark{gap:0!important}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark-copy{padding-left:0!important}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark-copy strong{font-size:1.13rem!important;letter-spacing:.015em!important}
body[data-lmi-runtime="premium-v2"] .lmi-wordmark-copy small{color:var(--lmi-ochre)!important}
</style>`;

export function enforceOfficialHubIdentity(relativePath, html) {
  const normalized = String(relativePath || '').replace(/^\/+/, '');
  if (!HUB_DRAFT_PATTERN.test(normalized)) return html;

  let output = String(html || '');
  output = output
    .replace(/<span\s+class=["']lmi-wordmark-mark["'][^>]*>\s*LMI\s*<\/span>/gi, '')
    .replace(/\.lmi-wordmark-mark\{[^}]*\}/gi, '');

  if (!output.includes('id="lmi-official-identity-guard"')) {
    output = output.replace(/<\/head>/i, `${IDENTITY_CSS}</head>`);
  }

  return output;
}
