import { createServer, request as httpRequest } from 'http';
import { spawn } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);
const draftRoot = path.join(rootDir, 'drafts');
const port = Number(process.env.PORT || 3000);
const internalPort = port + 1;

const core = spawn(process.execPath, [path.join(rootDir, 'server.js')], {
  env: { ...process.env, PORT: String(internalPort) },
  stdio: ['ignore', 'inherit', 'inherit']
});

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function walk(directory, prefix = '') {
  let entries = [];
  try { entries = readdirSync(directory, { withFileTypes: true }); } catch { return []; }
  return entries.flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolutePath, relativePath);
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.html')) return [];
    const html = readFileSync(absolutePath, 'utf8');
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || entry.name.replace(/\.html$/i, '')).replace(/\s+/g, ' ').trim();
    return [{ relativePath, title, size: statSync(absolutePath).size }];
  });
}

function sendHtml(res, html, status = 200) {
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'x-robots-tag': 'noindex, nofollow, noarchive',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self' 'unsafe-inline' data: https:; img-src 'self' data: https:; frame-ancestors 'self'"
  });
  res.end(html);
}

function atelierPage() {
  const drafts = walk(draftRoot).sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'fr'));
  const cards = drafts.map((draft) => `<article><div><strong>${escapeHtml(draft.title)}</strong><small>${escapeHtml(draft.relativePath)} · ${Math.ceil(draft.size / 1024)} Ko</small></div><a href="/atelier/file/${encodeURIComponent(draft.relativePath)}" target="_blank" rel="noopener">Ouvrir le BAT</a></article>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Bridge LMI — Brouillons</title><style>:root{--bleu:#143b7d;--nuit:#0f2747;--ocre:#cc7722;--ivoire:#f6f1e8;--sable:#75553f}*{box-sizing:border-box}body{margin:0;background:#ece9e2;color:#172238;font-family:Arial,sans-serif}header{background:linear-gradient(135deg,var(--nuit),var(--bleu));color:#fff;padding:35px max(20px,5vw);border-bottom:5px solid #d4af37}header h1{font-family:Georgia,serif;margin:0 0 8px;font-size:clamp(2rem,5vw,4rem)}main{max-width:1120px;margin:28px auto;padding:0 18px}.status{background:var(--ivoire);border-left:6px solid var(--ocre);padding:18px;margin-bottom:22px;border-radius:10px}article{display:flex;justify-content:space-between;gap:20px;align-items:center;background:#fff;border-radius:14px;padding:22px;margin:13px 0;box-shadow:0 8px 24px #0001}small{display:block;color:var(--sable);margin-top:7px}a{background:var(--bleu);color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;white-space:nowrap;font-weight:700}@media(max-width:700px){article{align-items:flex-start;flex-direction:column}}</style></head><body><header><h1>LES MOTS IMAGES — BRIDGE</h1><p>Atelier de brouillons en accès direct · aucun code · aucun référencement</p></header><main><div class="status"><strong>${drafts.length} BAT accessibles.</strong> Les documents sont lus directement depuis le dépôt Bridge.</div>${cards || '<p>Aucun BAT disponible.</p>'}</main></body></html>`;
}

function serveDraft(pathname, res) {
  const encoded = pathname.slice('/atelier/file/'.length);
  let decoded = '';
  try { decoded = decodeURIComponent(encoded).replace(/^\/+/, ''); } catch { return sendHtml(res, '<h1>Chemin invalide</h1>', 400); }
  if (!decoded.toLowerCase().endsWith('.html')) return sendHtml(res, '<h1>BAT introuvable</h1>', 404);
  const absolutePath = path.resolve(draftRoot, decoded);
  const rootWithSeparator = `${path.resolve(draftRoot)}${path.sep}`;
  if (!absolutePath.startsWith(rootWithSeparator)) return sendHtml(res, '<h1>Accès refusé</h1>', 403);
  try {
    if (!statSync(absolutePath).isFile()) throw new Error('not a file');
    return sendHtml(res, readFileSync(absolutePath, 'utf8'));
  } catch { return sendHtml(res, '<h1>BAT introuvable</h1>', 404); }
}

function proxy(req, res) {
  const upstream = httpRequest({ hostname: '127.0.0.1', port: internalPort, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${internalPort}` } }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on('error', () => {
    res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ error: 'Bridge core is starting' }));
  });
  req.pipe(upstream);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (req.method === 'GET' && url.pathname === '/') { res.writeHead(303, { location: '/atelier' }); return res.end(); }
  if (req.method === 'GET' && url.pathname === '/atelier') return sendHtml(res, atelierPage());
  if (req.method === 'GET' && url.pathname.startsWith('/atelier/file/')) return serveDraft(url.pathname, res);
  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
    const drafts = walk(draftRoot).length;
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, service: 'cillo-zoho-bridge', publicAtelier: true, drafts }));
  }
  return proxy(req, res);
});

server.listen(port, '0.0.0.0', () => console.log(`Bridge public atelier running on port ${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { core.kill(signal); server.close(() => process.exit(0)); });
