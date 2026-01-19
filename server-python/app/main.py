from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from minte import __version__ as minte_version
from prometheus_client import Summary, Counter, Gauge, make_asgi_app, Histogram

from app import __version__

from .models import EmulatorRequest, EmulatorResponse, Response, Version
from .services.emulator import run_emulator_model
from .services.resources import get_dynamic_form_options
import time
import random

app = FastAPI(title="MINT API", version=__version__)
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])

REQUEST_LATENCY = Histogram("http_request_duration_seconds", "Request latency", ["method", "endpoint"])

ACTIVE_REQUESTS = Gauge("active_requests", "In-flight requests", ["endpoint"])


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    ACTIVE_REQUESTS.labels(endpoint=request.url.path).inc()
    start_time = time.time()

    response = await call_next(request)

    REQUEST_LATENCY.labels(endpoint=request.url.path, method=request.method).observe(time.time() - start_time)
    REQUEST_COUNT.labels(endpoint=request.url.path, method=request.method, status=response.status_code).inc()
    ACTIVE_REQUESTS.labels(endpoint=request.url.path).dec()
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_req, exc: RequestValidationError):
    message = "Validation errors: "
    for error in exc.errors():
        message += f"{error['loc']}: {error['msg']}; "
    return JSONResponse(status_code=400, content={"detail": message.rstrip("; ")})


@app.exception_handler(500)
async def internal_server_error_handler(_req, _exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# TODO: Remove this unstable endpoint after testing
@app.get("/unstable")
def unstable():
    # Simulate errors
    if random.random() < 0.3:
        raise HTTPException(status_code=500, detail="Simulated server error")
    time.sleep(random.random() * 2)
    return {"message": "sometimes slow, sometimes broken"}


@app.get("/version")
async def get_version() -> Response[Version]:
    time.sleep(5)
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
