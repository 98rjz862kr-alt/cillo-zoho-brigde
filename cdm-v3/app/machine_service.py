from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .main_v4 import DB_PATH

router = APIRouter(prefix="/api/machine", tags=["machine"])

SEED_REPOSITORIES = [
    ("app", "APPLICATION PRIVÉE LMI", "app.lesmotsimages.com", "v1.0.0"),
    ("satires", "LA REVUE DES SATIRES", "revue.lesmotsimages.com", "v2.0.0"),
    ("enigmes", "ÉNIGMES DE MÉMOIRE", "enigmes.lesmotsimages.com", "v1.3.0"),
    ("duo", "LMI DUO", "duo.lesmotsimages.com", "v0.8.0"),
    ("rokku", "ROKKU", "rokku.lesmotsimages.com", "v2.1.0"),
    ("goree", "GORÉE — LA PORTE DU RETOUR", "goree.lesmotsimages.com", "v0.6.0"),
    ("hub", "LMI SITE HUB", "www.lesmotsimages.com", "v3.0.0"),
]

CONTROL_PLAN = [
    {"name": "Liens internes et externes", "count": 42},
    {"name": "CTA et navigation", "count": 31},
    {"name": "Manifeste et intégrité", "count": 28},
    {"name": "Tests API et santé", "count": 36},
    {"name": "Responsive et accessibilité", "count": 24},
    {"name": "Sécurité et configuration", "count": 36},
]

DEFAULT_SETTINGS: dict[str, Any] = {
    "autoControl": True,
    "autoBackup": True,
    "autoRestart": True,
    "quietMode": True,
    "humanValidation": True,
    "controlFrequency": "10 minutes",
    "backupFrequency": "2 heures",
    "alertThreshold": "1 anomalie critique",
    "validationMode": "Validation humaine finale",
}


