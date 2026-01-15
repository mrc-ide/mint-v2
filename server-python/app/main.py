from fastapi import FastAPI
from minte import __version__ as minte_version

from app import __version__

from .models import EmulatorRequest, EmulatorResponse, VersionResponse
from .services.emulator import run_emulator_model
from .services.resources import get_dynamic_form_options

app = FastAPI(title="MINT API", version=__version__)


@app.get("/version")
async def get_version() -> VersionResponse:
    return VersionResponse(server=__version__, minte=minte_version)


@app.get("/healthz")
async def health_check():
    return {"status": "ok"}


@app.get("/dynamic-form-options")
async def dynamic_form_options():
    return get_dynamic_form_options()


@app.post("/emulator/run")
async def run_emulator(emulator_request: EmulatorRequest) -> EmulatorResponse:
    return run_emulator_model(emulator_request)
