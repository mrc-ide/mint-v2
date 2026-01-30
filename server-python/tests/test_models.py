import pytest
from pydantic import ValidationError

from app.models import (
    Cases,
    CompareParameter,
    CompareParametersResponse,
    EmulatorRequest,
    EmulatorResponse,
    EmulatorScenario,
    ItnFutureType,
    Prevalence,
    Response,
    Version,
    cases_adapter,
    prevalence_adapter,
)


class TestResponse:
    def test_response_with_string_data(self):
        response = Response[str](data="test")
        assert response.data == "test"

    def test_response_with_dict_data(self):
        response = Response[dict](data={"key": "value"})
        assert response.data == {"key": "value"}


class TestVersion:
    def test_version_creation(self):
        version = Version(server="1.0.0", minte="2.0.0")
        assert version.server == "1.0.0"
        assert version.minte == "2.0.0"


class TestItnFutureType:
    def test_enum_values(self):
        assert ItnFutureType.py_only.value == "py_only"
        assert ItnFutureType.py_pyrrole.value == "py_pyrrole"
        assert ItnFutureType.py_ppf.value == "py_ppf"
        assert ItnFutureType.py_pbo.value == "py_pbo"


class TestEmulatorRequest:
    def test_valid_request_with_aliases(self):
        data = {
            "is_seasonal": True,
            "current_malaria_prevalence": 50,
            "preference_for_biting_in_bed": 75,
            "preference_for_biting": 80,
            "pyrethroid_resistance": 60,
            "py_only": 20,
            "py_pbo": 30,
            "py_pyrrole": 40,
            "py_ppf": 10,
            "irs_coverage": 25,
            "itn_future": 35,
            "itn_future_types": {"py_only", "py_pbo"},
            "routine_coverage": False,
            "irs_future": 15,
            "lsm": 5,
        }
        request = EmulatorRequest(**data)
        assert request.season == 1.0
        assert request.prev == 0.5
        assert request.phi == 0.75
        assert request.Q0 == 0.8
        assert request.res_use == 0.6
        assert request.routine == 0.0

    def test_percentage_to_fraction_conversion(self):
        data = {
            "is_seasonal": 0,
            "current_malaria_prevalence": 100,
            "preference_for_biting_in_bed": 0,
            "preference_for_biting": 50,
            "pyrethroid_resistance": 25,
            "py_only": 75,
            "py_pbo": 0,
            "py_pyrrole": 100,
            "py_ppf": 50,
            "irs_coverage": 0,
            "itn_future": 100,
            "itn_future_types": {"py_ppf"},
            "routine_coverage": 1,
            "irs_future": 50,
            "lsm": 25,
        }
        request = EmulatorRequest(**data)
        assert request.prev == 1.0
        assert request.Q0 == 0.5
        assert request.res_use == 0.25
        assert request.py_only == 0.75

    def test_invalid_percentage_values(self):
        data = {
            "is_seasonal": 1,
            "current_malaria_prevalence": 101,
            "preference_for_biting_in_bed": 50,
            "preference_for_biting": 50,
            "pyrethroid_resistance": 50,
            "py_only": 50,
            "py_pbo": 50,
            "py_pyrrole": 50,
            "py_ppf": 50,
            "irs_coverage": 50,
            "itn_future": 50,
            "itn_future_types": {"py_only"},
            "routine_coverage": 0,
            "irs_future": 50,
            "lsm": 50,
        }
        with pytest.raises(ValidationError):
            EmulatorRequest(**data)

    def test_negative_values_rejected(self):
        data = {
            "is_seasonal": 1,
            "current_malaria_prevalence": -1,
            "preference_for_biting_in_bed": 50,
            "preference_for_biting": 50,
            "pyrethroid_resistance": 50,
            "py_only": 50,
            "py_pbo": 50,
            "py_pyrrole": 50,
            "py_ppf": 50,
            "irs_coverage": 50,
            "itn_future": 50,
            "itn_future_types": {"py_only"},
            "routine_coverage": 0,
            "irs_future": 50,
            "lsm": 50,
        }
        with pytest.raises(ValidationError):
            EmulatorRequest(**data)


