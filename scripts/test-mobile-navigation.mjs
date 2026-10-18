import assert from 'node:assert/strict';
import vm from 'node:vm';
import { renderHeader } from '../socle-v2/components/lmi-shell.mjs';

const html = renderHeader({ siteId: 'food', navigation: [{ href: '/la-carte', label: 'Restaurant' }] });
const script = html.match(/<script id="lmi-mobile-navigation">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Exercise the exact script emitted with the shared header');
assert.match(html, /<button[^>]*aria-controls="lmi-site-navigation"[^>]* hidden>/);
assert.doesNotMatch(html.match(/<div class="lmi-header__navigation"[^>]*>/)?.[0] || '', /\bhidden\b/,
  'Without JavaScript the menu links remain visible');

function fixture(isMobile, { supported = true, legacy = false } = {}) {
  const events = { button: {}, header: {}, navigation: {} };
  const attributes = { 'aria-controls': 'lmi-site-navigation', 'aria-expanded': 'true' };
  const link = { focusCount: 0, focus() { this.focusCount++; document.activeElement = this; } };
  const destination = {
    focusCount: 0, attributes: {},
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focusCount++; document.activeElement = this; },
  };
  const navigation = { hidden: false, contains: node => node === link,
    querySelector: selector => selector === 'a[href]' ? link : null,
    addEventListener: (name, handler) => { events.navigation[name] = handler; } };
  const button = {
    hidden: true, focusCount: 0,
    getAttribute: name => attributes[name],
    setAttribute: (name, value) => { attributes[name] = value; },
    addEventListener: (name, handler) => { events.button[name] = handler; },
    focus() { this.focusCount++; document.activeElement = this; },
  };
  const header = {
    querySelector: selector => selector === '[data-lmi-menu-toggle]' ? button : null,
    addEventListener: (name, handler) => { events.header[name] = handler; },
  };
  const document = {
    activeElement: {},
    querySelector: selector => selector === '[data-lmi-shared-header]' ? header : null,
    getElementById: id => id === 'lmi-site-navigation' ? navigation : id === 'vision' ? destination : null,
  };
  let resize;
  const media = { matches: isMobile };
  if (legacy) media.addListener = handler => { resize = handler; };
  else media.addEventListener = (name, handler) => { assert.equal(name, 'change'); resize = handler; };
  vm.runInNewContext(script, { document, window: supported ? { matchMedia: () => media } : {} }, { timeout: 1000 });
  return { events, attributes, navigation, button, document, link, destination, media, resize: () => resize() };
}

for (const legacy of [false, true]) {
  const f = fixture(true, { legacy });
  assert.equal(f.button.hidden, false);
  assert.equal(f.navigation.hidden, true);
  assert.equal(f.attributes['aria-expanded'], 'false');
  f.events.button.click();
  assert.equal(f.navigation.hidden, false, 'The mobile button reveals the actual navigation');
  assert.equal(f.attributes['aria-expanded'], 'true');
  f.events.header.keydown({ key: 'Tab' });
  assert.equal(f.navigation.hidden, false, 'Normal keyboard navigation remains untouched');
  f.events.header.keydown({ key: 'Escape' });
  assert.equal(f.navigation.hidden, true);
  assert.equal(f.button.focusCount, 1, 'Escape returns keyboard focus to the menu control');
  f.events.header.keydown({ key: 'Escape' });
  assert.equal(f.button.focusCount, 1, 'An already closed menu does not move focus');
  f.events.button.click();
  f.events.button.click();
  assert.equal(f.navigation.hidden, true, 'The same button also closes the menu');
  f.document.activeElement = f.button;
  f.media.matches = false;
  f.resize();
  assert.equal(f.navigation.hidden, false, 'Desktop navigation is always visible');
  assert.equal(f.button.hidden, true);
  assert.equal(f.link.focusCount, 1, 'Hiding the mobile control returns focus to a visible navigation link');
  assert.equal(f.document.activeElement, f.link);
  f.document.activeElement = f.link;
  f.media.matches = true;
  f.resize();
  assert.equal(f.navigation.hidden, true);
  assert.equal(f.button.focusCount, 2, 'A viewport change does not strand focus in hidden links');
  f.events.button.click();
  f.events.navigation.click({ target: { closest: () => ({ getAttribute: () => '#vision' }) } });
  assert.equal(f.navigation.hidden, true, 'An in-page navigation closes the expanded mobile menu');
  assert.equal(f.destination.focusCount, 1);
  assert.equal(f.destination.attributes.tabindex, '-1', 'The target receives focus without entering the Tab sequence');
}
const desktop = fixture(false);
assert.equal(desktop.navigation.hidden, false);
assert.equal(desktop.button.hidden, true);
const unsupported = fixture(true, { supported: false });
assert.equal(unsupported.navigation.hidden, false, 'Unsupported media queries preserve all links');
assert.equal(unsupported.button.hidden, true);
console.log('MOBILE_NAVIGATION_PASS exact emitted script / mobile and desktop / open-close / Escape / focus / viewport changes / no-JS fallback');
