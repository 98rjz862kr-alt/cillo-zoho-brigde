import { getHubAssetSha256 } from './hub-asset-integrity.js';
import { getHubVisualProvenance } from './hub-provenance.js';

const HUB_DRAFT_PATTERN=/^hub-lmi-editions\/.+\.html$/i;
const ASSET_ROOT='hub-lmi-editions/assets/';

const ASSET_SCRIPT=`<script id="lmi-hub-visual-script">(function(){var q=location.search||'';document.querySelectorAll('img[data-lmi-asset]').forEach(function(img){var p='${ASSET_ROOT}'+img.getAttribute('data-lmi-asset');img.src='/atelier/file/'+encodeURIComponent(p)+q;});})();</script>`;

export function integrateHubVisuals(relativePath,html){
  const normalized=String(relativePath||'').replace(/^\/+/, '');
  if(!HUB_DRAFT_PATTERN.test(normalized))return html;
  let out=String(html||'');
  if(!out.includes('id="lmi-hub-visual-script"'))out=out.replace(/<\/body>/i,`${ASSET_SCRIPT}</body>`);
  return out;
}
