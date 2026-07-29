from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="SET Análise Região Leste",
    version="1.0.0",
    description="Análise do mercado de trabalho formal na Região Leste (SET/IDT).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/mapa")
def mapa_page() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "mapa.html")


@app.get("/favicon.ico")
def favicon() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "favicon.svg", media_type="image/svg+xml")


@app.get("/api/meta")
def api_meta() -> dict:
    return {
        "fonte": "Planilha SET Análise Região Leste (Google Sheets)",
        "modelo": "abas=sobre|analise_leste",
        "api": "/mapa?aba=sobre",
        "abas": ["sobre", "analise_leste"],
    }
