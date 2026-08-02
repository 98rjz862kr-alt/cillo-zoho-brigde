import assert from 'node:assert/strict';
import { buildSamPolelMaster, getSamPolelQualityReport } from '../sam-polel-master.js';

const report = getSamPolelQualityReport();
assert.equal(report.valid, true, `Rapport invalide: ${JSON.stringify(report)}`);
assert.equal(report.spreads, 28, 'Le master doit contenir 28 doubles pages.');
assert.equal(report.pageCount, 56, 'Le master doit contenir 56 pages numérotées.');
assert.deepEqual(report.missing, [], 'Aucune page ne doit manquer.');
assert.deepEqual(report.duplicates, [], 'Aucun numéro de page ne doit être dupliqué.');
assert.deepEqual(report.extra, [], 'Aucun numéro hors pagination ne doit apparaître.');

const html = buildSamPolelMaster();
assert.match(html, /LMI-SP-BAT-MASTER-56P-20260730/);
assert.match(html, /noindex,nofollow,noarchive/);
assert.match(html, /PRODUCTION TERMINÉE/);
assert.match(html, /NON PUBLIABLE/);
assert.doesNotMatch(html, /précommande ouverte|acheter maintenant|commander maintenant/i);

console.log(JSON.stringify({ ok: true, ...report }, null, 2));
