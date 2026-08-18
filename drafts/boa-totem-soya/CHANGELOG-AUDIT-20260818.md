# LE BOA TOTEM DE SOYA — CHANGELOG AUDIT CORRECTIF — 2026-08-18

## Cause de l’audit

Le lot du 16 août avait été déclaré à tort comme production interne finalisée. Le contrôle visuel réel a montré que les « roughs », « model sheets », « doubles pages » et feuilles DA étaient principalement des SVG/layouts procéduraux géométriques. La présence de fichiers et la réussite de validateurs structurels avaient été confondues avec une production graphique terminée.

## Corrections de statut

- Recette humaine : **SUSPENDUE**.
- Graphisme : **NON FINAL**.
- Publication : **INTERDITE**.
- Ancien dossier Drive « final » renommé en préproduction / recette suspendue.
- ZIP et SHA anciennement marqués finaux renommés archives non finales.
- 18 PNG roughs, 3 PNG model sheets, 12 doubles pages et 10 feuilles DA renommés `SCHÉMATIQUE — NON FINAL` dans Drive.
- Pages Bridge 20, 21, 24, 25 et index requalifiées pour supprimer les faux statuts finaux.

## Sources visuelles retrouvées

### Priorité A — source BD v2
Drive `1-Sds8HUOvPxHnivPTsarik_xxBXhXd9Kwpv0E9UY-xQ` : line-up du trio, concepts SOYA/CILLO/SIDAAT et storyboard illustré de la planche 12.

Corrections nécessaires : le concept CILLO montre une extension/tresse arrière non conforme ; la coiffure canonique s’arrête à la nuque. Une checklist historique mentionne le braconnage, formulation non retenue dans les scripts actuels. Le boa ne doit pas être représenté physiquement.

### Priorité B — adaptation mobile V0.3
Dossier Drive de copie `12LWyeU632usX7dJ9EBun_PyaAxQQOWjb` : 12 écrans et planche-contact du court « Le Pas qui réveille le signe ».

Usage admis : matière aquarelle, lumière, décor, gestuelle, proportions simplifiées. Usage interdit : reprendre les textes comme canon, reprendre la tenue adaptation-spécifique comme verrou du support principal, ou reprendre les écrans où un grand boa physique est visible.

### Sources rejetées pour continuité personnages
Images de juin `18TnkUST3T58xZi91TSXGdD0-SVKek4mf` et `1KsCtlHmEluN_qEbCG6rP8LRogrLOZXzl` : trio non canonique ; jamais référence personnage.

## Corrections éditoriales et techniques

- Découpage BD : décision finale de SOYA déplacée/verrouillée en planche 16 ; planche 18 sans nouvelle bulle.
- Direction voix : décision finale enregistrée comme une seule réplique ; âge CILLO harmonisé 6–9 ans.
- Plan sonore : recalé de 00:00 à 10:45 sur les 10 séquences du DA.
- DA/SRT : validation dédiée des 50 plans, 645 s et 18 cues contenus dans leurs plans.
- Bible visuelle / storyboard : interdiction explicite du boa physique complet et du contact enfant/boa.
- Génération procédurale automatique : neutralisée dans les workflows de production.
- Render/Bridge : health corrigé pour exposer `boaRecipeReady=false`, `boaGraphicsFinal=false`, `boaRecipeStatus=SUSPENDED`, statut production `IN_PRODUCTION` et publication `FORBIDDEN`.

## Nouvelle production

Drive : `1wHHgFc9IYdc4OhNk0eeq1O3t42IL2FkM`

Sous-dossiers : références ; model sheets définitifs ; BD 18 planches ; album 12 doubles pages ; DA 50 plans ; lettrage ; prépresse ; animation/voix/son/mixage ; QA visuelle.

GitHub :
- `PRODUCTION_STATUS.json`
- `visual-production-plan.json`
- `visual-reference-register.json`
- `scripts/validate-boa-visual-final.mjs`
- prompts de production dans `final-assets/`

Checkpoint : `checkpoint/boa-preproduction-audit-20260818` au commit `7dbee3adb33e21a016471a8592f146ddde99133b`.

## Gate avant recette humaine

Aucune nouvelle recette ne peut être ouverte tant que `visual-qa-final.json` n’existe pas avec `READY_FOR_HUMAN_RECIPE` et que 3 model sheets, 18 planches BD, 12 doubles pages et 50 plans DA n’ont pas chacun un contrôle visuel réel `VISUALLY_INSPECTED_PASS`, complété par lettrage, prépresse, animation et audio en PASS.
