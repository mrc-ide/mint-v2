import asyncio
import os
import signal
from concurrent.futures.process import BrokenProcessPool
from unittest.mock import patch

import pandas as pd
import pytest
from fastapi import HTTPException

from app.models import EmulatorRequest, EmulatorResponse
from app.services.emulator import run_emulator_model
from app.services.emulator_pool import DEFAULT_EMULATOR_WORKERS, EmulatorPool, get_emulator_workers


def sorted_records(response: EmulatorResponse):
    """Scenario order follows set iteration, which varies between processes, so compare records ignoring order."""
    return (
        sorted((p.scenario, p.days, p.prevalence) for p in response.prevalence),
        sorted((c.scenario, c.year, c.casesPer1000) for c in response.cases),
        response.eirValid,
    )


class TestGetEmulatorWorkers:
    def test_defaults_when_env_var_not_set(self, monkeypatch):
        monkeypatch.delenv("EMULATOR_WORKERS", raising=False)

        assert get_emulator_workers() == DEFAULT_EMULATOR_WORKERS

    def test_reads_env_var(self, monkeypatch):
        monkeypatch.setenv("EMULATOR_WORKERS", "5")

        assert get_emulator_workers() == 5


class TestInProcessPool:
    @patch("app.services.emulator_pool.preload_models")
    def test_start_preloads_models_in_process(self, mock_preload):
        pool = EmulatorPool(workers=0)

        asyncio.run(pool.start())

        mock_preload.assert_called_once()
        assert pool._executor is None

    def test_run_matches_direct_call(self, emulator_request: EmulatorRequest):
        result = asyncio.run(EmulatorPool(workers=0).run(emulator_request))

        assert sorted_records(result) == sorted_records(run_emulator_model(emulator_request))

    @patch("app.services.emulator_pool.run_emulator_scenarios", return_value=pd.DataFrame())
    def test_run_raises_post_processing_errors(self, _mock_run, emulator_request: EmulatorRequest):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(EmulatorPool(workers=0).run(emulator_request))

        assert exc_info.value.status_code == 500


class TestProcessPool:
    def test_runs_in_worker_and_recovers_when_worker_dies(self, emulator_request: EmulatorRequest):
        expected = sorted_records(run_emulator_model(emulator_request))

        async def scenario():
            pool = EmulatorPool(workers=1)
            await pool.start()
            try:
                assert sorted_records(await pool.run(emulator_request)) == expected

                for process in list(pool._executor._processes.values()):
                    os.kill(process.pid, signal.SIGKILL)
                with pytest.raises(BrokenProcessPool):
                    await pool.run(emulator_request)

                assert sorted_records(await pool.run(emulator_request)) == expected
            finally:
                pool.shutdown()

        asyncio.run(scenario())
