from fastapi import FastAPI
from minte import __version__ as minte_version

from app import __version__

from .models import VersionResponse

app = FastAPI(title="My API", version=__version__)


@app.get("/version")
async def get_version() -> VersionResponse:
    return VersionResponse(server=__version__, minte=minte_version)


@app.get("/healthz")
async def health_check():
    return {"status": "ok"}