class TestEmulatorScenario:
    def test_scenario_creation_with_defaults(self):
        scenario = EmulatorScenario(
            res_use=0.5,
            py_only=0.2,
            py_pbo=0.3,
            py_pyrrole=0.4,
            py_ppf=0.1,
            prev=0.25,
            Q0=0.75,
            phi=0.8,
            season=1.0,
            irs=0.3,
        )
        assert scenario.scenario_tag == "no_intervention"
        assert scenario.itn_future == 0.0
        assert scenario.net_type_future is None
        assert scenario.irs_future == 0.0
        assert scenario.routine == 0.0
        assert scenario.lsm == 0.0

    def test_scenario_creation_with_all_fields(self):
        scenario = EmulatorScenario(
            scenario_tag="intervention",
            res_use=0.5,
            py_only=0.2,
            py_pbo=0.3,
            py_pyrrole=0.4,
            py_ppf=0.1,
            prev=0.25,
            Q0=0.75,
            phi=0.8,
            season=1.0,
            irs=0.3,
            itn_future=0.5,
            net_type_future="py_only",
            irs_future=0.4,
            routine=1.0,
            lsm=0.2,
        )
        assert scenario.scenario_tag == "intervention"
        assert scenario.itn_future == 0.5
        assert scenario.net_type_future == "py_only"


class TestPrevalence:
    def test_prevalence_creation(self):
        prev = Prevalence(scenario="test", days=365, prevalence=0.25)
        assert prev.scenario == "test"
        assert prev.days == 365
        assert prev.prevalence == 0.25

    def test_prevalence_adapter(self):
        data = [
            {"scenario": "s1", "days": 100, "prevalence": 0.1},
            {"scenario": "s2", "days": 200, "prevalence": 0.2},
        ]
        prevalence_list = prevalence_adapter.validate_python(data)
        assert len(prevalence_list) == 2
        assert prevalence_list[0].scenario == "s1"
        assert prevalence_list[1].days == 200


class TestCases:
    def test_cases_creation(self):
        cases = Cases(scenario="test", year=2024, casesPer1000=15.5)
        assert cases.scenario == "test"
        assert cases.year == 2024
        assert cases.casesPer1000 == 15.5

    def test_cases_adapter(self):
        data = [
            {"scenario": "s1", "year": 2023, "casesPer1000": 10.0},
            {"scenario": "s2", "year": 2024, "casesPer1000": 20.0},
        ]
        cases_list = cases_adapter.validate_python(data)
        assert len(cases_list) == 2
        assert cases_list[0].year == 2023
        assert cases_list[1].casesPer1000 == 20.0


class TestEmulatorResponse:
    def test_emulator_response_creation(self):
        prevalence_data = [Prevalence(scenario="s1", days=100, prevalence=0.1)]
        cases_data = [Cases(scenario="s1", year=2024, casesPer1000=10.0)]
        response = EmulatorResponse(prevalence=prevalence_data, cases=cases_data, eirValid=True)
        assert len(response.prevalence) == 1
        assert len(response.cases) == 1
        assert response.eirValid is True

    def test_emulator_response_with_empty_lists(self):
        response = EmulatorResponse(prevalence=[], cases=[], eirValid=False)
        assert response.prevalence == []
        assert response.cases == []
        assert response.eirValid is False


class TestCompareParameter:
    def test_compare_parameter_creation(self):
        param = CompareParameter(parameterName="test_param", label="Test Parameter", min=0.0, max=100.0)
        assert param.parameter_name == "test_param"
        assert param.label == "Test Parameter"
        assert param.min == 0.0
        assert param.max == 100.0


class TestCompareParametersResponse:
    def test_compare_parameters_response_creation(self):
        baseline_params = [
            CompareParameter(parameterName="param1", label="Parameter 1", min=0.0, max=50.0),
            CompareParameter(parameterName="param2", label="Parameter 2", min=10.0, max=60.0),
        ]
        intervention_params = [
            CompareParameter(parameterName="param3", label="Parameter 3", min=20.0, max=70.0),
        ]
        response = CompareParametersResponse(
            baselineParameters=baseline_params,
            interventionParameters=intervention_params,
        )
        assert len(response.baseline_parameters) == 2
        assert len(response.intervention_parameters) == 1
        assert response.baseline_parameters[0].parameter_name == "param1"
        assert response.intervention_parameters[0].label == "Parameter 3"
