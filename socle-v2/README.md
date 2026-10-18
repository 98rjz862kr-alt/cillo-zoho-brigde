# SOCLE COMMUN V2 — LES MOTS IMAGÉS

Version: 2.0.0-alpha.1

## Objet

Le Socle commun V2 transforme le référentiel de gouvernance existant en contrats techniques consommables par Éditions, Food, Maison et Musée. Il ne remplace pas les verticales : il fournit les invariants communs, les preuves de version et les gates de prépublication.

## Marque canonique

- Nom: **LES MOTS IMAGÉS**
- Signature: **LE VERBE PAR L’IMAGE**
- Identité logo: Bleu LMI `#143B7D` + Or LMI `#C9A13B`
- Nuancier: Ocre `#CC7722`, Sable `#75553F`, Or `#D4AF37`
- Premium: Bleu nuit `#0F2747`, Ivoire `#F6F1E8`, Or mat `#C8A96B`, Gris pierre `#C9C3BA`

Les trois valeurs dorées ont des rôles distincts; aucune n’est un « or universel » par défaut.

Les variantes `LES MOTS IMAGES` et `Les Mots Images` sont non canoniques pour les nouvelles surfaces. Leur présence dans l'historique n'autorise pas leur propagation.

## Quintuplet obligatoire de sortie

Aucun site ne peut être déclaré PASS sur la seule présence d'un commit ou d'un document de preuve. Les cinq maillons doivent désigner la même version :

`CANDIDATE SOURCE SHA -> CANDIDATE PACKAGE SHA-256 -> INTEGRATION SHA -> RUNTIME PACKAGE SHA-256 -> MANIFESTE MEDIAS -> GATE DE RECETTE`

Le contrat machine correspondant est `site-manifest.schema.json`.

### Règles

1. `candidate.sourceSha` est le SHA Git du candidat métier qualifié.
2. `candidate.packageSha256` fige le contenu utile du site.
3. `integration.sourceSha` et `runtime.integrationSha` doivent être identiques.
4. `runtime.packageSha256` doit être identique à `candidate.packageSha256`.
5. Le build est identifié et hashé en SHA-256.
4. Tous les médias réellement référencés sont manifestés avec SHA-256, provenance et statut de droits.
5. Un PASS exige `p0=0` et `p1=0`.
6. Bridge est le brouillon de prépublication. Il ne constitue pas une publication publique.
7. Un ancien PASS ne vaut pas pour une version ultérieure.

## Structure prévue

- `tokens.json` — identité, couleurs et dimensions communes.
- `site-manifest.schema.json` — contrat de preuve de prépublication.
- `site-manifests/` — manifestes exact-SHA par verticale.
- `scripts/validate-socle-v2.mjs` — contrôle commun hors dépendance.
- `components/` — composants partagés versionnés.
- `styles/` — styles communs dérivés des tokens.

## Stratégie de migration

### Musée

Le snapshot déjà qualifié reste figé pour recette humaine. Le Socle V2 ne doit pas bloquer sa sortie ni modifier son paquet sans nécessité.

### Maison et Food

La priorité est la convergence du candidat qualifié vers le runtime Bridge exact-SHA. Aucune reconstruction globale ne doit être faite si les composants existants peuvent être repris.

### Éditions

Construire un candidat canonique unique avant de le présenter comme prêt à sortir : catalogue, couvertures, texte, lecture/écoute, navigation, actifs et provenance doivent converger vers le même manifeste.

## Politique de compatibilité

Le Socle V2 peut coexister avec les pages historiques pendant la migration. Les verticales ne sont migrées que lorsqu'un lot borné est contrôlé. Il est interdit de maquiller un état historique en état courant.
