import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const root = process.env.LMI_HUB_TEST_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { readDraftHtml } = await import(pathToFileURL(path.join(root, 'drafts.js')));
const contract = JSON.parse(readFileSync(path.join(root, 'socle-v2/contracts/client-facing-routes.v1.json'), 'utf8'));
const routes = contract.sites.editions.visitorRoutes;
const origin = 'https://navigation-fixture.invalid';
const query = '?navigation=test';
const failures = [];
let compiled = 0;
let pagers = 0;
let breadcrumbs = 0;
let rewriteChecks = 0;

const decode = value => String(value).replace(/&(amp|quot|apos|nbsp|lt|gt);/g,
  (_, name) => ({ amp: '&', quot: '"', apos: "'", nbsp: ' ', lt: '<', gt: '>' })[name]);
const plain = value => decode(String(value).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const navigationTitle = title => title.replace(/^(?:LMI Éditions|Les Mots Imagés)\s*[—–]\s*/, '')
  .replace(/\s*[—–]\s*(?:LMI Éditions|Les Mots Imagés)$/, '');
const draft = (file, hash = '') => '/atelier/file/' + encodeURIComponent('hub-lmi-editions/' + file) + query + hash;
const files = routes.map(route => path.posix.basename(route));
const pages = routes.map(route => {
  const html = readDraftHtml(route);
  assert.ok(html, `The existing public-base route must render: ${route}`);
  const title = plain(html.match(/<title\b[^>]*>([^]*?)<\/title>/i)?.[1] || '');
  const h1 = plain(html.match(/<h1\b[^>]*>([^]*?)<\/h1>/i)?.[1] || '');
  assert.ok(title && h1);
  return { route, html, title, h1, label: navigationTitle(title) };
});
assert.equal(routes.length, 32, 'This regression test covers the 32 Editions pages in the public base');
assert.equal(new Set(routes).size, routes.length);

// The fixture executes only the two emitted navigation scripts. It models DOM
// attributes, insertion and their exact selectors; it is not a browser or a
// claim that historical page copy, third-party links or layout were accepted.
function element(tag) {
  const node = {
    tagName: tag.toUpperCase(), attrs: new Map(), children: [], innerHTML: '', textContent: '', dataset: {}, style: {},
    getAttribute(name) { return this.attrs.get(name) ?? null; },
    setAttribute(name, value) { this.attrs.set(name, String(value)); },
    get className() { return this.getAttribute('class') || ''; },
    set className(value) { this.setAttribute('class', value); },
    get id() { return this.getAttribute('id') || ''; },
    set id(value) { this.setAttribute('id', value); },
    get href() { return this.getAttribute('href'); },
    set href(value) { this.setAttribute('href', value); },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    insertBefore(child, before) {
      const index = this.children.indexOf(before);
      this.children.splice(index < 0 ? this.children.length : index, 0, child);
      child.parentNode = this; return child;
    },
    closest() { return null; },
    querySelector(selector) {
      if (selector === '.lmi-runtime-card-number') return this.children.find(child => child.className === 'lmi-runtime-card-number') || null;
      throw new Error(`Unmodelled element selector: ${selector}`);
    },
  };
  node.classList = {
    contains(name) { return node.className.split(/\s+/).includes(name); },
    add(name) { node.className = [...new Set([...node.className.split(/\s+/).filter(Boolean), name])].join(' '); },
    remove(name) { node.className = node.className.split(/\s+/).filter(value => value !== name).join(' '); },
  };
  return node;
}

function fixture(page) {
  const h1 = element('h1'); h1.textContent = page.h1;
  const hero = element('section'); h1.closest = () => hero;
  const section = element('section');
  const grid = element('div'); grid.className = 'grid';
  const card = element('article'); card.className = 'card';
  grid.appendChild(card);
  const header = element('header'); header.setAttribute('data-lmi-shared-header', '');
  const main = element('main'); main.id = 'existing-main-target';
  const footer = element('footer');
  header.nextSibling = main;
  const body = element('body');
  body.dataset = {
    lmiShell: 'shared-v1',
    lmiRuntime: page.html.match(/<body\b[^>]*\bdata-lmi-runtime="([^"]+)"/i)?.[1],
  };
  body.appendChild(header); body.appendChild(main); body.appendChild(footer);
  body.firstChild = header;
  body.querySelector = selector => {
    if (selector === 'h1') return h1;
    if (selector === 'main') return main;
    if (selector === '[data-lmi-shared-header]' || selector === '[data-lmi-shared-header],.lmi-shell-nav') return header;
    if (selector === 'footer:not(.lmi-runtime-pager)') return footer;
    if (selector === '.lmi-skip-link') return body.children.find(child => child.className === 'lmi-skip-link') || null;
    if (selector === '.lmi-shell-title strong') return null;
    throw new Error(`Unmodelled body selector: ${selector}`);
  };
  body.querySelectorAll = selector => {
    if (selector === 'main section,body>section') return [section];
    if (selector === 'article,.card,.panel,.item,.pole,.axis,.offer,.feature,.bloc,.block,.notice,.scope,.note,.box,.tile') return [card];
    if (selector === 'img') return [];
    if (selector === '.grid') return [grid];
    if (selector === '.lmi-runtime-grid>.lmi-card-runtime') return [card];
    if (/^\.(?:cards|poles|axes|features|tiles|items|catalogue-grid|section-grid|work-grid|resource-grid|offer-grid)$/.test(selector)) return [];
    throw new Error(`Unmodelled body list selector: ${selector}`);
  };
  const cases = [
    ['/catalogue/#oeuvres', draft('11-catalogue-editorial.html', '#oeuvres')],
    ['/CATALOGUE/', draft('11-catalogue-editorial.html')],
    ['11-catalogue-editorial.html#oeuvres', draft('11-catalogue-editorial.html', '#oeuvres')],
    [origin + '/catalogue#oeuvres', draft('11-catalogue-editorial.html', '#oeuvres')],
    ['/atelier/file/hub-lmi-editions%2F11-catalogue-editorial.html#oeuvres', null],
    ['https://outside-fixture.invalid/catalogue#oeuvres', null],
    ['#existing-main-target', null],
    ['mailto:contact@example.invalid', null],
    ['tel:+33100000000', null],
  ].map(([href, expected]) => {
    const anchor = element('a'); anchor.href = href;
    return { anchor, original: href, expected: expected ?? href };
  });
  const document = {
    body, title: page.title, createElement: element,
    querySelectorAll(selector) {
      assert.equal(selector, 'a[href]', 'Only the emitted finalizer anchor selector is modelled');
      return cases.map(item => item.anchor);
    },
  };
  return { document, body, main, h1, grid, card, cases };
}

