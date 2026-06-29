import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, 'data', 'pages.json');

async function ensureStore() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    const initial = { sites: [{ id: 'main', slug: 'main', name: 'Main Zoho Site' }], pages: [] };
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));
  }
}

export async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function writeStore(data) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function listPages({ siteSlug } = {}) {
  const db = await readStore();
  return db.pages.filter((p) => !siteSlug || p.siteSlug === siteSlug);
}

export async function getPageById(id) {
  const db = await readStore();
  return db.pages.find((p) => p.id === id) || null;
}

export async function getPublishedPage(siteSlug, slug) {
  const db = await readStore();
  return db.pages.find((p) => p.siteSlug === siteSlug && p.slug === slug && p.status === 'published') || null;
}

export async function upsertSite({ slug, name }) {
  const db = await readStore();
  let site = db.sites.find((s) => s.slug === slug);
  if (!site) {
    site = { id: randomUUID(), slug, name: name || slug };
    db.sites.push(site);
    await writeStore(db);
  }
  return site;
}

export async function createPageDraft(input) {
  const db = await readStore();
  const now = new Date().toISOString();
  const page = {
    id: randomUUID(),
    siteSlug: input.siteSlug || 'main',
    slug: input.slug,
    title: input.title,
    metaTitle: input.metaTitle || input.title,
    metaDescription: input.metaDescription || '',
    html: input.html || '',
    markdown: input.markdown || '',
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
    reviewedAt: null,
    approvedAt: null,
    publishedAt: null,
    history: [{ at: now, action: 'created', status: 'draft' }]
  };
  db.pages.push(page);
  await writeStore(db);
  return page;
}

export async function updatePageDraft(id, patch) {
  const db = await readStore();
  const page = db.pages.find((p) => p.id === id);
  if (!page) throw new Error('Page not found');
  if (page.status !== 'draft') throw new Error('Only draft pages can be edited. Create a new draft version for reviewed, approved, or published pages.');
  const now = new Date().toISOString();
  Object.assign(page, {
    ...patch,
    version: page.version + 1,
    updatedAt: now
  });
  page.history.push({ at: now, action: 'updated', status: page.status });
  await writeStore(db);
  return page;
}

export async function setPageStatus(id, nextStatus) {
  const db = await readStore();
  const page = db.pages.find((p) => p.id === id);
  if (!page) throw new Error('Page not found');
  const now = new Date().toISOString();

  if (nextStatus === 'review' && page.status !== 'draft') {
    throw new Error('Only draft pages can be submitted for review');
  }
  if (nextStatus === 'approved' && page.status !== 'review') {
    throw new Error('Only pages in review can be approved');
  }
  if (nextStatus === 'published' && page.status !== 'approved') {
    throw new Error('Only approved pages can be published');
  }

  page.status = nextStatus;
  page.updatedAt = now;
  if (nextStatus === 'review') page.reviewedAt = now;
  if (nextStatus === 'approved') page.approvedAt = now;
  if (nextStatus === 'published') page.publishedAt = now;
  page.history.push({ at: now, action: `status:${nextStatus}`, status: nextStatus });
  await writeStore(db);
  return page;
}
