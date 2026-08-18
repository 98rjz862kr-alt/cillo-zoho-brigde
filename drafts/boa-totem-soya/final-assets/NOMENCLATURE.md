# LE BOA TOTEM DE SOYA — NOMENCLATURE DES ASSETS FINAUX

Aucun fichier n'entre dans la production finale sans nom stable, version et statut QA.

## Model sheets
- `MODEL-SOYA-v001.png`
- `MODEL-CILLO-v001.png`
- `MODEL-SIDAAT-v001.png`
- `LINEUP-TRIO-v001.png`

## BD
- `BD-P01-ART-v001.png` à `BD-P18-ART-v001.png`
- `BD-P01-LETTERED-v001.png` à `BD-P18-LETTERED-v001.png`
- master prépresse : `BD-P01-PREPRESS-v001.tif` ou format imprimeur validé

## Album
- `ALBUM-DP01-ART-v001.png` à `ALBUM-DP12-ART-v001.png`
- `ALBUM-DP01-TEXT-v001.png` à `ALBUM-DP12-TEXT-v001.png`

## Dessin animé
- `DA-SHOT-001-KEY-v001.png` à `DA-SHOT-050-KEY-v001.png`
- exports séquence : `DA-SEQ-01-v001.mov` à `DA-SEQ-10-v001.mov`
- animatique : `DA-ANIMATIC-1045-v001.mp4`
- master final : nom/version définis après verrouillage technique.

## Audio
- `VOX-SOYA-TAKE-xxx.wav`, `VOX-CILLO-TAKE-xxx.wav`, `VOX-SIDAAT-TAKE-xxx.wav`, `VOX-NENE-TAKE-xxx.wav`, `VOX-VENDEUR-TAKE-xxx.wav`
- `DA-DIALOGUES-v001.wav`, `DA-AMBIANCES-v001.wav`, `DA-SFX-v001.wav`, `DA-MUSIC-v001.wav`, `DA-MIX-ST-v001.wav`

## QA
Pour chaque asset final : SHA-256, largeur, hauteur, version, source de référence, date de contrôle visuel, notes de contrôle et statut `VISUALLY_INSPECTED_PASS` dans `visual-qa-final.json`.

Les anciens `assets/roughs`, `assets/models`, `assets/album` et `assets/da` restent des fichiers schématiques et ne doivent jamais recevoir cette nomenclature finale.
