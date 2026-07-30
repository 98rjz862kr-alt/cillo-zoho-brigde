import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPageDraft, getPageById, getPublishedPage, listPages, setPageStatus, updatePageDraft, upsertSite } from './store.js';
import { generatePageWithAI } from './ai.js';
import { isAuthorized, sanitizePageHtml } from './security.js';
import { listDraftFiles, readDraftHtml } from './drafts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
loadEnv(path.join(rootDir, '.env'));

const port = process.env.PORT || 3000;
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).replace(/\/$/, '');

function loadEnv(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sendHtml(res, html, status = 200, headers = {}) {
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'x-robots-tag': 'noindex, nofollow, noarchive',
    'cache-control': 'no-store',
    ...headers
  });
  res.end(html);
}

function sendText(res, text, status = 200, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...headers });
  res.end(text);
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(data, null, 2));
}

function redirect(res, location) {
  res.writeHead(303, { location });
  res.end();
}

async function parseBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return {};
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 8 * 1024 * 1024) throw new Error('Request body is too large');
  }
  if (!raw) return {};
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) return JSON.parse(raw);
  if (contentType.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw).entries());
  return {};
}

function pageShell({ title, metaDescription, html }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(metaDescription || '')}"><style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111827;background:#fff}main{max-width:1100px;margin:auto;padding:48px 20px}.card{border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin:16px 0}</style></head><body><main>${html}</main></body></html>`;
}

