from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_version():
    response = client.get("/version")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"version": "1.0.0"}
