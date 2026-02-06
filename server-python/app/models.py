from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel, Field, TypeAdapter, field_validator

T = TypeVar("T")


class Response(BaseModel, Generic[T]):
    data: T


class Version(BaseModel):
    server: str
    minte: str


class ItnFutureType(Enum):
    py_only = "py_only"
    py_pyrrole = "py_pyrrole"
    py_ppf = "py_ppf"
    py_pbo = "py_pbo"


class EmulatorRequest(BaseModel):
    season: float = Field(alias="is_seasonal")
    prev: float = Field(ge=0, le=100, alias="current_malaria_prevalence")
    phi: float = Field(ge=0, le=100, alias="preference_for_biting_in_bed")
    Q0: float = Field(ge=0, le=100, alias="preference_for_biting")
    res_use: float = Field(ge=0, le=100, alias="pyrethroid_resistance")
    py_only: float = Field(ge=0, le=100)
    py_pbo: float = Field(ge=0, le=100)
    py_pyrrole: float = Field(ge=0, le=100)
    py_ppf: float = Field(ge=0, le=100)
    irs: float = Field(ge=0, le=100, alias="irs_coverage")
    itn_future: float = Field(ge=0, le=100)
    net_type_future: set[ItnFutureType] = Field(alias="itn_future_types")
    routine: float = Field(alias="routine_coverage")
    irs_future: float = Field(ge=0, le=100)
    lsm: float = Field(ge=0, le=100)

    @field_validator(
        "prev",
        "phi",
        "Q0",
        "res_use",
        "py_only",
        "py_pbo",
        "py_pyrrole",
        "py_ppf",
        "irs",
        "itn_future",
        "irs_future",
        "lsm",
        mode="after",
    )
    @classmethod
    def percentage_to_fraction(cls, value: int) -> float:
        return value / 100.0

    @field_validator("season", "routine", mode="after")
    @classmethod
    def convert_bool_to_float(cls, value: bool) -> float:
        return float(value)


class EmulatorScenario(BaseModel):
    scenario_tag: str = "no_intervention"
    res_use: float
    py_only: float
    py_pbo: float
    py_pyrrole: float
    py_ppf: float
    prev: float
    Q0: float
    phi: float
    season: float
    irs: float
    itn_future: float = 0.0
    net_type_future: str | None = None
    irs_future: float = 0.0
    routine: float = 0.0
    lsm: float = 0.0


class Prevalence(BaseModel):
    scenario: str
    days: int
    prevalence: float


prevalence_adapter = TypeAdapter(list[Prevalence])


class Cases(BaseModel):
    scenario: str
    year: int
    casesPer1000: float


cases_adapter = TypeAdapter(list[Cases])


class EmulatorResponse(BaseModel):
    prevalence: list[Prevalence]
    cases: list[Cases]
    eirValid: bool


class CompareParameter(BaseModel):
    parameter_name: str = Field(serialization_alias="parameterName")
    label: str
    min: float
    max: float


class InterventionCompareParameter(CompareParameter):
    linked_cost_name: str = Field(serialization_alias="linkedCostName")
    linked_cost_label: str = Field(serialization_alias="linkedCostLabel")


class CompareParametersResponse(BaseModel):
    baseline_parameters: list[CompareParameter] = Field(serialization_alias="baselineParameters")
    intervention_parameters: list[InterventionCompareParameter] = Field(serialization_alias="interventionParameters")
