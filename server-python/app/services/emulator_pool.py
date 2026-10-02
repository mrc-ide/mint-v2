import asyncio
import logging
import multiprocessing
import os
from concurrent.futures import ProcessPoolExecutor
from concurrent.futures.process import BrokenProcessPool

from estimint import preload_models
from starlette.concurrency import run_in_threadpool

from app.models import EmulatorRequest, EmulatorResponse
from app.services.emulator import post_process_results, run_emulator_scenarios

logger = logging.getLogger(__name__)

# Each worker process holds its own copy of the models (~700MB once warm).
DEFAULT_EMULATOR_WORKERS = 2

# Representative request (all 11 scenarios) used to JIT-compile the models when a worker starts.
WARM_UP_REQUEST = {
    "is_seasonal": 1.0,
    "current_malaria_prevalence": 30.0,
    "preference_for_biting_in_bed": 79.0,
    "preference_for_biting": 82.0,
    "pyrethroid_resistance": 30.0,
    "py_only": 5.0,
    "py_pbo": 10.0,
    "py_pyrrole": 5.0,
    "py_ppf": 5.0,
    "irs_coverage": 10.0,
    "itn_future": 40.0,
    "itn_future_types": ["py_only", "py_pbo", "py_pyrrole", "py_ppf"],
    "routine_coverage": 1.0,
    "irs_future": 15.0,
    "lsm": 15.0,
    "mosquito_delta": 50,
}


def get_emulator_workers() -> int:
    """Number of emulator worker processes, from the EMULATOR_WORKERS env var. 0 runs the emulator in-process."""
    return int(os.environ.get("EMULATOR_WORKERS", DEFAULT_EMULATOR_WORKERS))


def _init_worker() -> None:
    """Load the models and JIT-compile them so the first real request in this worker is not slow."""
    preload_models()
    run_emulator_scenarios(EmulatorRequest.model_validate(WARM_UP_REQUEST))


class EmulatorPool:
    """Runs the emulator in a pool of worker processes so it neither blocks the event loop nor
    serialises requests. With 0 workers it runs in-process on the threadpool, one request at a time."""

    def __init__(self, workers: int):
        self.workers = workers
        self._executor: ProcessPoolExecutor | None = None

    async def start(self) -> None:
        if self.workers < 1:
            preload_models()
            return

        self._executor = self._new_executor()
        # Submitting one task per worker makes the pool start every process now rather than on demand.
        loop = asyncio.get_running_loop()
        await asyncio.gather(*[loop.run_in_executor(self._executor, os.getpid) for _ in range(self.workers)])

    def shutdown(self) -> None:
        if self._executor is not None:
            self._executor.shutdown(cancel_futures=True)
            self._executor = None

    async def run(self, emulator_request: EmulatorRequest) -> EmulatorResponse:
        if self._executor is None:
            results = await run_in_threadpool(run_emulator_scenarios, emulator_request)
        else:
            results = await self._run_in_worker(emulator_request)
        # Post-processing can raise HTTPException, which cannot be pickled back from a worker, so it runs here.
        return await run_in_threadpool(post_process_results, results)

    async def _run_in_worker(self, emulator_request: EmulatorRequest):
        executor = self._executor
        try:
            return await asyncio.get_running_loop().run_in_executor(executor, run_emulator_scenarios, emulator_request)
        except BrokenProcessPool:
            # A worker died (e.g. OOM-killed), which breaks the whole pool. Replace it so later requests succeed.
            if self._executor is executor:
                logger.error("Emulator worker process died; restarting the pool.")
                executor.shutdown(wait=False, cancel_futures=True)
                self._executor = self._new_executor()
            raise

    def _new_executor(self) -> ProcessPoolExecutor:
        # spawn rather than fork: forking a process that has already started JAX's threads can deadlock.
        return ProcessPoolExecutor(
            max_workers=self.workers,
            mp_context=multiprocessing.get_context("spawn"),
            initializer=_init_worker,
        )


emulator_pool = EmulatorPool(get_emulator_workers())
