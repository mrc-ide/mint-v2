from fastapi import FastAPI
from minte import __version__ as minte_version

from app import __version__

app = FastAPI(title="My API", version=__version__)


@app.get("/version")
async def get_version():
    return {"serverVersion": __version__, "minteVersion": minte_version}
