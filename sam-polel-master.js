import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.join(__dirname, 'drafts', 'sam-polel');

const sourceFiles = [
  'LMI-SP-BAT-R03-20260730-1451.html',
  'LMI-SP-BAT-R04-20260730-1453.html',
  'LMI-SP-BAT-R05-20260730-1505.html',
  'LMI-SP-BAT-R06-20260730-1508.html'
];

function extractSpreads(html) {
  return Array.from(String(html).matchAll(/<section\s+class=["']spread["'][^>]*>[\s\S]*?<\/section>/gi), (match) => match[0]);
}

function extractPageNumbers(html) {
  return Array.from(String(html).matchAll(/class=["'][^"']*\bnum\b[^"']*["'][^>]*>\s*(\d+)\s*<\/div>/gi), (match) => Number(match[1]));
}

function sourceSpreads() {
  return sourceFiles.flatMap((file) => {
    const html = readFileSync(path.join(projectDir, file), 'utf8');
    return extractSpreads(html);
  });
}

function frontMatter() {
  return `
<section class="spread" id="p1-2">
  <article class="page art cover" aria-label="Couverture interne Sam Polel">
    <svg viewBox="0 0 800 1000" role="img" aria-label="Silhouette sobre devant un horizon bleu et ocre">
      <defs><linearGradient id="master-cover" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#143b7d"/><stop offset=".62" stop-color="#315a8f"/><stop offset="1" stop-color="#cc7722"/></linearGradient></defs>
      <rect width="800" height="1000" fill="url(#master-cover)"/><circle cx="625" cy="175" r="58" fill="#d4af37" opacity=".82"/>
      <path d="M0 735 Q200 655 405 730 T800 690 V1000 H0Z" fill="#75553f"/>
      <g fill="#172230"><circle cx="365" cy="520" r="48"/><path d="M295 855 q70-335 140 0Z"/></g>
      <g fill="none" stroke="#f7f1e6" stroke-width="9" stroke-linecap="round" opacity=".55"><path d="M75 280 C250 210 430 270 710 175"/><path d="M110 390 C300 330 490 390 690 305"/></g>
    </svg>
    <div class="cover-title"><span>LMI ÉPOPÉES</span><h1>SAM POLEL</h1><p>Une parole à transmettre</p><small>Baaboy Cillo · Les Mots Images</small></div>
    <div class="lock">BAT INTERNE · COUVERTURE DE TRAVAIL · NON PUBLIABLE</div><div class="num" style="color:white">1</div>
  </article>
  <article class="page guard">
    <div class="kicker">Page 2 · Garde</div>
    <div class="guard-mark">LMI</div>
    <p class="quote">Le verbe par l’image.</p>
    <div class="small">Page de garde du prototype. Aucun ISBN, prix, dépôt légal, précommande ou dispositif commercial.</div>
    <div class="num">2</div>
  </article>
</section>
<section class="spread" id="p3-4">
  <article class="page title-page">
    <div class="kicker">Page 3 · Page de titre</div>
    <h1>Sam Polel</h1>
    <p class="subtitle">Une parole à transmettre</p>
    <p><strong>Auteur :</strong> Baaboy Cillo</p>
    <p><strong>Création éditoriale :</strong> Les Mots Images</p>
    <p><strong>Collection :</strong> LMI Épopées</p>
    <div class="small">Titre et sous-titre de travail soumis à validation éditoriale finale.</div>
    <div class="num">3</div>
  </article>
  <article class="page legal-page">
    <div class="kicker">Page 4 · Note interne</div>
    <h1>Cadre du prototype</h1>
    <p>Ce BAT réunit une création originale LMI et une mise en scène symbolique de la transmission orale.</p>
    <p>Il ne fixe aucune version patrimoniale comme définitive et n’intègre aucun terme pulaar non validé.</p>
    <div class="card"><strong>Verrous maintenus</strong><br>Droits et autorisations · graphies publiques · validation culturelle · validation linguistique · Atelier 0.</div>
    <p class="quote">Diffusion, impression commerciale et publication interdites avant levée documentée des verrous.</p>
    <div class="num">4</div>
  </article>
</section>`;
}

function qualityReport(body) {
  const numbers = extractPageNumbers(body);
  const expected = Array.from({ length: 56 }, (_, index) => index + 1);
  const missing = expected.filter((number) => !numbers.includes(number));
  const duplicates = [...new Set(numbers.filter((number, index) => numbers.indexOf(number) !== index))];
  const extra = numbers.filter((number) => number < 1 || number > 56);
  const spreads = extractSpreads(body).length;
  return {
    valid: spreads === 28 && numbers.length === 56 && missing.length === 0 && duplicates.length === 0 && extra.length === 0,
    spreads,
    pageCount: numbers.length,
    missing,
    duplicates,
    extra,
    sources: [...sourceFiles]
  };
}

export function getSamPolelQualityReport() {
  const body = `${frontMatter()}${sourceSpreads().join('\n')}`;
  return qualityReport(body);
}

export function buildSamPolelMaster() {
  const body = `${frontMatter()}${sourceSpreads().join('\n')}`;
  const qa = qualityReport(body);
  if (!qa.valid) throw new Error(`Sam Polel master invalid: ${JSON.stringify(qa)}`);

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>LMI-SP-BAT-MASTER-56P-20260730 — Sam Polel</title>
<style>
:root{--bleu:#143B7D;--ocre:#CC7722;--sable:#75553F;--or:#D4AF37;--ivoire:#F7F1E6;--encre:#1E2430}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#e8e5df;color:var(--encre);font-family:Georgia,serif}
.toolbar{position:sticky;top:0;z-index:20;background:#0e2b5c;color:#fff;padding:12px 18px;font-family:Arial,sans-serif;display:flex;justify-content:space-between;gap:12px;align-items:center;box-shadow:0 3px 14px #0004}.toolbar div{display:flex;gap:8px;flex-wrap:wrap}.toolbar a,.toolbar button{font:700 13px Arial,sans-serif;border:0;border-radius:7px;padding:10px 13px;text-decoration:none;cursor:pointer}.toolbar a{background:#fff;color:var(--bleu)}.toolbar button{background:var(--or);color:#172238}
.qa{max-width:1440px;margin:22px auto 0;padding:18px 22px;background:#fffaf1;border-left:7px solid var(--or);font:14px/1.5 Arial,sans-serif}.qa strong{color:var(--bleu)}
main{max-width:1440px;margin:24px auto;padding:0 16px}.spread{display:grid;grid-template-columns:1fr 1fr;min-height:760px;background:white;margin:0 0 28px;box-shadow:0 10px 28px #0002;page-break-after:always;break-after:page}
.page{position:relative;overflow:hidden;min-height:760px;padding:54px}.page.art{padding:0;background:linear-gradient(160deg,#173d78 0%,#315a8f 58%,#c2772d 100%)}
.kicker{font:700 12px/1 Arial,sans-serif;letter-spacing:.16em;color:var(--ocre);text-transform:uppercase}.num{position:absolute;bottom:22px;right:26px;font:700 12px Arial,sans-serif;color:#777}.page h1{font:700 clamp(34px,4vw,64px)/.98 Arial,sans-serif;color:var(--bleu);margin:18px 0 28px}.page h2{font:700 24px Arial,sans-serif;color:var(--bleu);margin:24px 0 12px}.page p,.page li{font-size:clamp(18px,1.7vw,27px);line-height:1.5}.page ul{padding-left:24px}.small{font:italic 14px/1.5 Arial,sans-serif;color:var(--sable);margin-top:36px;border-top:2px solid #ead9bf;padding-top:16px}.lock{position:absolute;left:24px;bottom:20px;font:700 10px Arial,sans-serif;letter-spacing:.12em;color:#fff;background:#143b7ddd;padding:8px 10px}.art svg{width:100%;height:100%;display:block}.quote{font-style:italic;color:var(--sable)}.card{border:1px solid #d9cdbb;background:#fffaf1;padding:18px 20px;margin:14px 0}
.cover-title{position:absolute;left:55px;right:55px;top:80px;color:#fff;text-shadow:0 3px 15px #0006}.cover-title span{font:700 13px Arial,sans-serif;letter-spacing:.25em;color:#f2d98a}.cover-title h1{font:800 clamp(54px,8vw,105px)/.88 Arial,sans-serif;color:#fff;margin:24px 0 14px}.cover-title p{font:italic clamp(22px,3vw,38px) Georgia,serif;margin:0}.cover-title small{display:block;margin-top:28px;font:700 15px Arial,sans-serif}.guard{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.guard-mark{width:150px;height:150px;border:7px solid var(--bleu);border-radius:50%;display:grid;place-items:center;font:800 42px Arial,sans-serif;color:var(--bleu);margin-bottom:25px}.subtitle{font-style:italic;color:var(--sable);font-size:30px!important}
.final-validation{max-width:1440px;margin:0 auto 50px;padding:38px 46px;background:var(--ivoire);border-top:9px solid var(--bleu);font-family:Arial,sans-serif}.final-validation h2{color:var(--bleu);margin-top:0}.checks{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.check{background:#fff;border:1px solid #c8bba7;padding:13px}.trace{font:12px/1.55 monospace;color:#564b40;margin-top:22px}
@media(max-width:900px){.spread{grid-template-columns:1fr}.page,.page.art{min-height:620px}.checks{grid-template-columns:1fr}.toolbar{align-items:flex-start;flex-direction:column}}
@media print{.toolbar,.qa{display:none!important}body{background:#fff}main{max-width:none;margin:0;padding:0}.spread{margin:0;box-shadow:none;min-height:100vh}.final-validation{page-break-before:always;margin:0}}
@page{size:A3 landscape;margin:0}
</style>
</head>
<body>
<nav class="toolbar"><strong>LES MOTS IMAGES · SAM POLEL · MASTER 56 PAGES</strong><div><a href="/atelier">Retour à l’atelier</a><button type="button" onclick="window.print()">Imprimer / exporter PDF</button></div></nav>
<div class="qa"><strong>Contrôle automatique réussi :</strong> 28 doubles pages · 56 pages numérotées · aucune page manquante · aucun doublon. Statut : BAT INTERNE NON PUBLIABLE.</div>
<main>${body}</main>
<section class="final-validation">
<h2>Validation humaine finale — master 56 pages</h2>
<p>Le montage complet est techniquement fermé. Les cases suivantes correspondent aux validations humaines et documentaires restant obligatoires avant toute publication.</p>
<div class="checks"><div class="check">□ Texte intégral validé</div><div class="check">□ Pagination et composition validées</div><div class="check">□ Direction artistique validée</div><div class="check">□ Graphies publiques validées</div><div class="check">□ Validation culturelle obtenue</div><div class="check">□ Validation linguistique obtenue</div><div class="check">□ Droits et autorisations obtenus</div><div class="check">□ Atelier 0 réalisé</div><div class="check">□ Bon à publier signé</div></div>
<div class="trace">Référence : LMI-SP-BAT-MASTER-56P-20260730<br>Pages : 1–56 · 28 doubles pages<br>Sources : R03 + R04 + R05 + R06<br>Statut : PRODUCTION TERMINÉE / VALIDATION HUMAINE REQUISE / NON PUBLIABLE / NON VENDABLE</div>
</section>
</body>
</html>`;
}
