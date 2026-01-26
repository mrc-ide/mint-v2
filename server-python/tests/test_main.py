import json
from pathlib import Path

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
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
