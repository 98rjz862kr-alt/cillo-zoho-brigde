from datetime import date
from enum import StrEnum
from itertools import count

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

app = FastAPI(title="CDM", version="0.2.0")


class Statut(StrEnum):
    PLANIFIEE = "planifiee"
    EN_COURS = "en_cours"
    TERMINEE = "terminee"
    ANNULEE = "annulee"


class CollecteIn(BaseModel):
    zone: str = Field(min_length=2, max_length=80)
    date_collecte: date
    vehicule: str = Field(min_length=2, max_length=40)
    statut: Statut = Statut.PLANIFIEE


class Collecte(CollecteIn):
    id: int


class VehiculeIn(BaseModel):
    immatriculation: str = Field(min_length=3, max_length=20)
    capacite_tonnes: float = Field(gt=0, le=100)
    disponible: bool = True


class Vehicule(VehiculeIn):
    id: int


collectes: list[Collecte] = []
vehicules: list[Vehicule] = []
collecte_ids = count(1)
vehicule_ids = count(1)


@app.get("/", response_class=HTMLResponse)
def accueil() -> str:
    return """
<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>CDM</title><style>body{font-family:Arial,sans-serif;max-width:920px;margin:40px auto;padding:0 20px;background:#f4f7f5;color:#173b2b}.card{background:white;padding:24px;border-radius:14px;box-shadow:0 8px 30px #0001;margin:16px 0}a{color:#087f5b}</style></head><body><h1>Collectes de déchets ménagers</h1><div class='card'><h2>Application CDM v0.2.0</h2><p>Planification des collectes et gestion des véhicules.</p><p><a href='/docs'>Ouvrir l'API interactive</a></p></div><div class='card'><p>État du service : opérationnel</p></div></body></html>
"""


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "cdm", "version": "0.2.0"}


@app.get("/api/collectes", response_model=list[Collecte])
def lister_collectes() -> list[Collecte]:
    return collectes


@app.post("/api/collectes", response_model=Collecte, status_code=201)
def creer_collecte(payload: CollecteIn) -> Collecte:
    item = Collecte(id=next(collecte_ids), **payload.model_dump())
    collectes.append(item)
    return item


@app.patch("/api/collectes/{collecte_id}/statut", response_model=Collecte)
def modifier_statut(collecte_id: int, statut: Statut) -> Collecte:
    for index, item in enumerate(collectes):
        if item.id == collecte_id:
            collectes[index] = item.model_copy(update={"statut": statut})
            return collectes[index]
    raise HTTPException(status_code=404, detail="Collecte introuvable")


@app.get("/api/vehicules", response_model=list[Vehicule])
def lister_vehicules() -> list[Vehicule]:
    return vehicules


@app.post("/api/vehicules", response_model=Vehicule, status_code=201)
def creer_vehicule(payload: VehiculeIn) -> Vehicule:
    if any(v.immatriculation.lower() == payload.immatriculation.lower() for v in vehicules):
        raise HTTPException(status_code=409, detail="Immatriculation déjà enregistrée")
    item = Vehicule(id=next(vehicule_ids), **payload.model_dump())
    vehicules.append(item)
    return item
