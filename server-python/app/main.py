from fastapi import FastAPI

from app import version

app = FastAPI(title="My API", version=version)


@app.get("/version")
async def get_version():
    return {"version": version}
