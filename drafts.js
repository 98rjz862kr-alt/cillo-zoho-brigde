import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decorateHubDraft } from './hub-premium.js';
import { finalizeHubDraft } from './hub-finalize.js';
import { enforceOfficialHubIdentity } from './hub-identity.js';
import { integrateHubVisuals } from './hub-visuals.js';
import { stabilizeHubRuntime } from './hub-stability.js';
import { enhanceHubAccessibility } from './hub-accessibility.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DRAFT_ROOT = path.join(__dirname, 'drafts');
const ASSET_MIME_TYPES = new Map([
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
]);

function walk(directory, prefix = '') {
  let entries = [];
  try { entries = readdirSync(directory, { withFileTypes: true }); } catch { return []; }
  return entries.flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolutePath, relativePath);
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.html')) return [];
    const html = readFileSync(absolutePath, 'utf8');
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = (titleMatch?.[1] || entry.name.replace(/\.html$/i, '')).replace(/\s+/g, ' ').trim();
    return [{ relativePath, title, project: relativePath.split('/')[0] || 'brouillons', size: statSync(absolutePath).size }];
  });
}

function resolveDraftPath(relativePath, allowedExtensions) {
  const decoded = decodeURIComponent(String(relativePath || '')).replace(/^\/+/, '');
  if (!decoded) return null;
  const extension = path.extname(decoded).toLowerCase();
  if (!allowedExtensions.has(extension)) return null;
  const absolutePath = path.resolve(DRAFT_ROOT, decoded);
  const rootWithSeparator = `${path.resolve(DRAFT_ROOT)}${path.sep}`;
  if (!absolutePath.startsWith(rootWithSeparator)) return null;
  try { if (!statSync(absolutePath).isFile()) return null; } catch { return null; }
  return { decoded, absolutePath, extension };
}

function inlinePreviewAssets(relativeHtmlPath, html) {
  const htmlDir = path.dirname(path.join(DRAFT_ROOT, relativeHtmlPath));
  return html.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (full, prefix, src, suffix) => {
    if (/^(?:data:|https?:|\/)/i.test(src)) return full;
    let assetPath = path.resolve(htmlDir, src);
    if (!assetPath.startsWith(`${path.resolve(DRAFT_ROOT)}${path.sep}`)) return full;
    try {
      if (path.basename(assetPath) === 'lmi-logo-officiel.svg') {
        const webpPath = path.join(path.dirname(assetPath), 'lmi-logo-main.webp');
        if (statSync(webpPath).isFile()) return `${prefix}data:image/webp;base64,${readFileSync(webpPath).toString('base64')}${suffix}`;
      }
      const ext = path.extname(assetPath).toLowerCase();
      const mime = ASSET_MIME_TYPES.get(ext);
      if (!mime || !statSync(assetPath).isFile()) return full;
      if (ext === '.svg') return `${prefix}data:image/svg+xml;base64,${readFileSync(assetPath).toString('base64')}${suffix}`;
      return `${prefix}data:${mime};base64,${readFileSync(assetPath).toString('base64')}${suffix}`;
    } catch { return full; }
  });
}

export function listDraftFiles() {
  return walk(DRAFT_ROOT).sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'fr'));
}

export function readDraftHtml(relativePath) {
  const resolved = resolveDraftPath(relativePath, new Set(['.html']));
  if (!resolved) return null;
  try {
    const rawHtml = readFileSync(resolved.absolutePath, 'utf8');
    const html = inlinePreviewAssets(resolved.decoded, rawHtml);
    const decorated = decorateHubDraft(resolved.decoded, html);
    const finalized = finalizeHubDraft(resolved.decoded, decorated);
    const identified = enforceOfficialHubIdentity(resolved.decoded, finalized);
    const visualized = integrateHubVisuals(resolved.decoded, identified);
    const stabilized = stabilizeHubRuntime(resolved.decoded, html, visualized);
    return enhanceHubAccessibility(resolved.decoded, stabilized);
  } catch { return null; }
}

export function readDraftAsset(relativePath) {
  const resolved = resolveDraftPath(relativePath, new Set(ASSET_MIME_TYPES.keys()));
  if (!resolved) return null;
  try { return { content: readFileSync(resolved.absolutePath), contentType: ASSET_MIME_TYPES.get(resolved.extension) || 'application/octet-stream' }; }
  catch { return null; }
}
