from pydantic import BaseModel


class VersionResponse(BaseModel):
    server: str
    minte: str
