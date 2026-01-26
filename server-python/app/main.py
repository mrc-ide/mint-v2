import logging

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from minte import __version__ as minte_version

from app import __version__

from .models import EmulatorRequest, EmulatorResponse, Response, Version
from .services.emulator import run_emulator_model
from .services.resources import get_dynamic_form_options

app = FastAPI(title="MINT API", version=__version__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_req, exc: RequestValidationError):
    logger.error(f"Validation error: {exc} ")
    errors = [f"{error['loc']}: {error['msg']}" for error in exc.errors()]
    message = "Validation errors: " + "; ".join(errors)

    return JSONResponse(status_code=400, content={"detail": message.rstrip("; ")})


@app.exception_handler(500)
async def internal_server_error_handler(_req, exc):
    logger.error(f"Internal server error occurred.. {exc} ")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/version")
async def get_version() -> Response[Version]:
    return Response(data=Version(server=__version__, minte=minte_version))


@app.get("/healthz")
async def health_check() -> Response[dict]:
    return Response(data={"status": "ok"})


@app.get("/options")
async def dynamic_form_options() -> Response[dict]:
    return Response(data=get_dynamic_form_options())


@app.post("/emulator/run")
async def run_emulator(emulator_request: EmulatorRequest) -> Response[EmulatorResponse]:
    return Response(data=run_emulator_model(emulator_request))
