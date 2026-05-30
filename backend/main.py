"""
RepoGenius — FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.api.routes import router
from backend.auth.routes import router as auth_router
from backend.ingestion.vector_store import get_vector_store
from backend.ingestion.embedder import get_embedder
from backend.ingestion.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    logger.info("RepoGenius starting up …")
    get_vector_store()   # initialise / connect ChromaDB
    embedder = get_embedder()
    embedder._load()     # pre-load sentence-transformer model on startup
    start_scheduler()    # start periodic ingestion scheduler
    logger.info("RepoGenius ready ✓")
    yield
    # ── Shutdown ───────────────────────────────────────────────────────────
    stop_scheduler()
    logger.info("RepoGenius shut down")


app = FastAPI(
    title="RepoGenius",
    description="AI-powered GitHub repository recommendation engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — credentials (cookies) require explicit origin list; wildcard + credentials is blocked by browsers
from backend.config import settings as _settings

_allowed_origins = list({
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    _settings.frontend_url.rstrip("/"),
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,          # Required for Set-Cookie to work cross-origin
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(router)
app.include_router(auth_router)

# Serve frontend static files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        return FileResponse(str(FRONTEND_DIR / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    def catch_all(full_path: str):
        target = FRONTEND_DIR / full_path
        if target.exists() and target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
