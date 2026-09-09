from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .main_v4 import DB_PATH

router = APIRouter(prefix="/api/system", tags=["systeme-cdm"])

PRINCIPLE = "AUTONOME SEUL — PLUS PERFORMANT ENSEMBLE."
INTERFACE_STANDARD = "LMI-UCIF v0.1"
TRANSFER_PHASES = [
    "approche",
    "identification",
    "accostage",
    "verrouillage",
    "transfert fermé des déchets",
    "contrôle",
    "rinçage optionnel",
    "déconnexion",
    "départ",
]

MODULES = [
    {
        "id": "A",
        "name": "Machine de collecte",
        "autonomous": True,
        "purpose": "Collecter dans la rue avec navigation, capteurs et sécurité propres, sans dépendre d'une corbeille spéciale.",
        "fallback": "Collecte autonome classique.",
    },
    {
        "id": "B",
        "name": "Corbeille permanente sans sac",
        "autonomous": True,
        "purpose": "Recevoir et conserver les déchets dans une cuve durable, lavable et instrumentée.",
        "fallback": "Vidage par véhicule conventionnel adapté.",
    },
    {
        "id": "C",
        "name": "Interface commune",
        "autonomous": False,
        "purpose": "Rendre machine et corbeille nativement interopérables par un accostage mécanique et numérique normalisé.",
        "fallback": "Mode manuel de secours et découplage sans perte des fonctions de base.",
        "standard": INTERFACE_STANDARD,
    },
    {
        "id": "D",
        "name": "Intelligence centrale",
        "autonomous": False,
        "purpose": "Prévoir les remplissages, proposer les tournées et optimiser l'utilisation du réseau.",
        "fallback": "Aucune dépendance fonctionnelle : machine et corbeille continuent de fonctionner localement.",
    },
]

MODES = [
    {"id": "machine-alone", "name": "Machine seule", "function": "Collecte autonome classique"},
    {"id": "bin-alone", "name": "Corbeille seule", "function": "Corbeille permanente sans sac"},
    {"id": "paired", "name": "Machine + corbeille", "function": "Collecte automatique fermée"},
    {"id": "network-ai", "name": "Réseau complet + IA", "function": "Gestion prédictive de la propreté urbaine"},
]


@contextmanager
def system_db():
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