for (const [index, page] of pages.entries()) {
  try {
    const state = fixture(page);
    const emitted = [...page.html.matchAll(/<script\b[^>]*\bid="(lmi-premium-runtime-script|lmi-hub-final-script)"[^>]*>([^]*?)<\/script>/gi)];
    assert.equal(emitted.filter(match => match[1] === 'lmi-hub-final-script').length, 1);
    assert.equal(emitted.filter(match => match[1] === 'lmi-premium-runtime-script').length, index === 0 ? 0 : 1);
    for (const [, , script] of emitted) {
      assert.doesNotMatch(script, /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/, 'Generated code must preserve regex escapes without control characters');
      const compiledScript = new vm.Script(script); compiled++;
      compiledScript.runInNewContext({ document: state.document, URL, location: { origin, search: query } }, { timeout: 1000, contextCodeGeneration: { strings: false, wasm: false } });
    }
    for (const item of state.cases) {
      assert.equal(item.anchor.href, item.expected, `URL and fragment preservation for ${item.original}`);
      rewriteChecks++;
    }
    assert.equal(state.body.children.filter(node => node.className === 'lmi-page-rail').length, 0);
    assert.equal(state.body.children.filter(node => node.className === 'lmi-shell-nav').length, 0, 'The common shell must not be duplicated');
    assert.equal(state.card.children.filter(node => node.className === 'lmi-runtime-card-number').length, 0);
    const pager = state.body.children.filter(node => node.className === 'lmi-runtime-pager');
    const crumb = state.body.children.filter(node => node.className === 'lmi-route-breadcrumb');
    if (index === 0) {
      assert.equal(pager.length, 0); assert.equal(crumb.length, 0);
      continue;
    }
    assert.equal(pager.length, 1);
    const labels = [...pager[0].innerHTML.matchAll(/<strong\b[^>]*>([^]*?)<\/strong>/gi)].map(match => plain(match[1]));
    const previous = index - 1;
    const next = index + 1 < pages.length ? index + 1 : 0;
    assert.deepEqual(labels, [pages[previous].label, pages[next].label], 'Pager labels must be the titles in the unchanged public pages');
    const links = [...pager[0].innerHTML.matchAll(/\bhref="([^"]+)"/g)].map(match => decode(match[1]));
    assert.deepEqual(links, [draft(files[previous]), draft(files[0]), draft(files[next])]);
    pagers++;
    assert.equal(crumb.length, 1); assert.equal(crumb[0].tagName, 'NAV');
    assert.equal(crumb[0].getAttribute('aria-label'), 'Fil d’Ariane');
    assert.equal(crumb[0].children[0].href, draft(files[0]));
    assert.equal(crumb[0].children[0].textContent, 'LMI Éditions');
    assert.equal(crumb[0].children[1].getAttribute('aria-hidden'), 'true');
    assert.equal(crumb[0].children[2].getAttribute('aria-current'), 'page');
    assert.equal(crumb[0].children[2].textContent, state.h1.textContent);
    const skip = state.body.querySelector('.lmi-skip-link');
    assert.equal(skip.href, '#' + state.main.id, 'The inserted skip link must retain the existing main target');
    assert.ok(state.grid.classList.contains('lmi-runtime-grid'));
    assert.ok(state.card.classList.contains('lmi-card-runtime'));
    breadcrumbs++;
  } catch (error) { failures.push({ route: page.route, error: error.message }); }
}
console.log(JSON.stringify({ status: failures.length ? 'FAIL' : 'PASS', pages: pages.length, emittedScriptsCompiled: compiled, pagersChecked: pagers, breadcrumbsChecked: breadcrumbs, urlCasesChecked: rewriteChecks, scope: 'Exact emitted premium and finalizer JavaScript on the 32 unchanged public-base pages in a DOM fixture; no browser, content acceptance, publication or external-site check', failures }, null, 2));
if (failures.length) process.exitCode = 1;
