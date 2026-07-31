# CDM

Application de suivi des collectes de déchets ménagers.

## Lancer

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 10000
```

## API

- `GET /health`
- `GET /api/collectes`
- `POST /api/collectes`
- `GET /api/vehicules`
- `POST /api/vehicules`
