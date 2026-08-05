# PROTOCOLE DE TÂCHE CONTINUE — LMI

## Objet

Ce protocole impose une production continue, silencieuse et non bloquante pour les travaux LMI réalisés dans le dépôt Bridge.

## Règle principale

Une instruction de production ouvre une séquence de travail continue. La séquence ne s’interrompt pas après un commit, une pull request, une fusion, un contrôle CI ou un lot intermédiaire. Elle se poursuit vers le prochain bloc utile tant que le périmètre n’est pas achevé.

## Interdiction d’arrêt conversationnel

Aucun message de progression, commentaire, justification, résumé, promesse, accusé de lecture ou notification de fin intermédiaire ne doit interrompre la production.

Le fil utilisateur ne reçoit un message que dans l’un des cas suivants :

1. validation humaine réellement indispensable ;
2. décision stratégique non déductible du cadrage existant ;
3. risque juridique, financier, public ou irréversible ;
4. donnée source obligatoire introuvable et impossible à remplacer sans invention ;
5. publication publique ou fusion explicitement soumise à autorisation humaine.

En dehors de ces cas, la production continue sans message.

## Chaîne d’exécution obligatoire

Pour chaque bloc de travail :

1. lire l’état réel du dépôt et des sources disponibles ;
2. identifier le prochain chantier utile ;
3. créer une branche dédiée ;
4. produire le lot ;
5. exécuter les contrôles automatiques ;
6. corriger jusqu’au succès ;
7. fusionner lorsque les règles du projet l’autorisent ;
8. vérifier la fusion et la CI sur la branche cible ;
9. inscrire le nouvel état dans le registre de continuité ;
10. reprendre immédiatement au chantier suivant.

## Règle de continuité

Une pull request fusionnée ne constitue jamais une fin de tâche. Elle constitue uniquement un point de reprise vérifié.

Un contrôle CI réussi ne constitue jamais une fin de tâche. Il autorise le passage au chantier suivant.

Un lot terminé ne déclenche aucun message utilisateur tant qu’aucune validation humaine n’est nécessaire.

## Règle de reprise

À chaque nouvelle exécution, le travail reprend à partir :

- du dernier commit réellement fusionné ;
- du dernier état CI vérifié ;
- du registre `ops/continuous-task-state.json` ;
- des contraintes permanentes du projet LMI ;
- des blocages humains encore ouverts.

## Priorité d’exécution

L’ordre par défaut est :

1. corriger toute régression ou CI en échec ;
2. terminer le chantier actif ;
3. renforcer les contrôles automatiques ;
4. traiter les incohérences de navigation, accessibilité, sécurité et rendu ;
5. avancer vers la recette humaine finale ;
6. préparer le lot suivant sans publication publique.

## Protection du site public

Aucune publication, activation, mise en ligne, modification du domaine public, commande réelle, paiement réel ou action irréversible ne peut être exécuté sans autorisation humaine explicite.

## Silence opérationnel

Le mode normal est : travailler, vérifier, corriger, fusionner, reprendre.

Le mode exceptionnel est : demander une validation humaine.

## Registre obligatoire

Le fichier `ops/continuous-task-state.json` doit toujours indiquer :

- le chantier actif ;
- le dernier commit fusionné vérifié ;
- le dernier contrôle CI connu ;
- le prochain bloc à exécuter ;
- les validations humaines requises ;
- le statut public, qui doit rester bloqué sans ordre explicite.

## Critère de fin réelle

Une séquence ne s’arrête que lorsque :

- le périmètre demandé est entièrement terminé ;
- tous les contrôles sont réussis ;
- aucune correction utile ne reste ouverte ;
- le prochain acte exige une validation humaine ;
- ou une limite technique externe empêche objectivement toute poursuite.

Dans les quatre premiers cas, seul le besoin de validation humaine justifie un message utilisateur.
