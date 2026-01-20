from typing import Annotated

from fastapi import HTTPException
from minte import MintwebResults, run_mintweb_controller

from app.models import EmulatorRequest, EmulatorResponse, EmulatorScenario, cases_adapter, prevalence_adapter


def run_emulator_model(emulator_request: EmulatorRequest) -> EmulatorResponse:
    """Run the emulator model based on the request and return the response."""
    scenarios = build_scenarios(emulator_request)
    results = run_mintweb_controller(**scenarios)
    return post_process_results(results)


def build_scenarios(
    emulator_request: EmulatorRequest,
) -> Annotated[dict, "EmulatorScenario with values as list for each scenario"]:
    """Build scenarios based on the emulator request."""
    base_scenario = build_base_scenario(emulator_request)
    scenarios = [base_scenario]

    scenarios.extend(build_intervention_scenarios(emulator_request, base_scenario))

    return scenarios_to_dict(scenarios)


def build_intervention_scenarios(
    emulator_request: EmulatorRequest, base_scenario: EmulatorScenario
) -> list[EmulatorScenario]:
    """Build all intervention scenarios (IRS, LSM, and net types)."""
    scenarios = []

    # IRS only scenario
    if emulator_request.irs_future > 0:
        scenarios.append(
            base_scenario.model_copy(update={"scenario_tag": "irs_only", "irs_future": emulator_request.irs_future})
        )

    # LSM only scenario
    if emulator_request.lsm > 0:
        scenarios.append(base_scenario.model_copy(update={"scenario_tag": "lsm_only", "lsm": emulator_request.lsm}))

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
                "scenario_tag": f"{net_type.value}_only",
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
                        "scenario_tag": f"{net_type.value}_with_lsm",
                        "lsm": emulator_request.lsm,
                    }
                )
            )

    return scenarios


def scenarios_to_dict(scenarios: list[EmulatorScenario]) -> dict:
    """Convert list of scenarios to columnar dictionary format."""
    if not scenarios:
        return {}

    return {key: [scenario.model_dump()[key] for scenario in scenarios] for key in scenarios[0].model_dump().keys()}


def build_base_scenario(emulator_request: EmulatorRequest) -> EmulatorScenario:
    """Build the base scenario from the emulator request."""
    return EmulatorScenario(
        **emulator_request.model_dump(
            include={"res_use", "py_only", "py_pbo", "py_pyrrole", "py_ppf", "prev", "Q0", "phi", "season", "irs"}
        )
    )


def post_process_results(results: MintwebResults) -> EmulatorResponse:
    """Process emulator results into response format."""
    if results.prevalence is None or results.cases is None:
        raise HTTPException(status_code=500, detail="Emulator model did not return prevalence or cases results")

    # Process prevalence data (fortnightly time steps)
    prevalence_df = results.prevalence.drop(columns=["scenario_tag", "eir_valid"])
    prevalence_df["days"] = prevalence_df.groupby("scenario").cumcount() * 14

    # Process cases data
    cases_df = results.cases.rename(columns={"cases_per_1000": "casesPer1000"})
    cases_df["year"] = cases_df.groupby("scenario").cumcount() + 1

    return EmulatorResponse(
        prevalence=prevalence_adapter.validate_python(prevalence_df.to_dict(orient="records")),
        cases=cases_adapter.validate_python(cases_df.to_dict(orient="records")),
        eirValid=results.eir_valid,
    )
