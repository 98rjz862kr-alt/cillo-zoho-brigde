import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../socle-v2/styles/socle.css', import.meta.url), 'utf8');
const allowed = new Set(['#143B7D', '#CC7722', '#75553F', '#D4AF37', '#FFFFFF']);
const active = css.match(/body\[data-lmi-shell="shared-v1"\]\s*\{([^}]+)\}/)?.[1];
assert.ok(active, 'The live shared shell must declare its authorized palette');
const tokens = Object.fromEntries([...active.matchAll(/(--lmi-[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
function color(name, seen = new Set()) {
  assert.ok(!seen.has(name), `Cyclic color alias: ${name}`);
  seen.add(name);
  const value = tokens[name];
  assert.ok(value, `Active shell must override historical color ${name}`);
  const alias = value.match(/^var\((--lmi-[\w-]+)\)$/)?.[1];
  const resolved = alias ? color(alias, seen) : value.toUpperCase();
  assert.ok(allowed.has(resolved), `Unauthorized live shell color: ${name} -> ${resolved}`);
  return resolved;
}
for (const [hex] of css.matchAll(/#[0-9a-f]{3,8}\b/gi)) assert.ok(allowed.has(hex.toUpperCase()), `Unauthorized CSS literal: ${hex}`);
for (const name of ['blue', 'ochre', 'sand', 'identity-gold', 'gold', 'night', 'ivory', 'matte-gold', 'stone', 'paper', 'ink', 'muted']) color(`--lmi-${name}`);

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
function contrast(foreground, background) {
  const values = [luminance(color(foreground)), luminance(color(background))].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
const pairs = [
  ['body text', '--lmi-ink', '--lmi-ivory', 4.5],
  ['header and links', '--lmi-blue', '--lmi-paper', 4.5],
  ['small tagline', '--lmi-sand', '--lmi-paper', 4.5],
  ['active ecosystem link', '--lmi-paper', '--lmi-blue', 4.5],
  ['footer text and links', '--lmi-paper', '--lmi-night', 4.5],
  ['footer secondary text', '--lmi-ivory', '--lmi-night', 4.5],
  ['footer keyboard outline', '--lmi-identity-gold', '--lmi-night', 3],
  ['header keyboard outline', '--lmi-blue', '--lmi-paper', 3],
];
const results = pairs.map(([role, foreground, background, minimum]) => {
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= minimum, `${role}: contrast ${ratio.toFixed(2)} is below ${minimum}`);
  return { role, ratio: Number(ratio.toFixed(2)), minimum };
});
console.log('SHARED_SHELL_CANONICAL_PALETTE_PASS four LMI colors + white support');
console.log(JSON.stringify({ contrast: results }));
