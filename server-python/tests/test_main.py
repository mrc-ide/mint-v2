import json
from pathlib import Path

from fastapi import status
from fastapi.testclient import TestClient

from app.main import ACTIVE_REQUESTS, REQUEST_COUNT, REQUEST_LATENCY, app
from app.models import EmulatorRequest

client = TestClient(app)


def test_get_version():
    response = client.get("/version")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"data": {"server": "1.0.0", "minte": "1.3.1"}}


def test_health_check():
    response = client.get("/healthz")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"data": {"status": "ok"}}


def test_dynamic_form_options():
    options_path = Path(__file__).parent.parent / "app" / "resources" / "dynamicFormOptions.json"
    with open(options_path) as f:
        expected_options = json.load(f)

    response = client.get("/options")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["data"] == expected_options


def test_run_emulator(emulator_request: EmulatorRequest):
    req_data = emulator_request.model_dump(exclude={"net_type_future"}, by_alias=True)
    req_data["itn_future_types"] = [net_type.value for net_type in emulator_request.net_type_future]
    response = client.post("/emulator/run", json=req_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()["data"]
    assert "prevalence" in data
    assert "cases" in data
    assert "eirValid" in data


def test_validation_error(emulator_request: EmulatorRequest):
    req_data = emulator_request.model_dump(exclude={"net_type_future"}, by_alias=True)

    response = client.post("/emulator/run", json=req_data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Validation errors: ('body', 'itn_future_types'): Field required"


def test_metrics_endpoint():
    response = client.get("/metrics")

    assert response.status_code == status.HTTP_200_OK
    assert b"http_requests_total" in response.content
    assert b"http_requests_duration_seconds" in response.content
    assert b"http_requests_in_flight" in response.content


def test_metrics_middleware_tracks_success():
    labels = {"method": "GET", "endpoint": "/healthz"}
    initial_count = REQUEST_COUNT.labels(**labels, status=200)._value.get()
    initial_latency = REQUEST_LATENCY.labels(**labels)._sum.get()
    initial_active = ACTIVE_REQUESTS.labels(**labels)._value.get()

    response = client.get("/healthz")

    assert response.status_code == status.HTTP_200_OK

    final_count = REQUEST_COUNT.labels(**labels, status=200)._value.get()
    assert final_count == initial_count + 1

    final_latency = REQUEST_LATENCY.labels(**labels)._sum.get()
    assert final_latency > initial_latency

    final_active = ACTIVE_REQUESTS.labels(**labels)._value.get()
    assert final_active == initial_active


def test_metrics_middleware_tracks_validation_errors(emulator_request: EmulatorRequest):
    labels = {"method": "POST", "endpoint": "/emulator/run", "status": 400}
    initial_count = REQUEST_COUNT.labels(**labels)._value.get()

    req_data = emulator_request.model_dump(exclude={"net_type_future"}, by_alias=True)
    response = client.post("/emulator/run", json=req_data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST

    final_count = REQUEST_COUNT.labels(**labels)._value.get()
    assert final_count == initial_count + 1


def test_metrics_middleware_tracks_exceptions():
    labels = {"method": "GET", "endpoint": "/cause-error"}
    initial_count = REQUEST_COUNT.labels(**labels, status=500)._value.get()
    initial_latency = REQUEST_LATENCY.labels(**labels)._sum.get()
    initial_active = ACTIVE_REQUESTS.labels(**labels)._value.get()

    @app.get("/cause-error")
    async def cause_error():
        raise ValueError("Intentional error for testing")

    try:
        client.get("/cause-error")
    except Exception:
        pass

    final_count = REQUEST_COUNT.labels(**labels, status=500)._value.get()
    assert final_count == initial_count + 1

    final_latency = REQUEST_LATENCY.labels(**labels)._sum.get()
    assert final_latency > initial_latency

    final_active = ACTIVE_REQUESTS.labels(**labels)._value.get()
    assert final_active == initial_active
