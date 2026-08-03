from pathlib import Path

from fastapi.responses import HTMLResponse, RedirectResponse, Response

from .machine_service import init_machine_db, router as machine_router
from .main_v4 import app

app.include_router(machine_router)

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
    html = html.replace("</head>", "<link rel='icon' href='/lmi-brand.svg' type='image/svg+xml'><link rel='stylesheet' href='/lmi-theme.css'></head>")
    html = html.replace('<div class="brand"><div class="brandmark">LMI</div><div><b>CDM MACHINE</b><small>Contrôle & déploiement</small></div></div>', '<div class="brand"><img class="brand-logo" src="/lmi-brand.svg" alt="Les Mots Images — Le Verbe par l’Image"><div class="brand-copy"><b>CDM MACHINE</b><small>Contrôle & déploiement</small></div></div>')
    html = html.replace('<header class="topbar"><h1>Machine de contrôle & déploiement maîtrisé</h1>', '<header class="topbar"><div class="topbar-title"><span class="topbar-emblem">CDM</span><div><h1>Machine de contrôle & déploiement maîtrisé</h1><small>Les Mots Images — Le Verbe par l’Image.</small></div></div>')
    html = html.replace("</main>", "</main><footer class='lmi-footer'><strong>LES MOTS IMAGES</strong> · LE VERBE PAR L’IMAGE. · CDM</footer>")
    html = html.replace("</body>", "<script src='/machine-api.js'></script></body>")
    return HTMLResponse(content=html, headers={"cache-control": "no-store", "x-robots-tag": "noindex, nofollow, noarchive"})


@app.get("/machine-api.js", include_in_schema=False)
def machine_api_client() -> Response:
    content = (Path(__file__).resolve().parent / "machine_api.js").read_text(encoding="utf-8")
    return Response(content=content, media_type="application/javascript", headers={"cache-control": "no-store"})


@app.get("/lmi-theme.css", include_in_schema=False)
def lmi_theme() -> Response:
    content = (Path(__file__).resolve().parent / "lmi-theme.css").read_text(encoding="utf-8")
    return Response(content=content, media_type="text/css", headers={"cache-control": "public, max-age=300"})


@app.get("/lmi-brand.svg", include_in_schema=False)
def lmi_brand() -> Response:
    content = (Path(__file__).resolve().parent / "lmi-brand.svg").read_text(encoding="utf-8")
    return Response(content=content, media_type="image/svg+xml", headers={"cache-control": "public, max-age=300"})
