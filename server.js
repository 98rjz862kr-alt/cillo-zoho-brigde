import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPageDraft, getPageById, getPublishedPage, listPages, setPageStatus, updatePageDraft, upsertSite } from './store.js';
import { generatePageWithAI } from './ai.js';
import { isAuthorized, sanitizePageHtml } from './security.js';

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
  } catch {
    // A .env file is optional. Production can provide environment variables directly.
  }
}

function pageShell({ title, metaDescription, html }) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDescription || '')}" />
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #111827; background: #ffffff; }
    main { max-width: 1100px; margin: 0 auto; padding: 48px 20px; }
    section { margin: 0 0 40px; }
    h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: 1.05; margin: 0 0 20px; }
    h2 { font-size: clamp(1.4rem, 3vw, 2.4rem); margin: 32px 0 12px; }
    p, li { font-size: 1.05rem; line-height: 1.65; }
    a.button, .button { display: inline-block; padding: 12px 18px; border-radius: 8px; background: #111827; color: white; text-decoration: none; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 16px 0; }
  </style>
</head>
<body>
  <main>${html}</main>
</body>
</html>`;
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
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...headers });
  res.end(html);
}

function sendText(res, text, status = 200, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...headers });
  res.end(text);
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
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
    if (raw.length > 2 * 1024 * 1024) {
      throw new Error('Request body is too large');
    }
  }

  if (!raw) return {};

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) return JSON.parse(raw);
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }

  return {};
}

function adminLoginPage() {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cillo Zoho Bridge</title>
  <style>body{font-family:system-ui;margin:40px;max-width:560px}input,button{font:inherit;padding:10px;margin:6px 0;width:100%;box-sizing:border-box}button{background:#111827;color:#fff;border:0;border-radius:8px}.error{color:#b91c1c}</style></head><body>
  <h1>Cillo Zoho Bridge</h1>
  <p>Entrez le mot de passe admin local pour afficher les brouillons et validations.</p>
  <form method="post" action="/admin">
    <input name="password" type="password" placeholder="Mot de passe admin" required />
    <button>Ouvrir l'atelier</button>
  </form>
  </body></html>`;
}