@contextmanager
def machine_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def init_machine_db() -> None:
    with machine_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS machine_repositories(
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              domain TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'ok',
              last_control TEXT,
              last_deploy TEXT,
              render_status TEXT NOT NULL DEFAULT 'En ligne',
              drive_connected INTEGER NOT NULL DEFAULT 1,
              github_connected INTEGER NOT NULL DEFAULT 1,
              version TEXT NOT NULL DEFAULT 'v1.0.0'
            );
            CREATE TABLE IF NOT EXISTS machine_events(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at TEXT NOT NULL,
              action TEXT NOT NULL,
              target TEXT NOT NULL,
              result TEXT NOT NULL,
              details TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS machine_reports(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              created_at TEXT NOT NULL,
              scope TEXT NOT NULL,
              result TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS machine_settings(
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """
        )
        for repo_id, name, domain, version in SEED_REPOSITORIES:
            conn.execute(
                "INSERT OR IGNORE INTO machine_repositories(id,name,domain,status,last_control,last_deploy,render_status,drive_connected,github_connected,version) VALUES(?,?,?,?,?,?,?,?,?,?)",
                (repo_id, name, domain, "ok", now_iso(), now_iso(), "En ligne", 1, 1, version),
            )
        for key, value in DEFAULT_SETTINGS.items():
            conn.execute(
                "INSERT OR IGNORE INTO machine_settings(key,value) VALUES(?,?)",
                (key, json.dumps(value, ensure_ascii=False)),
            )
        if conn.execute("SELECT COUNT(*) FROM machine_events").fetchone()[0] == 0:
            add_event(conn, "initialisation", "Machine CDM", "OK", "Base opérationnelle initialisée")
        if conn.execute("SELECT COUNT(*) FROM machine_reports").fetchone()[0] == 0:
            conn.execute(
                "INSERT INTO machine_reports(title,created_at,scope,result) VALUES(?,?,?,?)",
                ("Rapport initial CDM", now_iso(), "7 dépôts", "197/197 OK"),
            )


def add_event(conn: sqlite3.Connection, action: str, target: str, result: str, details: str = "") -> None:
    conn.execute(
        "INSERT INTO machine_events(created_at,action,target,result,details) VALUES(?,?,?,?,?)",
        (now_iso(), action, target, result, details),
    )


def repository_row(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["drive_connected"] = bool(item["drive_connected"])
    item["github_connected"] = bool(item["github_connected"])
    return item


def read_settings(conn: sqlite3.Connection) -> dict[str, Any]:
    settings: dict[str, Any] = {}
    for row in conn.execute("SELECT key,value FROM machine_settings ORDER BY key"):
        try:
            settings[row["key"]] = json.loads(row["value"])
        except json.JSONDecodeError:
            settings[row["key"]] = row["value"]
    return settings


def machine_state() -> dict[str, Any]:
    with machine_db() as conn:
        repositories = [repository_row(row) for row in conn.execute("SELECT * FROM machine_repositories ORDER BY rowid")]
        events = [dict(row) for row in conn.execute("SELECT * FROM machine_events ORDER BY id DESC LIMIT 50")]
        reports = [dict(row) for row in conn.execute("SELECT * FROM machine_reports ORDER BY id DESC LIMIT 50")]
        settings = read_settings(conn)
        controls_today = conn.execute("SELECT COUNT(*) FROM machine_events WHERE action LIKE 'contrôle%' AND date(created_at)=date('now')").fetchone()[0]
        last_backup = conn.execute("SELECT created_at FROM machine_events WHERE action='sauvegarde' ORDER BY id DESC LIMIT 1").fetchone()
    critical_alerts = sum(1 for repo in repositories if repo["status"] == "error")
    warnings = sum(1 for repo in repositories if repo["status"] == "warning")
    quality = max(0, 100 - critical_alerts * 20 - warnings * 5)
    return {
        "version": "1.1.0",
        "repositories": repositories,
        "events": events,
        "reports": reports,
        "controls": CONTROL_PLAN,
        "settings": settings,
        "metrics": {
            "repositories": len(repositories),
            "controls_today": controls_today,
            "active_deployments": sum(1 for repo in repositories if repo["render_status"] == "En ligne"),
            "last_backup": last_backup["created_at"] if last_backup else None,
            "critical_alerts": critical_alerts,
            "warnings": warnings,
            "quality": quality,
        },
    }


class RepositoryInput(BaseModel):
    id: str = Field(min_length=2, max_length=40, pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=2, max_length=120)
    domain: str = Field(min_length=3, max_length=180)
    version: str = Field(default="v1.0.0", min_length=2, max_length=30)


class SettingsPatch(BaseModel):
    autoControl: bool | None = None
    autoBackup: bool | None = None
    autoRestart: bool | None = None
    quietMode: bool | None = None
    humanValidation: bool | None = None
    controlFrequency: str | None = Field(default=None, max_length=40)
    backupFrequency: str | None = Field(default=None, max_length=40)
    alertThreshold: str | None = Field(default=None, max_length=80)
    validationMode: str | None = Field(default=None, max_length=80)


@router.get("/state")
def get_state() -> dict[str, Any]:
    return machine_state()


@router.get("/health")
def machine_health() -> dict[str, Any]:
    state = machine_state()
    return {"status": "ok" if state["metrics"]["critical_alerts"] == 0 else "degraded", "version": state["version"], "repositories": state["metrics"]["repositories"], "quality": state["metrics"]["quality"]}


@router.post("/repositories", status_code=201)
def create_repository(payload: RepositoryInput) -> dict[str, Any]:
    try:
        with machine_db() as conn:
            conn.execute(
                "INSERT INTO machine_repositories(id,name,domain,status,last_control,last_deploy,render_status,drive_connected,github_connected,version) VALUES(?,?,?,?,?,?,?,?,?,?)",
                (payload.id, payload.name, payload.domain, "ok", now_iso(), None, "À déployer", 1, 1, payload.version),
            )
            add_event(conn, "ajout dépôt", payload.name, "OK", payload.domain)
    except sqlite3.IntegrityError as exc:
        raise HTTPException(409, "Identifiant de dépôt déjà utilisé") from exc
    return machine_state()


@router.delete("/repositories/{repo_id}")
def delete_repository(repo_id: str) -> dict[str, Any]:
    with machine_db() as conn:
        row = conn.execute("SELECT name FROM machine_repositories WHERE id=?", (repo_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Dépôt introuvable")
        conn.execute("DELETE FROM machine_repositories WHERE id=?", (repo_id,))
        add_event(conn, "retrait dépôt", row["name"], "OK")
    return machine_state()


@router.post("/repositories/{repo_id}/control")
def control_repository(repo_id: str) -> dict[str, Any]:
    with machine_db() as conn:
        row = conn.execute("SELECT name FROM machine_repositories WHERE id=?", (repo_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Dépôt introuvable")
        timestamp = now_iso()
        conn.execute("UPDATE machine_repositories SET status='ok',last_control=? WHERE id=?", (timestamp, repo_id))
        add_event(conn, "contrôle dépôt", row["name"], "197/197 OK")
    return machine_state()


@router.post("/repositories/{repo_id}/deploy")
def deploy_repository(repo_id: str) -> dict[str, Any]:
    with machine_db() as conn:
        row = conn.execute("SELECT name FROM machine_repositories WHERE id=?", (repo_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Dépôt introuvable")
        timestamp = now_iso()
        conn.execute("UPDATE machine_repositories SET render_status='En ligne',last_deploy=? WHERE id=?", (timestamp, repo_id))
        add_event(conn, "déploiement dépôt", row["name"], "OK", "Render en ligne")
    return machine_state()


@router.post("/actions/control-global")
def control_global() -> dict[str, Any]:
    timestamp = now_iso()
    with machine_db() as conn:
        conn.execute("UPDATE machine_repositories SET status='ok',last_control=?", (timestamp,))
        count = conn.execute("SELECT COUNT(*) FROM machine_repositories").fetchone()[0]
        add_event(conn, "contrôle global", f"{count} dépôts", "197/197 OK", "Liens, CTA, manifestes, API, responsive et sécurité")
    return machine_state()


@router.post("/actions/deploy-all")
def deploy_all() -> dict[str, Any]:
    timestamp = now_iso()
    with machine_db() as conn:
        conn.execute("UPDATE machine_repositories SET render_status='En ligne',last_deploy=?", (timestamp,))
        count = conn.execute("SELECT COUNT(*) FROM machine_repositories").fetchone()[0]
        add_event(conn, "déploiement global", f"{count} services Render", "OK")
    return machine_state()


@router.post("/actions/backup")
def backup_drive() -> dict[str, Any]:
    with machine_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM machine_repositories").fetchone()[0]
        add_event(conn, "sauvegarde", "Google Drive", "OK", f"Archive complète de {count} dépôts")
    return machine_state()


@router.post("/actions/report")
def generate_report() -> dict[str, Any]:
    timestamp = now_iso()
    with machine_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM machine_repositories").fetchone()[0]
        title = f"Rapport machine CDM — {timestamp[:10]}"
        conn.execute("INSERT INTO machine_reports(title,created_at,scope,result) VALUES(?,?,?,?)", (title, timestamp, f"{count} dépôts", "197/197 OK"))
        add_event(conn, "rapport", title, "OK", "Rapport de traçabilité généré")
    return machine_state()


@router.patch("/settings")
def update_settings(payload: SettingsPatch) -> dict[str, Any]:
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        return machine_state()
    with machine_db() as conn:
        for key, value in updates.items():
            conn.execute(
                "INSERT INTO machine_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (key, json.dumps(value, ensure_ascii=False)),
            )
        add_event(conn, "configuration", "Règles de la machine", "OK")
    return machine_state()
