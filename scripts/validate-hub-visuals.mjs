import { readDraftAsset, readDraftHtml } from '../drafts.js';
import { getHubVisualProvenance, listHubVisualProvenance } from '../hub-provenance.js';

const logo=readDraftAsset('hub-lmi-editions/assets/logo-lmi-hub.webp');
if(!logo?.content || logo.content.length<8000)throw new Error('Official LMI logo asset is missing or too small');
if(logo.contentType!=='image/webp')throw new Error('Hub official logo must be served as WebP');
if(!/^[a-f0-9]{64}$/.test(logo.sha256||''))throw new Error('Official logo has no computed SHA-256');
const provenance=getHubVisualProvenance('logo-lmi-hub.webp');
if(provenance.sourceDriveId!=='1tRvVtzTrDsaYg59cxmtdu5ITLv02Vrgy')throw new Error('Logo Drive provenance mismatch');
if(provenance.sourceSha256!=='f20a38b1106c04f1265831474b60d7f607776fda3e98ad0e2db00c02622566b3')throw new Error('Logo source SHA-256 mismatch');
if(listHubVisualProvenance().length!==1)throw new Error('Only the authorized institutional logo may be in the active Hub visual inventory');

const pages=['01-accueil.html','11-catalogue-editorial.html','12-catalogue-bd-adaptations.html','13-univers-illustres-da.html','31-le-boa-totem-de-soya.html','32-le-fleuve-sans-nom.html'];
for(const page of pages){
  const html=readDraftHtml(`hub-lmi-editions/${page}`)||'';
  if(!html.includes('data-lmi-asset="logo-lmi-hub.webp"'))throw new Error(`Official logo missing from ${page}`);
  if(!html.includes(`data-lmi-sha256="${logo.sha256}"`))throw new Error(`Official logo SHA-256 marker missing from ${page}`);
  if(!html.includes(`data-lmi-drive-id="${provenance.sourceDriveId}"`))throw new Error(`Logo Drive ID missing from ${page}`);
  if(!html.includes(`data-lmi-source-sha256="${provenance.sourceSha256}"`))throw new Error(`Logo source SHA-256 missing from ${page}`);
  if(/data-lmi-asset="(?:boa-totem-soya|le-fleuve-sans-nom)\.webp"/i.test(html))throw new Error(`Rights-unconfirmed editorial cover leaked into ${page}`);
  if(/res\.cloudinary\.com|IMG_9559/i.test(html))throw new Error(`Untraced external image leaked into ${page}`);
  if(/EXPLORATION-REJETEE|NON-APPROUVE|placeholder/i.test(html))throw new Error(`Rejected or placeholder visual leaked into ${page}`);
}
console.log('Validated Hub visual integrity: active rendering is restricted to the SHA-256-bound institutional logo; rights-unconfirmed editorial covers and untraced external media are excluded.');