function loginPage(message = '') {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI — Atelier</title><style>body{font-family:system-ui;margin:40px;max-width:580px;color:#172238}input,button{font:inherit;padding:12px;margin:7px 0;width:100%;box-sizing:border-box}button{background:#143b7d;color:#fff;border:0;border-radius:8px}.note{color:#75553f}</style></head><body><h1>Bridge LMI</h1><p>Atelier interne de brouillons.</p>${message ? `<p class="note">${escapeHtml(message)}</p>` : ''}<form method="post" action="/atelier"><input name="password" type="password" placeholder="Mot de passe administrateur" required><button>Ouvrir les brouillons</button></form></body></html>`;
}

function atelierPage(drafts, password) {
  const token = encodeURIComponent(password || '');
  const cards = drafts.map((draft) => `<article><div><strong>${escapeHtml(draft.title)}</strong><small>${escapeHtml(draft.relativePath)} · ${Math.ceil(draft.size / 1024)} Ko</small></div><a href="/atelier/file/${encodeURIComponent(draft.relativePath)}?password=${token}" target="_blank" rel="noopener">Ouvrir le BAT</a></article>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI — Brouillons</title><style>:root{--bleu:#143b7d;--ocre:#cc7722;--ivoire:#f7f1e6;--encre:#1e2430}*{box-sizing:border-box}body{margin:0;background:#ece9e2;color:var(--encre);font-family:Arial,sans-serif}header{background:var(--bleu);color:#fff;padding:28px max(20px,5vw)}main{max-width:1120px;margin:28px auto;padding:0 18px}.status{background:var(--ivoire);border-left:6px solid var(--ocre);padding:16px;margin-bottom:20px}article{display:flex;justify-content:space-between;gap:20px;align-items:center;background:#fff;border-radius:12px;padding:20px;margin:12px 0;box-shadow:0 5px 18px #0001}small{display:block;color:#75553f;margin-top:7px}a{background:var(--bleu);color:#fff;text-decoration:none;padding:11px 15px;border-radius:8px;white-space:nowrap}@media(max-width:700px){article{align-items:flex-start;flex-direction:column}}</style></head><body><header><h1>LES MOTS IMAGES — ATELIER BROUILLON</h1><p>Bibliothèque interne · aucune publication · aucun référencement</p></header><main><div class="status"><strong>${drafts.length} BAT accessibles.</strong> Les documents sont lus directement depuis le dépôt Bridge et restent séparés des pages publiques.</div>${cards || '<p>Aucun BAT disponible.</p>'}</main></body></html>`;
}

function adminPage(pages, password = '') {
  const atelierUrl = `/atelier?password=${encodeURIComponent(password)}`;
  const rows = pages.map((p) => `<tr><td>${escapeHtml(p.siteSlug)}</td><td>${escapeHtml(p.slug)}</td><td>${escapeHtml(p.title)}</td><td><strong>${escapeHtml(p.status)}</strong></td><td>${p.version}</td><td><a href="/preview/${p.id}" target="_blank" rel="noopener">Aperçu</a></td></tr>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI</title><style>body{font-family:system-ui;margin:40px;color:#111827}a.button{display:inline-block;background:#143b7d;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none}table{border-collapse:collapse;width:100%;margin-top:24px}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h1>Bridge LMI</h1><p>Atelier interne. Les brouillons ne sont ni publiés ni référencés.</p><p><a class="button" href="${atelierUrl}">Ouvrir la bibliothèque BAT</a></p><h2>Pages CMS</h2><table><thead><tr><th>Site</th><th>Slug</th><th>Titre</th><th>Statut</th><th>Version</th><th>Aperçu</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function requireAdmin(req, res, query, body) {
  if (!isAuthorized({ headers: req.headers, query, body })) {
    sendJson(res, { error: 'Unauthorized' }, 401);
    return false;
  }
  return true;
}

function renderOpenApi() {
  return readFileSync(path.join(rootDir, 'openapi.yaml'), 'utf8')
    .replaceAll('https://YOUR-BRIDGE-DOMAIN.com', publicBaseUrl)
    .replaceAll('https://cillo-zoho-bridge.onrender.com', publicBaseUrl);
}

async function handleRequest(req, res) {
  const url = new URL(req.url, publicBaseUrl);
  const query = Object.fromEntries(url.searchParams.entries());
  const segments = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/') return redirect(res, '/atelier');
  if (req.method === 'GET' && url.pathname === '/health') return sendJson(res, { ok: true, service: 'cillo-zoho-bridge', drafts: listDraftFiles().length, adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== 'change-me'), openaiConfigured: Boolean(process.env.OPENAI_API_KEY) });
  if (req.method === 'GET' && (url.pathname === '/openapi.yaml' || url.pathname === '/docs/openapi.yaml')) return sendText(res, renderOpenApi(), 200, { 'content-type': 'application/yaml; charset=utf-8' });

  if (req.method === 'GET' && url.pathname === '/atelier') {
    if (!isAuthorized({ headers: req.headers, query })) return sendHtml(res, loginPage());
    return sendHtml(res, atelierPage(listDraftFiles(), query.password));
  }

  if (req.method === 'GET' && segments[0] === 'atelier' && segments[1] === 'file' && segments[2]) {
    if (!isAuthorized({ headers: req.headers, query })) return sendHtml(res, loginPage('Accès au BAT protégé.'));
    const html = readDraftHtml(decodeURIComponent(segments.slice(2).join('/')));
    if (!html) return sendText(res, 'BAT introuvable', 404);
    return sendHtml(res, html, 200, { 'content-security-policy': "default-src 'self' 'unsafe-inline' data:; img-src 'self' data: https:; frame-ancestors 'self'" });
  }

  if (req.method === 'GET' && url.pathname === '/admin') {
    if (!isAuthorized({ headers: req.headers, query })) return sendHtml(res, loginPage());
    return sendHtml(res, adminPage(await listPages(), query.password));
  }

  if (req.method === 'GET' && segments[0] === 'preview' && segments[1]) {
    const page = await getPageById(segments[1]);
    if (!page) return sendText(res, 'Page not found', 404);
    return sendHtml(res, pageShell({ title: `[Preview] ${page.title}`, metaDescription: page.metaDescription, html: `<div class="card"><strong>Status:</strong> ${escapeHtml(page.status)} | <strong>Version:</strong> ${page.version}</div>${page.html}` }));
  }

  if (req.method === 'GET' && segments[0] === 'site' && segments[1] && segments[2]) {
    const page = await getPublishedPage(segments[1], segments[2]);
    if (!page) return sendText(res, 'Page not published', 404);
    return sendHtml(res, pageShell({ title: page.metaTitle || page.title, metaDescription: page.metaDescription, html: page.html }), 200, { 'content-security-policy': 'frame-ancestors *' });
  }

  const body = await parseBody(req);

  if (req.method === 'POST' && url.pathname === '/atelier') {
    if (!isAuthorized({ headers: req.headers, query, body })) return sendHtml(res, loginPage('Mot de passe incorrect.'), 401);
    return sendHtml(res, atelierPage(listDraftFiles(), body.password));
  }

  if (req.method === 'POST' && url.pathname === '/admin') {
    if (!isAuthorized({ headers: req.headers, query, body })) return sendHtml(res, loginPage('Mot de passe incorrect.'), 401);
    return sendHtml(res, adminPage(await listPages(), body.password));
  }

  if (req.method === 'POST' && url.pathname === '/admin/pages') {
    if (!requireAdmin(req, res, query, body)) return;
    await upsertSite({ slug: body.siteSlug || 'main', name: body.siteSlug || 'main' });
    const page = await createPageDraft({ siteSlug: body.siteSlug || 'main', slug: body.slug, title: body.title, metaTitle: body.metaTitle, metaDescription: body.metaDescription, html: sanitizePageHtml(body.html), markdown: body.markdown || '' });
    return redirect(res, `/preview/${page.id}`);
  }

  if (req.method === 'POST' && url.pathname === '/admin/pages/generate') {
    if (!requireAdmin(req, res, query, body)) return;
    const generated = await generatePageWithAI({ siteName: body.siteName, businessDescription: body.businessDescription, pageType: body.pageType, language: 'fr' });
    const page = await createPageDraft({ siteSlug: body.siteSlug || 'main', ...generated, html: sanitizePageHtml(generated.html) });
    return redirect(res, `/preview/${page.id}`);
  }

  if (req.method === 'POST' && segments[0] === 'admin' && segments[1] === 'pages' && segments[2] && segments[3] === 'review') {
    if (!requireAdmin(req, res, query, body)) return;
    await setPageStatus(segments[2], 'review');
    return redirect(res, '/admin');
  }

  if (req.method === 'POST' && segments[0] === 'admin' && segments[1] === 'pages' && segments[2] && segments[3] === 'approve') {
    if (!requireAdmin(req, res, query, body)) return;
    await setPageStatus(segments[2], 'approved');
    return redirect(res, '/admin');
  }

  if (req.method === 'POST' && segments[0] === 'admin' && segments[1] === 'pages' && segments[2] && segments[3] === 'publish') {
    if (!requireAdmin(req, res, query, body)) return;
    if (body.confirmPublish !== 'yes') throw new Error('Publication requires explicit confirmation');
    await setPageStatus(segments[2], 'published');
    return redirect(res, '/admin');
  }

  if (req.method === 'GET' && url.pathname === '/api/pages') {
    if (!requireAdmin(req, res, query, body)) return;
    return sendJson(res, { pages: await listPages({ siteSlug: query.siteSlug }) });
  }

  if (req.method === 'POST' && url.pathname === '/api/pages/draft') {
    if (!requireAdmin(req, res, query, body)) return;
    await upsertSite({ slug: body.siteSlug || 'main', name: body.siteSlug || 'main' });
    const page = await createPageDraft({ ...body, html: sanitizePageHtml(body.html) });
    return sendJson(res, { page, previewUrl: `${publicBaseUrl}/preview/${page.id}` });
  }

  if (req.method === 'PATCH' && segments[0] === 'api' && segments[1] === 'pages' && segments[2]) {
    if (!requireAdmin(req, res, query, body)) return;
    const patch = { ...body };
    if (patch.html) patch.html = sanitizePageHtml(patch.html);
    const page = await updatePageDraft(segments[2], patch);
    return sendJson(res, { page, previewUrl: `${publicBaseUrl}/preview/${page.id}` });
  }

  if (req.method === 'POST' && segments[0] === 'api' && segments[1] === 'pages' && segments[2] && segments[3] === 'review') {
    if (!requireAdmin(req, res, query, body)) return;
    const page = await setPageStatus(segments[2], 'review');
    return sendJson(res, { page, previewUrl: `${publicBaseUrl}/preview/${page.id}` });
  }

  if (req.method === 'POST' && segments[0] === 'api' && segments[1] === 'pages' && segments[2] && segments[3] === 'publish') {
    if (!requireAdmin(req, res, query, body)) return;
    const page = await setPageStatus(segments[2], 'published');
    return sendJson(res, { page, publicUrl: `${publicBaseUrl}/site/${page.siteSlug}/${page.slug}` });
  }

  if (req.method === 'POST' && url.pathname === '/api/pages/generate') {
    if (!requireAdmin(req, res, query, body)) return;
    const generated = await generatePageWithAI(body);
    const page = await createPageDraft({ siteSlug: body.siteSlug || 'main', ...generated, html: sanitizePageHtml(generated.html) });
    return sendJson(res, { page, previewUrl: `${publicBaseUrl}/preview/${page.id}` });
  }

  return sendText(res, 'Not found', 404);
}

const server = createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, { error: error.message || 'Unknown error' }, 400);
  }
});

server.listen(port, '0.0.0.0', () => console.log(`Cillo Zoho Bridge running on ${publicBaseUrl}`));
