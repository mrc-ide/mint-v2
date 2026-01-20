from unittest.mock import Mock, patch

import pandas as pd
import pytest
from fastapi import HTTPException
from minte import MintwebResults

from app.models import Cases, EmulatorRequest, EmulatorResponse, EmulatorScenario, ItnFutureType, Prevalence
from app.services.emulator import (
    build_base_scenario,
    build_intervention_scenarios,
    build_net_scenarios,
    build_scenarios,
    post_process_results,
    run_emulator_model,
    scenarios_to_dict,
)


class TestScenariosToDict:
    def test_no_scenarios(self):
        assert scenarios_to_dict([]) == {}

    def test_with_scenarios(self, emulator_request: EmulatorRequest):
        request_dict = emulator_request.model_dump(exclude={"net_type_future"})
        scenarios = [
            EmulatorScenario(**request_dict, scenario_tag="test1"),
            EmulatorScenario(**request_dict, scenario_tag="test2", net_type_future="py_only"),
            EmulatorScenario(**request_dict, scenario_tag="test3", net_type_future="py_pbo"),
        ]

        result = scenarios_to_dict(scenarios)

        expected_keys = [
            "res_use",
            "py_only",
            "py_pbo",
            "py_pyrrole",
            "py_ppf",
            "prev",
            "Q0",
            "phi",
            "season",
            "irs",
            "itn_future",
            "irs_future",
            "routine",
            "lsm",
        ]
        expected = {
            "scenario_tag": ["test1", "test2", "test3"],
            **{k: [getattr(emulator_request, k)] * 3 for k in expected_keys},
            "net_type_future": [None, "py_only", "py_pbo"],
        }

        assert result == expected


class TestBuildBaseScenario:
    def test_build_base_scenario(self, emulator_request: EmulatorRequest):
        expected = EmulatorScenario(
            res_use=0.3,
            py_only=0.05,
            py_pbo=0.1,
            py_pyrrole=0.05,
            py_ppf=0.05,
            prev=0.5,
            Q0=0.82,
            phi=0.79,
            season=1.0,
            irs=0.1,
            # Default values
            scenario_tag="no_intervention",
            irs_future=0,
            itn_future=0,
            routine=0,
            lsm=0,
        )

        result = build_base_scenario(emulator_request)

        assert result == expected


class TestBuildNetScenarios:
    def test_build_net_scenarios_with_lsm(self, emulator_request: EmulatorRequest):
        base_scenario = build_base_scenario(emulator_request)

        scenarios = build_net_scenarios(emulator_request, base_scenario)

        tags = {scenario.scenario_tag for scenario in scenarios}
        assert tags == {"py_only_only", "py_only_with_lsm", "py_pbo_only", "py_pbo_with_lsm"}
        for scenario in scenarios:
            assert scenario.itn_future == emulator_request.itn_future
            assert scenario.routine == emulator_request.routine
            assert ItnFutureType[str(scenario.net_type_future)] in emulator_request.net_type_future
            if "with_lsm" in scenario.scenario_tag:
                assert scenario.lsm == emulator_request.lsm
            else:
                assert scenario.lsm == base_scenario.lsm

    def test_build_net_scenarios_without_lsm(self, emulator_request: EmulatorRequest):
        emulator_request.lsm = 0.0
        base_scenario = build_base_scenario(emulator_request)

        scenarios = build_net_scenarios(emulator_request, base_scenario)

        tags = {scenario.scenario_tag for scenario in scenarios}
        assert tags == {"py_only_only", "py_pbo_only"}


@patch("app.services.emulator.build_net_scenarios")
class TestBuildInterventionScenarios:
    def test_build_intervention_scenarios(self, mock_build_net_scenarios, emulator_request: EmulatorRequest):
        base_scenario = build_base_scenario(emulator_request)
        mock_build_net_scenarios.return_value = ["net_scenarios"]

        scenarios = build_intervention_scenarios(emulator_request, base_scenario)

        expected_scenarios = [
            base_scenario.model_copy(update={"scenario_tag": "irs_only", "irs_future": emulator_request.irs_future}),
            base_scenario.model_copy(update={"scenario_tag": "lsm_only", "lsm": emulator_request.lsm}),
            "net_scenarios",
        ]

        assert scenarios == expected_scenarios
        mock_build_net_scenarios.assert_called_once_with(emulator_request, base_scenario)

    def test_build_intervention_scenarios_no_irs_lsm(self, mock_build_net_scenarios, emulator_request: EmulatorRequest):
        emulator_request.irs_future = 0.0
        emulator_request.lsm = 0.0
        base_scenario = build_base_scenario(emulator_request)
        mock_build_net_scenarios.return_value = ["net_scenarios"]

        scenarios = build_intervention_scenarios(emulator_request, base_scenario)

        expected_scenarios = [
            "net_scenarios",
        ]

        assert scenarios == expected_scenarios
        mock_build_net_scenarios.assert_called_once_with(emulator_request, base_scenario)


