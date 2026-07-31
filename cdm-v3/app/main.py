from __future__ import annotations

import csv
import io
import sqlite3
from contextlib import contextmanager
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "cdm.sqlite3"
app = FastAPI(title="CDM", version="0.3.0")


@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS collectes(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              code TEXT UNIQUE NOT NULL,
              zone TEXT NOT NULL,
              date_collecte TEXT NOT NULL,
              vehicule TEXT,
              statut TEXT NOT NULL DEFAULT 'planifiee',
              tonnage_kg REAL NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS vehicules(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              immatriculation TEXT UNIQUE NOT NULL,
              libelle TEXT NOT NULL,
              capacite_kg REAL NOT NULL,
              statut TEXT NOT NULL DEFAULT 'disponible'
            );
            CREATE TABLE IF NOT EXISTS incidents(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              collecte_id INTEGER,
              description TEXT NOT NULL,
              severite TEXT NOT NULL DEFAULT 'faible',
              statut TEXT NOT NULL DEFAULT 'ouvert'
            );
            """
        )


@app.on_event("startup")
def startup() -> None:
    init_db()


class CollecteIn(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    zone: str = Field(min_length=2, max_length=120)
    date_collecte: date
    vehicule: str | None = None
    statut: str = "planifiee"
    tonnage_kg: float = Field(default=0, ge=0)


class VehiculeIn(BaseModel):
    immatriculation: str = Field(min_length=3, max_length=30)
    libelle: str = Field(min_length=2, max_length=120)
    capacite_kg: float = Field(gt=0)
    statut: str = "disponible"


class IncidentIn(BaseModel):
    collecte_id: int | None = None
    description: str = Field(min_length=5, max_length=500)
    severite: str = "faible"


def rows(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db() as conn:
        return [dict(r) for r in conn.execute(query, params).fetchall()]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.3.0"}


@app.get("/api/dashboard")
def dashboard() -> dict[str, Any]:
    with db() as conn:
        c = conn.execute("SELECT COUNT(*) n, COALESCE(SUM(tonnage_kg),0) t FROM collectes").fetchone()
        v = conn.execute("SELECT COUNT(*) n FROM vehicules").fetchone()
        i = conn.execute("SELECT COUNT(*) n FROM incidents WHERE statut!='clos'").fetchone()
    return {"collectes": c["n"], "tonnage_total_kg": c["t"], "vehicules": v["n"], "incidents_ouverts": i["n"]}


@app.get("/api/collectes")
def list_collectes() -> list[dict[str, Any]]:
    return rows("SELECT * FROM collectes ORDER BY date_collecte DESC,id DESC")


@app.post("/api/collectes", status_code=201)
def create_collecte(payload: CollecteIn) -> dict[str, Any]:
    try:
        with db() as conn:
            cur = conn.execute(
                "INSERT INTO collectes(code,zone,date_collecte,vehicule,statut,tonnage_kg) VALUES(?,?,?,?,?,?)",
                (payload.code,payload.zone,payload.date_collecte.isoformat(),payload.vehicule,payload.statut,payload.tonnage_kg),
            )
            return dict(conn.execute("SELECT * FROM collectes WHERE id=?", (cur.lastrowid,)).fetchone())
    except sqlite3.IntegrityError as exc:
        raise HTTPException(409, "Code collecte deja utilise") from exc


@app.patch("/api/collectes/{collecte_id}")
def update_collecte(collecte_id: int, statut: str, tonnage_kg: float | None = None) -> dict[str, Any]:
    with db() as conn:
        current = conn.execute("SELECT * FROM collectes WHERE id=?", (collecte_id,)).fetchone()
        if not current:
            raise HTTPException(404, "Collecte introuvable")
        conn.execute("UPDATE collectes SET statut=?, tonnage_kg=? WHERE id=?", (statut, current["tonnage_kg"] if tonnage_kg is None else tonnage_kg, collecte_id))
        return dict(conn.execute("SELECT * FROM collectes WHERE id=?", (collecte_id,)).fetchone())


@app.get("/api/vehicules")
def list_vehicules() -> list[dict[str, Any]]:
    return rows("SELECT * FROM vehicules ORDER BY immatriculation")


@app.post("/api/vehicules", status_code=201)
def create_vehicule(payload: VehiculeIn) -> dict[str, Any]:
    try:
        with db() as conn:
            cur = conn.execute("INSERT INTO vehicules(immatriculation,libelle,capacite_kg,statut) VALUES(?,?,?,?)", (payload.immatriculation,payload.libelle,payload.capacite_kg,payload.statut))
            return dict(conn.execute("SELECT * FROM vehicules WHERE id=?", (cur.lastrowid,)).fetchone())
    except sqlite3.IntegrityError as exc:
        raise HTTPException(409, "Immatriculation deja utilisee") from exc


@app.get("/api/incidents")
def list_incidents() -> list[dict[str, Any]]:
    return rows("SELECT * FROM incidents ORDER BY id DESC")


@app.post("/api/incidents", status_code=201)
def create_incident(payload: IncidentIn) -> dict[str, Any]:
    with db() as conn:
        cur = conn.execute("INSERT INTO incidents(collecte_id,description,severite) VALUES(?,?,?)", (payload.collecte_id,payload.description,payload.severite))
        return dict(conn.execute("SELECT * FROM incidents WHERE id=?", (cur.lastrowid,)).fetchone())


@app.get("/api/exports/collectes.csv")
def export_collectes() -> StreamingResponse:
    data = list_collectes()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["id","code","zone","date_collecte","vehicule","statut","tonnage_kg"])
    writer.writeheader(); writer.writerows(data)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition":"attachment; filename=collectes.csv"})


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return """<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>CDM</title><style>body{font-family:Arial,sans-serif;margin:0;background:#eef4f0;color:#173b2b}.wrap{max-width:1100px;margin:auto;padding:32px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.card{background:white;padding:20px;border-radius:14px;box-shadow:0 8px 30px #0001}.num{font-size:2rem;font-weight:800}.actions{margin:20px 0;display:flex;gap:10px;flex-wrap:wrap}a,button{background:#0b6b49;color:white;padding:10px 14px;border:0;border-radius:9px;text-decoration:none}.muted{color:#6c7e75}@media(max-width:750px){.grid{grid-template-columns:1fr 1fr}}</style></head><body><div class='wrap'><h1>Collectes de déchets ménagers</h1><p class='muted'>Pilotage opérationnel CDM v0.3.0</p><div class='grid' id='kpis'></div><div class='actions'><a href='/docs'>API interactive</a><a href='/api/exports/collectes.csv'>Exporter CSV</a></div><div class='card'><h2>État du service</h2><p>Application opérationnelle. Les données sont accessibles par l’API.</p></div></div><script>fetch('/api/dashboard').then(r=>r.json()).then(d=>{document.getElementById('kpis').innerHTML=`<div class='card'><div class='num'>${d.collectes}</div>Collectes</div><div class='card'><div class='num'>${d.vehicules}</div>Véhicules</div><div class='card'><div class='num'>${d.incidents_ouverts}</div>Incidents</div><div class='card'><div class='num'>${d.tonnage_total_kg}</div>kg collectés</div>`})</script></body></html>"""
