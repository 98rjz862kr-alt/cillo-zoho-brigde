import os
from pathlib import Path

os.environ["CDM_DB_PATH"] = "/tmp/cdm-test-machine.sqlite3"

from fastapi.testclient import TestClient

from app.main_machine import app


def setup_module():
    path = Path(os.environ["CDM_DB_PATH"])
    if path.exists():
        path.unlink()


def test_machine_state_and_health():
    with TestClient(app) as client:
        state = client.get("/api/machine/state")
        assert state.status_code == 200
        payload = state.json()
        assert payload["version"] == "1.1.0"
        assert payload["metrics"]["repositories"] >= 7
        assert payload["metrics"]["quality"] == 100

        health = client.get("/api/machine/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"


def test_machine_actions_are_persisted():
    with TestClient(app) as client:
        assert client.post("/api/machine/actions/control-global").status_code == 200
        assert client.post("/api/machine/actions/deploy-all").status_code == 200
        assert client.post("/api/machine/actions/backup").status_code == 200
        report = client.post("/api/machine/actions/report")
        assert report.status_code == 200
        payload = report.json()
        assert payload["reports"]
        assert any(event["action"] == "sauvegarde" for event in payload["events"])


def test_repository_lifecycle_and_settings():
    with TestClient(app) as client:
        created = client.post(
            "/api/machine/repositories",
            json={
                "id": "prototype-test",
                "name": "PROTOTYPE TEST",
                "domain": "test.example.com",
                "version": "v0.1.0",
            },
        )
        assert created.status_code == 201
        assert any(repo["id"] == "prototype-test" for repo in created.json()["repositories"])

        controlled = client.post("/api/machine/repositories/prototype-test/control")
        assert controlled.status_code == 200
        deployed = client.post("/api/machine/repositories/prototype-test/deploy")
        assert deployed.status_code == 200

        settings = client.patch(
            "/api/machine/settings",
            json={"controlFrequency": "5 minutes", "quietMode": True},
        )
        assert settings.status_code == 200
        assert settings.json()["settings"]["controlFrequency"] == "5 minutes"

        deleted = client.delete("/api/machine/repositories/prototype-test")
        assert deleted.status_code == 200
        assert not any(repo["id"] == "prototype-test" for repo in deleted.json()["repositories"])
