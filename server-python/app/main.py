import logging
import time

from estimint import __version__ as estimint_version
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from minte import __version__ as minte_version
from prometheus_client import Counter, Gauge, Histogram, make_asgi_app

from app import __version__

from .models import CompareParametersResponse, EmulatorRequest, EmulatorResponse, Response, Version
from .services.emulator import run_emulator_model
from .services.resources import get_compare_parameters, get_dynamic_form_options

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="MINT API", version=__version__)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("http_requests_duration_seconds", "Request latency", ["method", "endpoint"])
ACTIVE_REQUESTS = Gauge("http_requests_in_flight", "In-flight requests", ["method", "endpoint"])


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    metric_labels = {"method": request.method, "endpoint": request.url.path}
    ACTIVE_REQUESTS.labels(**metric_labels).inc()
    start_time = time.time()

    status_code = 500  # Default to 500 in case of unhandled exceptions
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        REQUEST_LATENCY.labels(**metric_labels).observe(time.time() - start_time)
        REQUEST_COUNT.labels(**metric_labels, status=status_code).inc()
        ACTIVE_REQUESTS.labels(**metric_labels).dec()


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
    return Response(data=Version(server=__version__, minte=minte_version, estimint=estimint_version))


@app.get("/healthz")
async def health_check() -> Response[dict]:
    return Response(data={"status": "ok"})


@app.get("/options")
async def dynamic_form_options() -> Response[dict]:
    return Response(data=get_dynamic_form_options())


@app.post("/emulator/run")
async def run_emulator(emulator_request: EmulatorRequest) -> Response[EmulatorResponse]:
    return Response(data=run_emulator_model(emulator_request))


@app.get("/compare-parameters")
async def compare_parameters() -> Response[CompareParametersResponse]:
    return Response(data=get_compare_parameters())
