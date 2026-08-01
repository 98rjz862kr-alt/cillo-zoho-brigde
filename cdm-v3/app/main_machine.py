from pathlib import Path

from fastapi.responses import HTMLResponse

from .main_v4 import app


@app.get("/machine", response_class=HTMLResponse)
def machine() -> str:
    return (Path(__file__).resolve().parent / "machine.html").read_text(encoding="utf-8")
