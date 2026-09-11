from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dams import router as dams_router
from app.api.routes import router

app = FastAPI(
    title="HYDROTRACE",
    description=(
        "Dam-Break Inundation & Decision Intelligence Platform (SIH 2026 · PS 26161). "
        "Terrain-Aware Demonstration Flood Model API. Not a calibrated hydrodynamic solver."
    ),
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"https://hydrotrace\.vercel\.app|"
        r"https://.*\.vercel\.app|"
        r"http://(localhost|127\.0\.0\.1):\d+"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(dams_router, prefix="/api")