def init_system_db() -> None:
    with system_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS system_machines(
              id TEXT PRIMARY KEY,
              label TEXT NOT NULL,
              capacity_l REAL NOT NULL,
              remaining_l REAL NOT NULL,
              status TEXT NOT NULL DEFAULT 'disponible',
              navigation_mode TEXT NOT NULL,
              collector_mode TEXT NOT NULL,
              compatible_lmi INTEGER NOT NULL DEFAULT 1,
              last_seen TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS system_bins(
              id TEXT PRIMARY KEY,
              label TEXT NOT NULL,
              capacity_l REAL NOT NULL,
              fill_percent REAL NOT NULL,
              status TEXT NOT NULL DEFAULT 'service',
              compatible_lmi INTEGER NOT NULL DEFAULT 1,
              conventional_service INTEGER NOT NULL DEFAULT 1,
              last_measurement TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS system_transfer_events(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at TEXT NOT NULL,
              machine_id TEXT NOT NULL,
              bin_id TEXT NOT NULL,
              mode TEXT NOT NULL,
              phases_json TEXT NOT NULL,
              before_fill_percent REAL NOT NULL,
              after_fill_percent REAL NOT NULL,
              transferred_l REAL NOT NULL,
              rinse INTEGER NOT NULL DEFAULT 0,
              result TEXT NOT NULL
            );
            """
        )
        ts = now_iso()
        conn.execute(
            "INSERT OR IGNORE INTO system_machines(id,label,capacity_l,remaining_l,status,navigation_mode,collector_mode,compatible_lmi,last_seen) VALUES(?,?,?,?,?,?,?,?,?)",
            ("machine-03", "Machine 03", 450.0, 153.0, "disponible", "autonome", "collecte rue + accostage LMI", 1, ts),
        )
        conn.execute(
            "INSERT OR IGNORE INTO system_machines(id,label,capacity_l,remaining_l,status,navigation_mode,collector_mode,compatible_lmi,last_seen) VALUES(?,?,?,?,?,?,?,?,?)",
            ("machine-05", "Machine 05", 450.0, 450.0, "disponible", "autonome", "collecte rue + accostage LMI", 1, ts),
        )
        conn.execute(
            "INSERT OR IGNORE INTO system_bins(id,label,capacity_l,fill_percent,status,compatible_lmi,conventional_service,last_measurement) VALUES(?,?,?,?,?,?,?,?)",
            ("bin-127", "Corbeille 127", 120.0, 82.0, "service", 1, 1, ts),
        )
        conn.execute(
            "INSERT OR IGNORE INTO system_bins(id,label,capacity_l,fill_percent,status,compatible_lmi,conventional_service,last_measurement) VALUES(?,?,?,?,?,?,?,?)",
            ("bin-214", "Corbeille 214", 120.0, 41.0, "service", 1, 1, ts),
        )


def _machine(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["compatible_lmi"] = bool(item["compatible_lmi"])
    capacity = float(item["capacity_l"] or 0)
    item["remaining_percent"] = round((float(item["remaining_l"]) / capacity) * 100, 1) if capacity else 0.0
    return item


def _bin(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["compatible_lmi"] = bool(item["compatible_lmi"])
    item["conventional_service"] = bool(item["conventional_service"])
    item["estimated_volume_l"] = round(float(item["capacity_l"]) * float(item["fill_percent"]) / 100.0, 1)
    return item


def _event(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["rinse"] = bool(item["rinse"])
    item["phases"] = json.loads(item.pop("phases_json"))
    return item


def _optimization(machines: list[dict[str, Any]], bins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    available = [dict(machine) for machine in machines if machine["status"] == "disponible"]
    urgent = sorted(
        [bin_item for bin_item in bins if bin_item["status"] == "service" and bin_item["fill_percent"] >= 50],
        key=lambda item: (-float(item["fill_percent"]), item["id"]),
    )
    assignments: list[dict[str, Any]] = []
    for bin_item in urgent:
        volume = float(bin_item["estimated_volume_l"])
        candidates = [machine for machine in available if machine["remaining_l"] >= volume]
        if not candidates:
            assignments.append(
                {
                    "bin_id": bin_item["id"],
                    "machine_id": None,
                    "priority": round(float(bin_item["fill_percent"]), 1),
                    "reason": "Aucune capacité mobile suffisante actuellement",
                }
            )
            continue
        selected = min(candidates, key=lambda machine: float(machine["remaining_l"]) - volume)
        selected["remaining_l"] = round(float(selected["remaining_l"]) - volume, 1)
        assignments.append(
            {
                "bin_id": bin_item["id"],
                "machine_id": selected["id"],
                "priority": round(float(bin_item["fill_percent"]), 1),
                "estimated_transfer_l": round(volume, 1),
                "reason": "Priorité au remplissage, avec capacité mobile suffisante",
            }
        )
    return assignments


def system_state() -> dict[str, Any]:
    with system_db() as conn:
        machines = [_machine(row) for row in conn.execute("SELECT * FROM system_machines ORDER BY id")]
        bins = [_bin(row) for row in conn.execute("SELECT * FROM system_bins ORDER BY id")]
        events = [_event(row) for row in conn.execute("SELECT * FROM system_transfer_events ORDER BY id DESC LIMIT 25")]
    return {
        "version": "0.1.0",
        "principle": PRINCIPLE,
        "interface_standard": INTERFACE_STANDARD,
        "modules": MODULES,
        "modes": MODES,
        "interface_phases": TRANSFER_PHASES,
        "machines": machines,
        "bins": bins,
        "events": events,
        "optimization": _optimization(machines, bins),
        "resilience": {
            "ai_required_for_base_operation": False,
            "machine_base_operation_without_network": True,
            "bin_base_operation_without_network": True,
            "conventional_emptying_supported": True,
        },
        "metrics": {
            "machines": len(machines),
            "bins": len(bins),
            "bins_over_70_percent": sum(1 for item in bins if item["fill_percent"] >= 70),
            "compatible_bins": sum(1 for item in bins if item["compatible_lmi"]),
            "transfer_events": len(events),
        },
    }


class BinFillPatch(BaseModel):
    fill_percent: float = Field(ge=0, le=100)


class MachineCapacityPatch(BaseModel):
    remaining_percent: float = Field(ge=0, le=100)


class DockRequest(BaseModel):
    machine_id: str = Field(min_length=2, max_length=60)
    bin_id: str = Field(min_length=2, max_length=60)
    rinse: bool = False
    manual_fallback: bool = False


@router.get("/state")
def get_state() -> dict[str, Any]:
    return system_state()


@router.get("/health")
def system_health() -> dict[str, Any]:
    state = system_state()
    return {
        "status": "ok",
        "version": state["version"],
        "principle": state["principle"],
        "machines": state["metrics"]["machines"],
        "bins": state["metrics"]["bins"],
        "ai_required_for_base_operation": False,
    }


@router.patch("/bins/{bin_id}/fill")
def update_bin_fill(bin_id: str, payload: BinFillPatch) -> dict[str, Any]:
    with system_db() as conn:
        row = conn.execute("SELECT id FROM system_bins WHERE id=?", (bin_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Corbeille introuvable")
        conn.execute(
            "UPDATE system_bins SET fill_percent=?,last_measurement=? WHERE id=?",
            (payload.fill_percent, now_iso(), bin_id),
        )
    return system_state()


@router.patch("/machines/{machine_id}/capacity")
def update_machine_capacity(machine_id: str, payload: MachineCapacityPatch) -> dict[str, Any]:
    with system_db() as conn:
        row = conn.execute("SELECT capacity_l FROM system_machines WHERE id=?", (machine_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Machine introuvable")
        remaining_l = float(row["capacity_l"]) * payload.remaining_percent / 100.0
        conn.execute(
            "UPDATE system_machines SET remaining_l=?,last_seen=? WHERE id=?",
            (remaining_l, now_iso(), machine_id),
        )
    return system_state()


@router.post("/optimize")
def optimize_network() -> dict[str, Any]:
    state = system_state()
    return {
        "status": "advisory",
        "dependency": "non bloquante",
        "assignments": state["optimization"],
        "fallback": "Les équipements conservent leurs fonctions locales si ce service est indisponible.",
    }


@router.post("/dock")
def dock_and_transfer(payload: DockRequest) -> dict[str, Any]:
    with system_db() as conn:
        machine_row = conn.execute("SELECT * FROM system_machines WHERE id=?", (payload.machine_id,)).fetchone()
        bin_row = conn.execute("SELECT * FROM system_bins WHERE id=?", (payload.bin_id,)).fetchone()
        if not machine_row:
            raise HTTPException(404, "Machine introuvable")
        if not bin_row:
            raise HTTPException(404, "Corbeille introuvable")
        machine = _machine(machine_row)
        bin_item = _bin(bin_row)
        if machine["status"] != "disponible":
            raise HTTPException(409, "Machine indisponible")
        if not payload.manual_fallback and (not machine["compatible_lmi"] or not bin_item["compatible_lmi"]):
            raise HTTPException(409, "Accostage LMI incompatible ; utiliser le mode manuel de secours")
        transfer_l = float(bin_item["estimated_volume_l"])
        if transfer_l <= 0:
            raise HTTPException(409, "Corbeille déjà vide")
        if float(machine["remaining_l"]) < transfer_l:
            raise HTTPException(409, "Capacité restante insuffisante pour un transfert fermé complet")

        before = float(bin_item["fill_percent"])
        after = 0.0
        remaining = round(float(machine["remaining_l"]) - transfer_l, 1)
        conn.execute(
            "UPDATE system_machines SET remaining_l=?,last_seen=? WHERE id=?",
            (remaining, now_iso(), payload.machine_id),
        )
        conn.execute(
            "UPDATE system_bins SET fill_percent=?,last_measurement=? WHERE id=?",
            (after, now_iso(), payload.bin_id),
        )
        phases = list(TRANSFER_PHASES)
        if not payload.rinse:
            phases[6] = "rinçage non requis"
        mode = "manuel_secours" if payload.manual_fallback else "automatique_LMI"
        conn.execute(
            "INSERT INTO system_transfer_events(created_at,machine_id,bin_id,mode,phases_json,before_fill_percent,after_fill_percent,transferred_l,rinse,result) VALUES(?,?,?,?,?,?,?,?,?,?)",
            (
                now_iso(),
                payload.machine_id,
                payload.bin_id,
                mode,
                json.dumps(phases, ensure_ascii=False),
                before,
                after,
                transfer_l,
                int(payload.rinse),
                "OK — transfert fermé terminé",
            ),
        )
        event_row = conn.execute("SELECT * FROM system_transfer_events ORDER BY id DESC LIMIT 1").fetchone()
    return {"event": _event(event_row), "state": system_state()}


@router.post("/demo/reset")
def reset_demo() -> dict[str, Any]:
    with system_db() as conn:
        conn.execute("UPDATE system_machines SET remaining_l=153.0,status='disponible',last_seen=? WHERE id='machine-03'", (now_iso(),))
        conn.execute("UPDATE system_machines SET remaining_l=450.0,status='disponible',last_seen=? WHERE id='machine-05'", (now_iso(),))
        conn.execute("UPDATE system_bins SET fill_percent=82.0,status='service',last_measurement=? WHERE id='bin-127'", (now_iso(),))
        conn.execute("UPDATE system_bins SET fill_percent=41.0,status='service',last_measurement=? WHERE id='bin-214'", (now_iso(),))
        conn.execute("DELETE FROM system_transfer_events")
    return system_state()
