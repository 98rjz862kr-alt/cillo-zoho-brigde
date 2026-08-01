from pathlib import Path

from fastapi.responses import HTMLResponse, RedirectResponse, Response

from .machine_service import init_machine_db, router as machine_router
from .main_v4 import app

app.include_router(machine_router)

# The imported collection application already declares a root page. The machine
# prototype is now the primary human-validation surface for this Render service.
for route in list(app.router.routes):
    if getattr(route, "path", None) == "/" and getattr(route, "name", None) == "index":
        app.router.routes.remove(route)


@app.on_event("startup")
def startup_machine() -> None:
    init_machine_db()


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/machine", status_code=307)


@app.get("/machine", response_class=HTMLResponse)
def machine() -> HTMLResponse:
    base = Path(__file__).resolve().parent
    html = (base / "machine.html").read_text(encoding="utf-8")
    html = html.replace("</body>", "<script src='/machine-api.js'></script></body>")
    return HTMLResponse(
        content=html,
        headers={
            "cache-control": "no-store",
            "x-robots-tag": "noindex, nofollow, noarchive",
        },
    )


@app.get("/machine-api.js", include_in_schema=False)
def machine_api_client() -> Response:
    content = (Path(__file__).resolve().parent / "machine_api.js").read_text(encoding="utf-8")
    return Response(
        content=content,
        media_type="application/javascript",
        headers={"cache-control": "no-store"},
    )
