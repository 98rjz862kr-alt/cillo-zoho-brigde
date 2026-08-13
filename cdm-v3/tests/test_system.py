import os
from pathlib import Path

os.environ["CDM_DB_PATH"] = "/tmp/cdm-test-machine.sqlite3"

from fastapi.testclient import TestClient

from app.main_machine import app


def setup_module():
    path = Path(os.environ["CDM_DB_PATH"])
    if path.exists():
        path.unlink()


def test_modular_architecture_contract():
    with TestClient(app) as client:
        client.post("/api/system/demo/reset")
        response = client.get("/api/system/state")
        assert response.status_code == 200
        state = response.json()
        assert state["principle"] == "AUTONOME SEUL — PLUS PERFORMANT ENSEMBLE."
        assert [module["id"] for module in state["modules"]] == ["A", "B", "C", "D"]
        assert len(state["modes"]) == 4
        assert len(state["interface_phases"]) == 9
        assert state["resilience"]["ai_required_for_base_operation"] is False
        assert state["resilience"]["machine_base_operation_without_network"] is True
        assert state["resilience"]["bin_base_operation_without_network"] is True


def test_reference_scenario_and_optimizer():
    with TestClient(app) as client:
        state = client.post("/api/system/demo/reset").json()
        bin_127 = next(item for item in state["bins"] if item["id"] == "bin-127")
        bin_214 = next(item for item in state["bins"] if item["id"] == "bin-214")
        machine_03 = next(item for item in state["machines"] if item["id"] == "machine-03")
        assert bin_127["fill_percent"] == 82.0
        assert bin_214["fill_percent"] == 41.0
        assert machine_03["remaining_percent"] == 34.0

        optimized = client.post("/api/system/optimize")
        assert optimized.status_code == 200
        assignments = optimized.json()["assignments"]
        assert assignments[0]["bin_id"] == "bin-127"
        assert assignments[0]["machine_id"] == "machine-03"
        assert optimized.json()["dependency"] == "non bloquante"


def test_closed_docking_cycle_updates_both_modules():
    with TestClient(app) as client:
        client.post("/api/system/demo/reset")
        response = client.post(
            "/api/system/dock",
            json={"machine_id": "machine-05", "bin_id": "bin-127", "rinse": True, "manual_fallback": False},
        )
        assert response.status_code == 200
        payload = response.json()
        event = payload["event"]
        assert event["mode"] == "automatique_LMI"
        assert event["before_fill_percent"] == 82.0
        assert event["after_fill_percent"] == 0.0
        assert event["transferred_l"] == 98.4
        assert len(event["phases"]) == 9
        assert event["phases"][0] == "approche"
        assert event["phases"][-1] == "départ"

        state = payload["state"]
        bin_127 = next(item for item in state["bins"] if item["id"] == "bin-127")
        machine_05 = next(item for item in state["machines"] if item["id"] == "machine-05")
        assert bin_127["fill_percent"] == 0.0
        assert machine_05["remaining_l"] == 351.6


def test_system_assets_and_private_headers():
    with TestClient(app) as client:
        page = client.get("/systeme")
        assert page.status_code == 200
        assert "Quatre modules" in page.text
        assert "/system-api.js" in page.text
        assert page.headers["cache-control"] == "no-store"
        assert page.headers["x-robots-tag"] == "noindex, nofollow, noarchive"

        script = client.get("/system-api.js")
        style = client.get("/system.css")
        assert script.status_code == 200
        assert "/api/system" in script.text
        assert style.status_code == 200
        assert "#143B7D" in style.text

        health = client.get("/api/system/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"
        assert health.json()["ai_required_for_base_operation"] is False
