# CDM — Collectes de déchets ménagers

Démonstrateur numérique privé du système modulaire de propreté urbaine LMI.

## Principe directeur

**AUTONOME SEUL — PLUS PERFORMANT ENSEMBLE.**

Le système est composé de quatre modules :

- **A — Machine de collecte** : navigation, capteurs, sécurité et collecte autonome, sans dépendance à une corbeille spéciale.
- **B — Corbeille permanente sans sac** : cuve durable et lavable, mesure de remplissage, signalement et compatibilité avec un vidage conventionnel adapté.
- **C — Interface commune** : standard d'accostage LMI mécanique et numérique pour un transfert fermé machine/corbeille.
- **D — Intelligence centrale** : optimisation des priorités et tournées, sans dépendance des fonctions de base.

## Quatre modes

1. Machine seule — collecte autonome classique.
2. Corbeille seule — mobilier permanent sans sac.
3. Machine + corbeille — collecte automatique fermée.
4. Réseau complet + IA — gestion prédictive de la propreté urbaine.

## Surface de validation

- `/` redirige vers `/systeme`.
- `/systeme` présente l'architecture et le simulateur d'accostage.
- `/api/system/state` expose l'état du démonstrateur.
- `/api/system/dock` simule le cycle d'accostage et de transfert fermé.
- `/api/system/optimize` produit une affectation indicative non bloquante.
- `/machine` conserve la console technique de contrôle et de déploiement.
- `/health` contrôle la santé du service.
- `/docs` expose l'API FastAPI.

## Résilience

L'intelligence centrale n'est jamais requise pour la fonction de base. Une panne du service d'optimisation ne supprime ni la capacité locale de la machine, ni la fonction de la corbeille. Le système est conçu pour un déploiement progressif et interopérable.

## Démarrage local

```bash
pip install -r requirements.txt
uvicorn app.main_machine:app --reload
```

## Déploiement

Le Blueprint Render démarre `app.main_machine:app`. Les contrôles automatisés couvrent la console technique, l'API du système modulaire, les quatre modes, la résilience et un cycle de transfert fermé de démonstration.
