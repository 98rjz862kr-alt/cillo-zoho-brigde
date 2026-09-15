# PLAN DIRECTEUR D'EXÉCUTION — SORTIE D'ATELIER DES 4 SITES LMI

Date de référence : 15 septembre 2026
Marque canonique : LES MOTS IMAGÉS
Signature : LE VERBE PAR L'IMAGE
Bridge : brouillon privé de prépublication

## 1. Règle transverse de sortie

Aucun site ne peut être déclaré PASS à partir d'un commit, d'un document de preuve ou d'un build pris isolément. Le Bridge commun doit distinguer le commit d'intégration du candidat métier. La sortie exige une chaîne de preuve cohérente :

CANDIDATE SOURCE SHA -> CANDIDATE PACKAGE SHA-256 -> INTEGRATION SHA -> RUNTIME PACKAGE SHA-256 -> MANIFESTE MÉDIAS -> GATE DE RECETTE

Le runtime doit prouver le SHA d'intégration réellement déployé et, pour chaque site, un paquet servi strictement identique au paquet candidat par SHA-256. Cette séparation permet à un seul runtime Bridge de servir plusieurs candidats issus de commits différents sans falsifier leur provenance. Tous les médias réellement référencés doivent avoir une provenance et un statut de droits. Un PASS exige P0=0 et P1=0.

## 2. État de vérité observé

Le service Bridge Musée observé sur Render est LIVE sur le déploiement dep-dafb7867bikc73fsrg1g, service srv-d9osqbmgekts73eoqis0, au SHA f8d046bdfea2c0854364579cca59cbd2fd85a8b9. Render est configuré sur la branche `main` avec auto-déploiement à chaque commit. Tant que la recette humaine Musée n’est pas clôturée, tout merge vers `main` ou déploiement manuel de remplacement reste interdit, car il écraserait l’autorité de recette gelée.

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
4. Vérifier que le runtime annonce le SHA d’intégration déployé et que le SHA-256 du paquet Maison servi est identique au paquet candidat.
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
4. Vérifier le SHA d’intégration runtime et l’identité SHA-256 du paquet Food servi.
5. Manifester les médias, droits et provenance.
6. Rejouer le gate Food, en maintenant inertes toutes données commerciales non prouvées.

Interdiction : inventer prix, allergènes, disponibilité, fournisseur, conservation, paiement ou commande.

## 6. Flux C — Éditions

Éditions dispose désormais d’un candidat canonique unique : `7de14ba0381f4f83907900c95a83f5dc15377f81`, PR #120. Il dérive du Hub qualifié `15dcdc84b8e43cc2b5e260eb1edacd32c62fe7e9` et applique la marque canonique LES MOTS IMAGÉS sur les surfaces actives. Les validateurs Hub, liens, copie visiteur, SEO, visuels, entrée protégée et le test global passent sur ce SHA. Le build figé porte le SHA-256 `e7f479babc7a4822bc8ab9d39b0ccbd6ba1990db4d263a06e60e9505b851967e`.

Le candidat canonique réunit désormais sur un même SHA :
- catalogue canonique ;
- couvertures et provenance des médias ;
- pages ouvrage et navigation ;
- lecture intégrale distincte des extraits d'ouverture ;
- capacité de lecture vocale distincte des livres audio réellement produits ;
- responsive et accessibilité ;
- noindex de Bridge ;
- manifeste médias complet ;
- gate de recette.

Le candidat unique existe désormais. Aucun PASS ne sera accepté tant que son paquet exact n’est pas convergé dans le runtime Bridge, observé et soumis à recette.

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

Un site quitte les ateliers uniquement lorsque toute la chaîne candidat → paquet → intégration → runtime → médias → recette est présente, concordante et conservée comme preuve. Toute divergence ramène le site au statut candidat, sans effacer les travaux déjà qualifiés.

SHA-256 du fichier source Markdown : cf48b30f91824e0cc17512cc50395f7e98baa27449a5291970f75a85e5a5c040
