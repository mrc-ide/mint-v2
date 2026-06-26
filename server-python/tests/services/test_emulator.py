from dataclasses import replace
from unittest.mock import Mock, patch

import numpy as np
import pandas as pd
import pytest
from estimint import EirTarget, Scenario
from fastapi import HTTPException

from app.models import Cases, EmulatorRequest, EmulatorResponse, ItnFutureType, Prevalence
from app.services.emulator import (
    TIME_POINTS_PER_YEAR,
    TIME_POINTS_TO_EXTRACT,
    YEARS_TO_EXTRACT,
    build_base_scenario,
    build_cases_records,
    build_intervention_scenarios,
    build_net_scenarios,
    build_prevalence_records,
    build_scenarios,
    post_process_results,
    run_emulator_model,
)


class TestBuildBaseScenario:
    def test_build_base_scenario(self, emulator_request: EmulatorRequest):
        expected = Scenario(
            name="no_intervention",
            res_use=0.3,
            Q0=0.82,
            phi=0.79,
            seasonal=1.0,
            irs=0.1,
            eir_target=EirTarget(input_mode="prevalence", input_value=0.5),
            py_only=0.05,
            py_pbo=0.1,
            py_pyrrole=0.05,
            py_ppf=0.05,
            mosquito_delta=0.5,
        )

        result = build_base_scenario(emulator_request)

        assert result == expected


class TestBuildNetScenarios:
    def test_build_net_scenarios_with_lsm(self, emulator_request: EmulatorRequest):
        base_scenario = build_base_scenario(emulator_request)

        scenarios = build_net_scenarios(emulator_request, base_scenario)

        names = {scenario.name for scenario in scenarios}
        assert names == {"py_only_only", "py_only_with_lsm", "py_pbo_only", "py_pbo_with_lsm"}
        for scenario in scenarios:
            assert scenario.itn_future == emulator_request.itn_future
            assert scenario.routine == emulator_request.routine
            assert ItnFutureType(scenario.net_type_future) in emulator_request.net_type_future
            if "with_lsm" in scenario.name:
                assert scenario.lsm == emulator_request.lsm
            else:
                assert scenario.lsm == base_scenario.lsm

    def test_build_net_scenarios_without_lsm(self, emulator_request: EmulatorRequest):
        emulator_request.lsm = 0.0
        base_scenario = build_base_scenario(emulator_request)

        scenarios = build_net_scenarios(emulator_request, base_scenario)

        names = {scenario.name for scenario in scenarios}
        assert names == {"py_only_only", "py_pbo_only"}


@patch("app.services.emulator.build_net_scenarios")
class TestBuildInterventionScenarios:
    def test_build_intervention_scenarios(self, mock_build_net_scenarios: Mock, emulator_request: EmulatorRequest):
        base_scenario = build_base_scenario(emulator_request)
        mock_build_net_scenarios.return_value = ["net_scenarios"]

        scenarios = build_intervention_scenarios(emulator_request, base_scenario)

        expected_scenarios = [
            replace(base_scenario, name="irs_only", irs_future=emulator_request.irs_future),
            replace(base_scenario, name="lsm_only", lsm=emulator_request.lsm),
            "net_scenarios",
        ]

        assert scenarios == expected_scenarios
        mock_build_net_scenarios.assert_called_once_with(emulator_request, base_scenario)

    def test_build_intervention_scenarios_no_irs_lsm(
        self, mock_build_net_scenarios: Mock, emulator_request: EmulatorRequest
    ):
        emulator_request.irs_future = 0.0
        emulator_request.lsm = 0.0
        base_scenario = build_base_scenario(emulator_request)
        mock_build_net_scenarios.return_value = ["net_scenarios"]

        scenarios = build_intervention_scenarios(emulator_request, base_scenario)

        assert scenarios == ["net_scenarios"]
        mock_build_net_scenarios.assert_called_once_with(emulator_request, base_scenario)


@patch("app.services.emulator.build_intervention_scenarios")
class TestBuildScenarios:
    def test_build_scenarios(self, mock_build: Mock, emulator_request: EmulatorRequest):
        base_scenario = build_base_scenario(emulator_request)
        irs_future_scenario = replace(base_scenario, name="irs_only", irs_future=emulator_request.irs_future)
        mock_build.return_value = [irs_future_scenario]

        result = build_scenarios(emulator_request)

        mock_build.assert_called_once_with(emulator_request, base_scenario)
        assert result == [base_scenario, irs_future_scenario]


