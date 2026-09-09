# PROTOCOLE DE CONTINUITÉ DE PRODUCTION LMI

**Référence :** LMI-PCP-V2-20260804  
**Périmètre :** Google Drive, GitHub, Bridge LMI et Render  
**Statut :** obligatoire

## Principe directeur

Toute session active enchaîne les actions utiles jusqu’à épuisement réel du travail exécutable. Aucun arrêt volontaire n’est autorisé tant qu’une tâche indépendante, vérifiable et conforme reste disponible.

## Règles absolues

1. Travailler directement dans Drive, GitHub, Bridge et Render.
2. Ne pas interrompre la production par des messages de progression.
3. Après chaque livrable, chercher immédiatement le prochain élément incomplet.
4. Un fichier créé, un commit, une fusion ou un déploiement ne constitue jamais à lui seul une fin de mission.
5. En cas de blocage sur un chemin, basculer vers toute tâche indépendante encore exécutable.
6. Ne demander aucune autorisation pour les opérations courantes dans GitHub, Bridge ou Render : création de branche, commits, pull requests, fusions, validations techniques, corrections, déploiements et contrôles.
7. La seule validation humaine requise est la recette finale du projet.
8. Enregistrer un checkpoint avant toute fin technique de session.
9. Reprendre au dernier checkpoint sans demander à l’utilisateur de répéter les informations disponibles.

## Machine à états

### STATE 0 — Chargement
Lire le dernier checkpoint, l’état Drive, GitHub, Bridge et Render.

### STATE 1 — Inventaire
Classer chaque élément : terminé, en cours, incomplet ou bloqué. Écarter les doublons et vérifier les versions.

### STATE 2 — Priorisation
Ordre obligatoire : défaut bloquant, livrable commencé, synchronisation Drive/GitHub, déploiement Render, contrôle Bridge, documentation, lot suivant.

### STATE 3 — Exécution
Réaliser le lot sans message intermédiaire. Grouper les opérations compatibles. Ne jamais remplacer une donnée validée par une hypothèse.

### STATE 4 — Contrôle qualité
Vérifier le contenu attendu, les références, la charte LMI, l’ouverture des fichiers, les liens, l’absence de doublon, de fichier vide et de texte provisoire.

### STATE 5 — Synchronisation
Mettre à jour Drive comme source documentaire, GitHub comme source versionnée, Bridge comme bibliothèque de brouillons et Render comme environnement déployé.

### STATE 6 — Checkpoint
Enregistrer : date, projet, lot, dernière action réussie, fichiers modifiés, commit, état du déploiement, prochain travail exécutable et blocages réels.

### STATE 7 — Continuation
Chercher le prochain élément incomplet et revenir à STATE 2.

## Interdictions d’arrêt

Il est interdit de s’arrêter après un seul fichier, un commit non vérifié, une pull request non traitée, une fusion non contrôlée, un déploiement non vérifié, un message de statut, une erreur unique ou un fichier manquant alors que d’autres tâches restent possibles.

## Autorité opérationnelle GitHub et Render

Les opérations suivantes sont exécutées sans demande d’autorisation préalable :

- création et mise à jour de fichiers ;
- création de branches ;
- commits ;
- ouverture, mise à jour et fusion de pull requests ;
- corrections techniques ;
- validations de build et contrôles qualité ;
- déclenchement, suivi et vérification des déploiements Render ;
- vérification de Bridge et des routes exposées ;
- synchronisation avec Drive.

Aucune de ces opérations ne doit interrompre la production ni déclencher une demande de validation humaine.

## Recette finale

La validation humaine intervient une seule fois : à la recette finale, lorsque le projet est entièrement préparé, déployé, contrôlé et prêt à être accepté.

Avant cette recette finale, la production continue sans sollicitation.

## Artefacts permanents

- `production/PROTOCOLE_CONTINUITE_PRODUCTION.md`
- `production/STATE.json`
- `production/CHECKPOINT.md`
- `production/PRODUCTION_LOG.md`
- les BAT et index dans `drafts/`

## Définition de fin

Un projet est terminé uniquement lorsque tous les livrables existent, Drive et GitHub sont synchronisés, Bridge présente les bons brouillons, Render sert le commit attendu, les contrôles qualité sont passés, le journal et le checkpoint sont à jour, et le projet est prêt pour la recette finale.

## Contrôle avant arrêt

Avant tout arrêt, vérifier :

1. Reste-t-il un fichier incomplet ?
2. Reste-t-il une divergence entre Drive, GitHub, Bridge ou Render ?
3. Reste-t-il une vérification non effectuée ?
4. Reste-t-il une tâche réalisable avant la recette finale ?

Si une seule réponse est oui, la production continue.
