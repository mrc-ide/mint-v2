# Mint-v2 FastAPI Server

This directory contains the FastAPI backend for the Mint v2 - Malaria Intervention Tool. It provides APIs for planning and optimizing malaria interventions.
The main purpose is to call the Minte emulator model and serve the results to the SvelteKit client application.

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