@patch("app.services.emulator.post_process_results")
@patch("app.services.emulator.run_scenarios")
@patch("app.services.emulator.build_scenarios")
class TestRunEmulatorModel:
    def test_run_emulator_model(
        self,
        mock_build_scenarios: Mock,
        mock_run_scenarios: Mock,
        mock_post_process_results: Mock,
        emulator_request: EmulatorRequest,
    ):
        scenarios = ["scenario1", "scenario2"]
        mock_build_scenarios.return_value = scenarios
        mock_run_scenarios.return_value = "raw_results"
        mock_post_process_results.return_value = "final_results"

        result = run_emulator_model(emulator_request)

        mock_build_scenarios.assert_called_once_with(emulator_request)
        mock_run_scenarios.assert_called_once_with(scenarios)
        mock_post_process_results.assert_called_once_with("raw_results")
        assert result == "final_results"


class TestRunEmulatorModelIntegration:
    def test_run_emulator_model_shapes(self, emulator_request: EmulatorRequest):
        result = run_emulator_model(emulator_request)

        assert isinstance(result, EmulatorResponse)
        scenario_names = {scenario.name for scenario in build_scenarios(emulator_request)}
        assert {p.scenario for p in result.prevalence} == scenario_names
        assert {c.scenario for c in result.cases} == scenario_names
        for name in scenario_names:
            assert len([p for p in result.prevalence if p.scenario == name]) == TIME_POINTS_TO_EXTRACT
            assert len([c for c in result.cases if c.scenario == name]) == YEARS_TO_EXTRACT
        assert isinstance(result.eirValid, bool)


class TestBuildPrevalenceRecords:
    def test_build_prevalence_records(self):
        row = pd.Series({"name": "scenario1", "prevalence": np.array([0.1, 0.2, 0.3])})

        records = build_prevalence_records(row)

        assert records == [
            {"scenario": "scenario1", "days": 0, "prevalence": 0.1},
            {"scenario": "scenario1", "days": 14, "prevalence": 0.2},
            {"scenario": "scenario1", "days": 28, "prevalence": 0.3},
        ]

    def test_truncates_to_last_time_points(self):
        prevalence = np.arange(TIME_POINTS_TO_EXTRACT + 10, dtype=float)
        row = pd.Series({"name": "scenario1", "prevalence": prevalence})

        records = build_prevalence_records(row)

        assert len(records) == TIME_POINTS_TO_EXTRACT
        assert records[0]["prevalence"] == prevalence[10]


class TestBuildCasesRecords:
    def test_build_cases_records(self):
        cases = np.arange(TIME_POINTS_TO_EXTRACT, dtype=float)
        row = pd.Series({"name": "scenario1", "cases": cases})

        records = build_cases_records(row)

        assert len(records) == YEARS_TO_EXTRACT
        for year_index, record in enumerate(records):
            year_start = year_index * TIME_POINTS_PER_YEAR
            year_end = year_start + TIME_POINTS_PER_YEAR
            assert record == {
                "scenario": "scenario1",
                "year": year_index + 1,
                "casesPer1000": cases[year_start:year_end].sum(),
            }


class TestPostProcessResults:
    def test_no_results(self):
        with pytest.raises(HTTPException) as exc_info:
            post_process_results(pd.DataFrame())

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "Emulator model did not return prevalence or cases results"

    def test_missing_name_column(self):
        results = pd.DataFrame(
            {
                "prevalence": [np.array([0.1, 0.2])],
                "cases": [np.array([10.0, 20.0])],
            }
        )

        with pytest.raises(KeyError):
            post_process_results(results)

    def test_with_results(self):
        prevalence_values = np.linspace(0.1, 0.5, TIME_POINTS_TO_EXTRACT)
        cases_values = np.arange(TIME_POINTS_TO_EXTRACT, dtype=float)
        results = pd.DataFrame(
            {
                "name": ["scenario1", "scenario2"],
                "eir_final": [100.0, 200.0],
                "prevalence": [prevalence_values, prevalence_values * 2],
                "cases": [cases_values, cases_values * 2],
            }
        )

        result = post_process_results(results)

        assert isinstance(result, EmulatorResponse)
        assert result.eirValid is True
        assert isinstance(result.prevalence[0], Prevalence)
        assert len([p for p in result.prevalence if p.scenario == "scenario1"]) == TIME_POINTS_TO_EXTRACT
        assert isinstance(result.cases[0], Cases)
        assert [c.year for c in result.cases if c.scenario == "scenario1"] == [1, 2, 3, 4]

    def test_eir_invalid_when_first_scenario_out_of_range(self):
        results = pd.DataFrame(
            {
                "name": ["scenario1"],
                "eir_final": [1000.0],
                "prevalence": [np.zeros(TIME_POINTS_TO_EXTRACT)],
                "cases": [np.zeros(TIME_POINTS_TO_EXTRACT)],
            }
        )

        result = post_process_results(results)

        assert result.eirValid is False
