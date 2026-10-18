import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readDraftHtml, readDraftAsset } from '../drafts.js';
import { applySharedSiteShell, OFFICIAL_LOGO_PROVENANCE } from '../socle-v2/shared-shell.mjs';
import { renderHeader, renderFooter } from '../socle-v2/components/lmi-shell.mjs';
import { previewUrl } from '../socle-v2/preview-paths.mjs';

const contract = JSON.parse(readFileSync(new URL('../socle-v2/contracts/client-facing-routes.v1.json', import.meta.url), 'utf8'));
const markup = value => value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
const toPreview = route => `/atelier/file/${encodeURIComponent(route)}`;
const headings = value => [...markup(value).matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => match[1]);
const tokens = readFileSync(new URL('../socle-v2/styles/lmi-tokens.css', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../socle-v2/styles/socle.css', import.meta.url), 'utf8');
let pages = 0;
let logoChecks = 0;
let retainedLinks = 0;

for (const [siteId, site] of Object.entries(contract.sites)) {
  for (const route of site.visitorRoutes) {
    const raw = readFileSync(new URL(`../drafts/${route}`, import.meta.url), 'utf8');
    const adapted = applySharedSiteShell(route, raw);
    assert.deepEqual(headings(adapted), headings(raw), `${route}: shell must preserve the original H1, including hero headers`);
    assert.equal(applySharedSiteShell(route, adapted), adapted, `${route}: shell must be idempotent`);
    const html = readDraftHtml(route);
    assert.ok(html, `${route}: route must still render`);
    const dom = markup(html);
    assert.equal(headings(html).length, 1, `${route}: exactly one rendered H1`);
    assert.equal((dom.match(/<header\b/gi) || []).length, 1, `${route}: one header landmark`);
    assert.equal((dom.match(/data-lmi-shared-header=/g) || []).length, 1, `${route}: one common header`);
    assert.equal((dom.match(/data-lmi-shared-footer=/g) || []).length, 1, `${route}: one common footer`);
    assert.equal((dom.match(/<main\b/gi) || []).length, 1, `${route}: exactly one main landmark`);
    assert.equal((dom.match(/class="lmi-skip-link"/g) || []).length, 1, `${route}: one skip link`);
    const target = dom.match(/class="lmi-skip-link" href="#([^"]+)"/)?.[1];
    assert.ok(target && dom.includes(`id="${target}"`), `${route}: skip target exists`);
    assert.match(dom, /<main\b[^>]*tabindex="-1"/i, `${route}: main can receive keyboard focus`);
    assert.equal(html.match(/<style id="lmi-shared-tokens">([\s\S]*?)<\/style>/)?.[1], tokens, `${route}: common tokens are actually consumed`);
    assert.equal(html.match(/<style id="lmi-shared-shell-style">([\s\S]*?)<\/style>/)?.[1], styles, `${route}: common CSS is actually consumed`);
    const header = dom.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || '';
    assert.equal((header.match(/data-lmi-site-link=/g) || []).length, 4, `${route}: all four sites are reachable`);
    for (const [targetId, targetSite] of Object.entries(contract.sites)) {
      assert.ok(header.includes(`data-lmi-site-link="${targetId}" href="${toPreview(targetSite.home)}"`), `${route}: ${targetId} stays inside Bridge preview`);
    }
    assert.match(header, new RegExp(`data-lmi-site-link="${siteId}"[^>]*aria-current="true"`), `${route}: active site is distinguished from active page`);
    const footer = dom.match(/<footer\b[^>]*data-lmi-shared-footer=[\s\S]*?<\/footer>/i)?.[0] || '';
    for (const destination of [site.home, site.contactRoute, site.legalRoute]) assert.ok(footer.includes(toPreview(destination)), `${route}: common footer links to ${destination}`);
    const logo = header.match(/<img\b[^>]*>/)?.[0] || '';
    const logoPath = decodeURIComponent(logo.match(/src="\/atelier\/file\/([^"]+)"/)?.[1] || '');
    const asset = readDraftAsset(logoPath);
    assert.ok(asset, `${route}: shared logo is served`);
    assert.equal(createHash('sha256').update(asset.content).digest('hex'), OFFICIAL_LOGO_PROVENANCE.sha256, `${route}: shared logo bytes match provenance`);
    assert.ok(logo.includes(`data-lmi-sha256="${OFFICIAL_LOGO_PROVENANCE.sha256}"`) && logo.includes(`data-lmi-drive-id="${OFFICIAL_LOGO_PROVENANCE.driveId}"`), `${route}: correct PNG metadata`);
    assert.ok(!dom.includes('data-lmi-sha256="13837d0e1c89548277f40c8c8289afd5c0f27e8d8437c0a4422a91512a7d5952"'), `${route}: no stale SVG metadata attached to the replaced logo`);
    assert.doesNotMatch(dom, /Brouillon privé de prépublication|validation humaine obligatoire/, `${route}: production controls stay outside visitor content`);
    // Preserve all source navigation destinations while allowing server-side URL
    // normalization and Hub's approved visitor copy to happen independently.
    const normalizedAdapted = markup(adapted);
    for (const match of markup(raw).matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
      const href = match[1];
      const normalized = previewUrl(route, href).replaceAll('&', '&amp;');
      assert.ok(normalizedAdapted.includes(`href="${href}"`) || normalizedAdapted.includes(`href='${href}'`) || normalizedAdapted.includes(`href="${normalized}"`), `${route}: source navigation preserved: ${href}`);
      retainedLinks++;
    }
    logoChecks++;
    pages++;
  }
  for (const excluded of site.internalRoutesExcluded || []) {
    assert.equal(applySharedSiteShell(excluded, '<body><main>Internal</main></body>'), '<body><main>Internal</main></body>', `${excluded}: internal routes remain outside the visitor shell`);
  }
}
assert.equal(pages, 67);
assert.throws(() => renderHeader({ siteId: 'constructor' }), TypeError);
assert.throws(() => renderHeader({ homeHref: 'javascript:alert(1)' }), TypeError);
assert.throws(() => renderFooter({ links: [{ href: 'data:text/html,test', label: 'Unsafe' }] }), TypeError);
const escaped = renderHeader({ homeHref: '/?q="x"&name=test', navigation: [{ href: '/test', label: '<img src=x onerror=alert(1)>' }], contentId: '"><img src=x>' });
assert.ok(escaped.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert.ok(!escaped.includes('<img src=x'));
assert.ok(escaped.includes('/?q=&quot;x&quot;&amp;name=test'));
console.log(`SHARED_SHELL_PASS ${pages} routes / 4 sites / ${logoChecks} verified logos / ${retainedLinks} source navigation destinations preserved`);
console.log('SCOPE: source and server-rendered HTML; human visual recipe and live Bridge remain unverified.');
