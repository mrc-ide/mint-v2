# Mint-v2 FastAPI Server

This directory contains the FastAPI backend for the Mint v2 - Malaria Intervention Tool. It provides APIs for planning and optimizing malaria interventions.
The main purpose is to call the emulator model and serve the results to the SvelteKit client application.

## Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation) for managing virtual environments and dependencies
- Redis server (for backend functionality)

## Getting Started

**Run FastAPI server in development mode (hot reloading)**:

   ```sh
   uv run fastapi dev
   ```

## Testing

To run the tests, use the following command:

```sh
uv run pytest
```

## Emulator Workers

The emulator is CPU-bound and its models are not thread-safe, so `/emulator/run` sends each request to a pool of worker processes, each holding its own copy of the models. This keeps the event loop (and `/healthz`, `/options`, `/metrics`) responsive while emulator requests run, and lets several requests run in parallel.

Set the number of worker processes with `EMULATOR_WORKERS` (default `2`). `0` runs the emulator inside the server process, one request at a time.

Measured on a 20-core machine:

| | Memory (PSS) | Throughput |
|---|---|---|
| Server process | ~0.2GB | |
| Each worker | ~0.75GB | ~6 requests/s |

Use `EMULATOR_WORKERS = max(1, min((RAM in GB - 0.5) / 0.9, CPU cores / 3))`, rounded down. Each request keeps ~3 cores busy, so more workers than `cores / 3` won't add throughput. For example:

| Machine | Workers |
|---|---|
| 2GB, 2 cores | 1 |
| 4GB, 8 cores | 2 |
| 8GB, 16 cores | 5 |
| 16GB, 32 cores | 10 |

## Emulator Wiring

The server calls `run_scenarios` in [estimint](https://github.com/mrc-ide/estiMINT-python), which derives the latent variables `dn0` and `eir` from the input scenarios. These are passed to the neural network emulator in [stateMINT](https://github.com/mrc-ide/stateMINT), which takes the latent variables and covariates and returns predicted prevalence and cases. The server then formats those results and returns them to the client.
