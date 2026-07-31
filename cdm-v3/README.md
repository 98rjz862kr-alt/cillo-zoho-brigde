# CDM v0.3.0

Application FastAPI de pilotage des collectes de déchets ménagers.

## Fonctions

- tableau de bord opérationnel
- collectes et tonnage
- flotte de véhicules
- incidents
- export CSV
- documentation OpenAPI
- déploiement Render par Blueprint

## Démarrage

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Validation

- `/` interface
- `/health` contrôle de santé
- `/docs` API interactive
- `/api/dashboard` indicateurs
