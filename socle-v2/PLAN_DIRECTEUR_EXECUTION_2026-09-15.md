# PLAN DIRECTEUR D'EXÉCUTION — SORTIE D'ATELIER DES 4 SITES LMI

Date de référence : 15 septembre 2026
Marque canonique : LES MOTS IMAGÉS
Signature : LE VERBE PAR L'IMAGE
Bridge : brouillon privé de prépublication

## 1. Règle transverse de sortie

Aucun site ne peut être déclaré PASS à partir d'un commit, d'un document de preuve ou d'un build pris isolément. La sortie exige un quintuplet cohérent sur une même version :

SOURCE SHA -> BUILD -> RUNTIME BRIDGE -> MANIFESTE MÉDIAS -> GATE DE RECETTE

Le runtime doit prouver le même SHA que la source. Le build et le manifeste médias doivent être hashés. Tous les médias réellement référencés doivent avoir une provenance et un statut de droits. Un PASS exige P0=0 et P1=0.

## 2. État de vérité observé

Le service Bridge Musée observé sur Render est LIVE sur le déploiement dep-dafb7867bikc73fsrg1g, service srv-d9osqbmgekts73eoqis0, au SHA f8d046bdfea2c0854364579cca59cbd2fd85a8b9.

Le manifeste Musée à ce SHA porte READY_TO_PUBLISH. Le main actuel du dépôt cillo-zoho-brigde est 8517bbac8eddc3f60ba35a20d54dbabc787e7947 et son manifeste Musée porte CANDIDATE_PRIVATE avec Atlas A_REQUALIFIER. Par conséquent, le main actuel ne doit pas remplacer le snapshot Bridge qualifié avant la recette humaine Musée.

Cette divergence n'est pas une anomalie à corriger en écrasant le Bridge : elle justifie au contraire le gel du snapshot qualifié pour recette humaine.

## 3. Flux A — Musée

Décision : FREEZE_FOR_HUMAN_RECIPE.

- Ne pas reconstruire le site avant recette.
- Ne pas redéployer le main actuel à la place du snapshot f8d046bd.
- Présenter la version Bridge actuelle à la recette humaine.
- En cas de réserve humaine, corriger uniquement le défaut prouvé sur une nouvelle version identifiée, puis rejouer le quintuplet.
- Le Socle V2 ne bloque pas cette sortie.

## 4. Flux B — Maison

Candidat de convergence reproductible : 90feb347652b025ebb657e76d41f691a11956ef6, PR #119, dérivé du candidat 42a1b7dee6b23b7a9dfaf2129813f14fb35ab159 (PR #108) par correction minimale du validateur.

Le candidat dispose d'un manifeste de sources Drive/SHA, des actifs Maison retrouvés et de contrôles fail-closed documentés. Il n'est pas le SHA actuellement servi par Bridge.

Actions :
1. Préserver le candidat exact.
2. Construire ce SHA sans modification silencieuse.
3. Déployer sur la prépublication privée Bridge.
4. Vérifier que le runtime annonce exactement le même SHA.
5. Générer le manifeste complet des médias réellement référencés avec SHA-256, provenance et droits.
6. Exécuter le gate de recette.

Interdiction : reconstruire Maison depuis zéro ou déclarer PASS depuis la seule PR.

## 5. Flux B — Food

Candidat exact testé : 212ff413e60df9195052deb61c9da75a03e31ebe, PR #104.

Les validateurs Food et npm test sont documentés PASS sur ce HEAD local exact. La CI GitHub a échoué avant exécution pour un verrou de compte, donc elle n'est ni un PASS ni un échec fonctionnel du candidat. Ce candidat n'est pas le SHA actuellement servi par Bridge.

Actions :
1. Préserver le candidat exact.
2. Construire ce SHA sans modification silencieuse.
3. Déployer sur la prépublication privée Bridge.
4. Vérifier le SHA runtime.
5. Manifester les médias, droits et provenance.
6. Rejouer le gate Food, en maintenant inertes toutes données commerciales non prouvées.

Interdiction : inventer prix, allergènes, disponibilité, fournisseur, conservation, paiement ou commande.

## 6. Flux C — Éditions

Éditions dispose d'un Hub privé riche et de la PR #99, mais aucun candidat unique n'est retenu ici comme autorité de sortie courante.

Le candidat canonique à construire doit réunir sur un même SHA :
- catalogue canonique ;
- couvertures et provenance des médias ;
- pages ouvrage et navigation ;
- lecture intégrale distincte des extraits d'ouverture ;
- capacité de lecture vocale distincte des livres audio réellement produits ;
- responsive et accessibilité ;
- noindex de Bridge ;
- manifeste médias complet ;
- gate de recette.

Aucun PASS ne sera accepté tant que ce candidat unique n'existe pas.

## 7. Flux D — Socle commun V2

Branche de travail : work/socle-commun-v2-20260915.
PR brouillon : #118.

Noyau déjà créé :
- tokens canoniques de marque et couleurs ;
- contrat JSON du quintuplet de sortie ;
- validateur sans dépendance ;
- commande npm test:socle-v2 ;
- registre de maturité des quatre sites ;
- descripteurs de convergence Maison/Food ;
- gel documenté du snapshot Musée ;
- descripteur de consolidation Éditions.

Le validateur Socle V2 retourne SOCLE_V2_PASS sur le Mac mini.

Le test global du main actuel échoue au validateur Musée parce que le manifeste courant du main est CANDIDATE_PRIVATE. Cette condition préexistait au travail Socle V2 et confirme que le snapshot Bridge f8d046bd doit rester l'autorité de recette Musée tant qu'il n'est pas volontairement remplacé par un nouveau candidat complet.

## 8. Identité LMI appliquée au V2

Nom canonique : LES MOTS IMAGÉS.

Palette canonique :
- Bleu LMI #143B7D
- Ocre #CC7722
- Sable #75553F
- Or #D4AF37
- Bleu nuit #0F2747
- Ivoire #F6F1E8
- Or mat #C8A96B
- Gris pierre #C9C3BA

Les nouvelles surfaces du Socle V2 ne doivent plus propager la variante LES MOTS IMAGES. Les occurrences historiques ne sont pas réécrites en masse sans qualification de leur rôle.

## 9. Ordre d'exécution retenu

1. Musée : recette humaine du snapshot gelé.
2. Maison : convergence exact-SHA vers Bridge puis recette.
3. Food : convergence exact-SHA vers Bridge puis recette.
4. Éditions : candidat canonique unique puis Bridge et recette.
5. Socle V2 : progression en parallèle, sans bloquer Musée.

## 10. Règle de fermeture

Un site quitte les ateliers uniquement lorsque les cinq maillons du quintuplet sont présents, concordants et conservés comme preuves. Toute divergence ramène le site au statut candidat, sans effacer les travaux déjà qualifiés.

SHA-256 du fichier source Markdown : cf48b30f91824e0cc17512cc50395f7e98baa27449a5291970f75a85e5a5c040
