from __future__ import annotations


def render_system_page() -> str:
    return """<!doctype html>
<html lang='fr'>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<meta name='robots' content='noindex,nofollow,noarchive'>
<title>CDM - Systeme modulaire</title>
<link rel='stylesheet' href='/system.css'>
</head>
<body>
<header class='top'><div class='shell'><div class='brand'><img src='/lmi-brand.svg' alt='Les Mots Images'><div><strong>CDM - COLLECTES DECHETS MENAGERS</strong><small>LE VERBE PAR L'IMAGE</small></div></div><nav><a href='#architecture'>Architecture</a><a href='#interface'>Interface LMI</a><a href='#simulateur'>Simulateur</a><a href='/machine'>Console technique</a></nav></div></header>
<main>
<section class='hero'><div class='shell'><p class='eyebrow'>Infrastructure modulaire de proprete urbaine</p><h1>Un seul systeme. Des modules autonomes. Une interoperabilite native.</h1><p class='lead'>Machine mobile, corbeille permanente sans sac, interface commune et optimisation centrale.</p><div class='principle' id='principle'>AUTONOME SEUL - PLUS PERFORMANT ENSEMBLE.</div></div></section>
<section id='architecture'><div class='shell'><div class='section-head'><div><p class='eyebrow'>Architecture cible</p><h2>Quatre modules, une seule infrastructure</h2></div><span class='badge' id='system-version'>Prototype numerique</span></div><div class='modules' id='modules'></div></div></section>
<section><div class='shell'><div class='section-head'><div><p class='eyebrow'>Modes</p><h2>Quatre modes de fonctionnement</h2></div></div><div class='modes' id='modes'></div></div></section>
<section><div class='shell'><div class='section-head'><div><p class='eyebrow'>Etat</p><h2>Equipements suivis</h2></div><div class='status-line' id='service-status'><span class='dot'></span>Chargement</div></div><div class='dashboard'><article class='panel'><h3>Machines mobiles</h3><div class='asset-list' id='machines'></div></article><article class='panel'><h3>Corbeilles permanentes</h3><div class='asset-list' id='bins'></div></article></div><div class='resilience'><div><b id='metric-machines'>-</b><span>machines</span></div><div><b id='metric-bins'>-</b><span>corbeilles</span></div><div><b id='metric-alerts'>-</b><span>priorites</span></div><div><b id='metric-events'>-</b><span>cycles</span></div></div></div></section>
<section id='interface'><div class='shell'><div class='section-head'><div><p class='eyebrow'>Module C</p><h2>Interface universelle LMI</h2></div><span class='badge' id='interface-standard'>LMI-UCIF</span></div><div class='interface-flow' id='interface-flow'></div></div></section>
<section id='simulateur'><div class='shell'><div class='section-head'><div><p class='eyebrow'>Validation fonctionnelle</p><h2>Simulation du cycle ferme</h2></div></div><div class='sim-grid'><article class='panel'><div class='controls'><div class='field'><label for='machine-select'>Machine</label><select id='machine-select'></select></div><div class='field'><label for='bin-select'>Corbeille</label><select id='bin-select'></select></div><label class='check'><input id='rinse' type='checkbox' checked> Rincage apres transfert</label><div class='actions'><button class='btn' id='dock-button' type='button'>Lancer le cycle</button><button class='btn secondary' id='reset-button' type='button'>Reinitialiser</button></div></div></article><article class='result' id='result'><strong>Pret.</strong><p class='muted'>Selectionnez une machine et une corbeille.</p></article></div></div></section>
<section><div class='shell'><div class='section-head'><div><p class='eyebrow'>Module D</p><h2>Optimisation non bloquante</h2></div><button class='btn' id='optimize-button' type='button'>Recalculer</button></div><div class='optimization' id='optimization'></div></div></section>
</main>
<footer class='footer'><div class='shell'><span><b>LES MOTS IMAGES</b> - CDM</span><span>Validation privee</span></div></footer>
<script src='/system-api.js'></script>
</body>
</html>"""
