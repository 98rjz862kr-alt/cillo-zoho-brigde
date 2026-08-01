from pathlib import Path

from fastapi.responses import HTMLResponse, Response

from .machine_service import init_machine_db, router as machine_router
from .main_v4 import app

app.include_router(machine_router)


@app.on_event("startup")
def startup_machine() -> None:
    init_machine_db()


@app.get("/machine", response_class=HTMLResponse)
def machine() -> str:
    base = Path(__file__).resolve().parent
    html = (base / "machine.html").read_text(encoding="utf-8")
    return html.replace("</body>", "<script src='/machine-api.js'></script></body>")


@app.get("/machine-api.js")
def machine_api_client() -> Response:
    content = (Path(__file__).resolve().parent / "machine_api.js").read_text(encoding="utf-8")
    return Response(content=content, media_type="application/javascript")