function adminPage(pages) {
  const rows = pages.map((p) => `
    <tr>
      <td>${escapeHtml(p.siteSlug)}</td>
      <td>${escapeHtml(p.slug)}</td>
      <td>${escapeHtml(p.title)}</td>
      <td><strong>${escapeHtml(p.status)}</strong></td>
      <td>${p.version}</td>
      <td>
        <a href="/preview/${p.id}" target="_blank" rel="noopener">Preview</a> |
        <a href="/site/${p.siteSlug}/${p.slug}" target="_blank" rel="noopener">Public</a>
      </td>
      <td>
        <form method="post" action="/admin/pages/${p.id}/review"><input name="password" type="password" placeholder="password" required /><button>Review</button></form>
        <form method="post" action="/admin/pages/${p.id}/approve"><input name="password" type="password" placeholder="password" required /><button>Approve</button></form>
        <form method="post" action="/admin/pages/${p.id}/publish"><input name="password" type="password" placeholder="password" required /><label><input name="confirmPublish" type="checkbox" value="yes" required /> Confirm publish</label><button>Publish</button></form>
      </td>
    </tr>`).join('');

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cillo Zoho Bridge</title>
  <style>
    body{font-family:system-ui;margin:40px;color:#111827}
    input,textarea{width:100%;padding:8px;margin:6px 0;box-sizing:border-box}
    button{padding:8px 12px;margin:4px 0;border:0;border-radius:8px;background:#111827;color:#fff}
    table{border-collapse:collapse;width:100%;margin-top:24px}
    td,th{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
    .box{border:1px solid #ddd;border-radius:8px;padding:16px;margin:16px 0}
    td form{display:grid;gap:4px;margin-bottom:8px;max-width:220px}
    label{font-size:.9rem}
  </style></head><body>
  <h1>Cillo Zoho Bridge</h1>
  <p>Atelier de brouillons. La page publique ne s'affiche que quand son statut est <code>published</code>.</p>

  <div class="box">
    <h2>Create a manual draft</h2>
    <form method="post" action="/admin/pages">
      <input name="password" type="password" placeholder="Admin password" required />
      <input name="siteSlug" value="main" placeholder="site slug" />
      <input name="slug" placeholder="page slug, e.g. accueil" required />
      <input name="title" placeholder="title" required />
      <input name="metaTitle" placeholder="meta title" />
      <input name="metaDescription" placeholder="meta description" />
      <textarea name="html" rows="8" placeholder="HTML content" required></textarea>
      <button>Create draft</button>
    </form>
  </div>

  <div class="box">
    <h2>Generate draft with OpenAI</h2>
    <form method="post" action="/admin/pages/generate">
      <input name="password" type="password" placeholder="Admin password" required />
      <input name="siteSlug" value="main" placeholder="site slug" />
      <input name="siteName" placeholder="site name" required />
      <input name="pageType" placeholder="homepage, services, about, contact..." required />
      <textarea name="businessDescription" rows="5" placeholder="Describe the business" required></textarea>
      <button>Generate draft</button>
    </form>
  </div>

  <h2>Pages</h2>
  <table><thead><tr><th>Site</th><th>Slug</th><th>Title</th><th>Status</th><th>Version</th><th>Links</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;
}

function requireAdmin(req, res, query, body) {
  if (!isAuthorized({ headers: req.headers, query, body })) {
    sendJson(res, { error: 'Unauthorized. Provide x-admin-password header or password form field.' }, 401);
    return false;
  }
  return true;
}

function renderOpenApi() {
  const raw = readFileSync(path.join(rootDir, 'openapi.yaml'), 'utf8');
  return raw
    .replaceAll('https://YOUR-BRIDGE-DOMAIN.com', publicBaseUrl)
    .replaceAll('https://cillo-zoho-bridge.onrender.com', publicBaseUrl);
}

async function handleRequest(req, res) {
  const url = new URL(req.url, publicBaseUrl);
  const query = Object.fromEntries(url.searchParams.entries());
  const segments = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/') {
    return redirect(res, '/admin');
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, {
      ok: true,
      service: 'cillo-zoho-bridge',
      adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== 'change-me'),
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
    });
  }

  if (req.method === 'GET' && (url.pathname === '/openapi.yaml' || url.pathname === '/docs/openapi.yaml')) {
    return sendText(res, renderOpenApi(), 200, { 'content-type': 'application/yaml; charset=utf-8' });
  }

  if (req.method === 'GET' && url.pathname === '/admin') {
    if (!isAuthorized({ headers: req.headers, query })) return sendHtml(res, adminLoginPage());
    return sendHtml(res, adminPage(await listPages()));
  }

  if (req.method === 'GET' && segments[0] === 'preview' && segments[1]) {
    const page = await getPageById(segments[1]);
    if (!page) return sendText(res, 'Page not found', 404);
    const statusHtml = `<div class="card"><strong>Status:</strong> ${escapeHtml(page.status)} | <strong>Version:</strong> ${page.version}</div>`;
    return sendHtml(res, pageShell({ title: `[Preview] ${page.title}`, metaDescription: page.metaDescription, html: `${statusHtml}${page.html}` }));
  }

  if (req.method === 'GET' && segments[0] === 'site' && segments[1] && segments[2]) {
    const page = await getPublishedPage(segments[1], segments[2]);
    if (!page) return sendText(res, 'Page not published', 404);
    return sendHtml(
      res,
      pageShell({ title: page.metaTitle || page.title, metaDescription: page.metaDescription, html: page.html }),
      200,
      { 'content-security-policy': 'frame-ancestors *' }
    );
  }

  const body = await parseBody(req);

  if (req.method === 'POST' && url.pathname === '/admin') {
    if (!isAuthorized({ headers: req.headers, query, body })) return sendHtml(res, adminLoginPage(), 401);
    return sendHtml(res, adminPage(await listPages()));
  }

  if (req.method === 'POST' && url.pathname === '/admin/pages') {
    if (!requireAdmin(req, res, query, body)) return;
    await upsertSite({ slug: body.siteSlug || 'main', name: body.siteSlug || 'main' });
    const page = await createPageDraft({
      siteSlug: body.siteSlug || 'main',
      slug: body.slug,
      title: body.title,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      html: sanitizePageHtml(body.html),
      markdown: body.markdown || ''
    });
    return redirect(res, `/preview/${page.id}`);
  }

  if (req.method === 'POST' && url.pathname === '/admin/pages/generate') {
    if (!requireAdmin(req, res, query, body)) return;
    const generated = await generatePageWithAI({
      siteName: body.siteName,
      businessDescription: body.businessDescription,
      pageType: body.pageType,
      language: 'fr'
    });
    const page = await createPageDraft({
      siteSlug: body.siteSlug || 'main',
      ...generated,
      html: sanitizePageHtml(generated.html)
    });
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
    if (body.confirmPublish !== 'yes') throw new Error('Publication requires explicit confirmation in the admin form');
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

server.listen(port, '0.0.0.0', () => {
  console.log(`Cillo Zoho Bridge running on ${publicBaseUrl}`);
});
