from pathlib import Path

from fastapi.responses import HTMLResponse

from .machine_service import init_machine_db, router as machine_router
from .main_v4 import app

app.include_router(machine_router)


@app.on_event("startup")
def startup_machine() -> None:
    init_machine_db()


@app.get("/machine", response_class=HTMLResponse)
def machine() -> str:
    return (Path(__file__).resolve().parent / "machine.html").read_text(encoding="utf-8")
