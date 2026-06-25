from typing import Annotated

from fastapi import HTTPException
from minte import MintwebResults, run_mintweb_controller
from estimint import run_scenarios
import pandas as pd
import numpy as np
from app.models import EmulatorRequest, EmulatorResponse, EmulatorScenario, cases_adapter, prevalence_adapter


def run_emulator_model(emulator_request: EmulatorRequest) -> EmulatorResponse:
    """Run the emulator model based on the request and return the response."""
    scenarios = build_scenarios(emulator_request)
    results = run_scenarios([scenarios.model_dump() for scenarios in scenarios])
    return post_process_results(results)


def build_scenarios(
    emulator_request: EmulatorRequest,
) -> list[EmulatorScenario]:
    """Build scenarios based on the emulator request."""
    base_scenario = build_base_scenario(emulator_request)
    scenarios = [base_scenario]

    scenarios.extend(build_intervention_scenarios(emulator_request, base_scenario))

    return scenarios


def build_intervention_scenarios(
    emulator_request: EmulatorRequest, base_scenario: EmulatorScenario
) -> list[EmulatorScenario]:
    """Build all intervention scenarios (IRS, LSM, and net types)."""
    scenarios = []

    # IRS only scenario
    if emulator_request.irs_future > 0:
        scenarios.append(
            base_scenario.model_copy(update={"name": "irs_only", "irs_future": emulator_request.irs_future})
        )

    # LSM only scenario
    if emulator_request.lsm > 0:
        scenarios.append(base_scenario.model_copy(update={"name": "lsm_only", "lsm": emulator_request.lsm}))

    # Net type scenarios (with optional LSM)
    scenarios.extend(build_net_scenarios(emulator_request, base_scenario))

    return scenarios


def build_net_scenarios(emulator_request: EmulatorRequest, base_scenario: EmulatorScenario) -> list[EmulatorScenario]:
    """Build scenarios for each net type, with and without LSM."""
    scenarios = []
    for net_type in emulator_request.net_type_future:
        # Net only scenario
        net_scenario = base_scenario.model_copy(
            update={
                "name": f"{net_type.value}_only",
                "net_type_future": net_type.value,
                "itn_future": emulator_request.itn_future,
                "routine": emulator_request.routine,
            }
        )
        scenarios.append(net_scenario)

        # Net with LSM scenario
        if emulator_request.lsm > 0:
            scenarios.append(
                net_scenario.model_copy(
                    update={
                        "name": f"{net_type.value}_with_lsm",
                        "lsm": emulator_request.lsm,
                    }
                )
            )

    return scenarios


# TODO: can delete dont need
def scenarios_to_dict(scenarios: list[EmulatorScenario]) -> dict:
    """Convert list of scenarios to columnar dictionary format."""
    if not scenarios:
        return {}

    return {key: [scenario.model_dump()[key] for scenario in scenarios] for key in scenarios[0].model_dump().keys()}


def build_base_scenario(emulator_request: EmulatorRequest) -> EmulatorScenario:
    """Build the base scenario from the emulator request."""
    return EmulatorScenario(
        **emulator_request.model_dump(
            include={
                "res_use",
                "py_only",
                "py_pbo",
                "py_pyrrole",
                "py_ppf",
                "prev",
                "Q0",
                "phi",
                "seasonal",
                "irs",
                "mosquito_delta",
            }
        ),
        value=emulator_request.prev,  # TODO needs to be baked into estimint
    )


# Model output is aggregated by 14 days, giving ~26 time points per year.
TIME_POINT_INTERVAL_DAYS = 14
TIME_POINTS_PER_YEAR = 365 // TIME_POINT_INTERVAL_DAYS

# We only want the last 4 of the 6 years the emulator returns.
YEARS_TO_EXTRACT = 4
TIME_POINTS_TO_EXTRACT = TIME_POINTS_PER_YEAR * YEARS_TO_EXTRACT

MIN_VALID_EIR = 0.68
MAX_VALID_EIR = 350.0


def post_process_results(results: pd.DataFrame) -> EmulatorResponse:
    """Process emulator results into response format."""
    if not {"prev_series", "cases_series"}.issubset(results.columns):
        raise HTTPException(status_code=500, detail="Emulator model did not return prevalence or cases results")

    prevalence_records = []
    cases_records = []

    for _, row in results.iterrows():
        prevalence_records.extend(build_prevalence_records(row))
        cases_records.extend(build_cases_records(row))

    eir_value = results.iloc[0]["eir_final"]
    eir_valid = bool(MIN_VALID_EIR <= eir_value <= MAX_VALID_EIR)

    return EmulatorResponse(
        prevalence=prevalence_adapter.validate_python(prevalence_records),
        cases=cases_adapter.validate_python(cases_records),
        eirValid=eir_valid,
    )


def build_prevalence_records(row: pd.Series) -> list[dict]:
    """Build per-time-point prevalence records for a single scenario."""
    prevalence_data = row["prev_series"][-TIME_POINTS_TO_EXTRACT:]
    return [
        {
            "scenario": row["name"],
            "days": time_index * TIME_POINT_INTERVAL_DAYS,
            "prevalence": prevalence,
        }
        for time_index, prevalence in enumerate(prevalence_data)
    ]


def build_cases_records(row: pd.Series) -> list[dict]:
    """Build per-year cases records for a single scenario."""
    cases_data = row["cases_series"][-TIME_POINTS_TO_EXTRACT:]
    records = []
    for year_index in range(YEARS_TO_EXTRACT):
        year_start = year_index * TIME_POINTS_PER_YEAR
        year_end = year_start + TIME_POINTS_PER_YEAR
        records.append(
            {
                "scenario": row["name"],
                "year": year_index + 1,
                "casesPer1000": cases_data[year_start:year_end].sum(),
            }
        )
    return records
