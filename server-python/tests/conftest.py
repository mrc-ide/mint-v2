import pytest

from app.models import EmulatorRequest, ItnFutureType


@pytest.fixture
def emulator_request():
    return EmulatorRequest(
        is_seasonal=1.0,
        current_malaria_prevalence=50.0,
        preference_for_biting_in_bed=79.0,
        preference_for_biting=82.0,
        pyrethroid_resistance=30.0,
        py_only=5.0,
        py_pbo=10.0,
        py_pyrrole=5.0,
        py_ppf=5.0,
        irs_coverage=10.0,
        itn_future=40.0,
        itn_future_types={ItnFutureType.py_only, ItnFutureType.py_pbo},
        routine_coverage=1.0,
        irs_future=15.0,
        lsm=15.0,
    )