@patch("app.services.emulator.build_intervention_scenarios")
class TestBuildAllScenarios:
    def test_build_all_scenarios(self, mock_build: Mock, emulator_request: EmulatorRequest):
        base_scenario = build_base_scenario(emulator_request)
        irs_future_scenario = base_scenario.model_copy(
            update={"scenario_tag": "irs_only", "irs_future": emulator_request.irs_future}
        )
        mock_build.return_value = [irs_future_scenario]

        result = build_scenarios(emulator_request)

        mock_build.assert_called_once_with(emulator_request, base_scenario)
        assert result == scenarios_to_dict([base_scenario, irs_future_scenario])


@patch("app.services.emulator.post_process_results")
@patch("app.services.emulator.run_mintweb_controller")
@patch("app.services.emulator.build_scenarios")
class TestRunEmulatorModel:
    def test_run_emulator_model(
        self,
        mock_build_scenarios: Mock,
        mock_run_mintweb_controller: Mock,
        mock_post_process_results: Mock,
        emulator_request: EmulatorRequest,
    ):
        scenarios = {"scenario_key": "scenarios_dict"}
        mock_build_scenarios.return_value = scenarios
        mock_run_mintweb_controller.return_value = "raw_results"
        mock_post_process_results.return_value = "final_results"

        result = run_emulator_model(emulator_request)

        mock_build_scenarios.assert_called_once_with(emulator_request)
        mock_run_mintweb_controller.assert_called_once_with(**scenarios)
        mock_post_process_results.assert_called_once_with("raw_results")
        assert result == "final_results"


class TestPostProcessResults:
    def test_no_results(self):
        with pytest.raises(HTTPException) as exc_info:
            post_process_results(MintwebResults())

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "Emulator model did not return prevalence or cases results"

    def test_with_results(self):
        eir_valid = True
        prevalence_df = pd.DataFrame(
            {
                "prevalence": [0.1, 0.2, 0.3, 0.4, 0.15, 0.25, 0.35, 0.45],
                "scenario": ["scenario1"] * 4 + ["scenario2"] * 4,
                "scenario_tag": ["scenario1"] * 4 + ["scenario2"] * 4,
                "eir_valid": [eir_valid] * 8,
            }
        )
        cases_df = pd.DataFrame(
            {
                "cases_per_1000": [100, 200, 300, 400, 150, 250, 350, 450],
                "scenario": ["scenario1"] * 4 + ["scenario2"] * 4,
            }
        )

        result = post_process_results(MintwebResults(prevalence=prevalence_df, cases=cases_df, eir_valid=eir_valid))

        assert isinstance(result, EmulatorResponse)
        assert result.eirValid == eir_valid
        # check prevalence
        assert isinstance(result.prevalence[0], Prevalence)
        assert [p.days for p in result.prevalence if p.scenario == "scenario1"] == [0, 14, 28, 42]
        # check cases
        assert isinstance(result.cases[0], Cases)
        assert [c.year for c in result.cases if c.scenario == "scenario1"] == [1, 2, 3, 4]

    def test_incorrect_result_schema(self):
        prevalence_df = pd.DataFrame(
            {
                "wrong_column": [0.1, 0.2],
                "scenario": ["scenario1", "scenario1"],
            }
        )
        cases_df = pd.DataFrame(
            {
                "wrong_column": [100, 200],
                "scenario": ["scenario1", "scenario1"],
            }
        )

        with pytest.raises(KeyError):
            post_process_results(MintwebResults(prevalence=prevalence_df, cases=cases_df, eir_valid=True))
