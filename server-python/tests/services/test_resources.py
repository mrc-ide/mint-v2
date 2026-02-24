import json
from typing import ClassVar
from unittest.mock import Mock, patch

import jsonschema
import pytest

from app.models import (
    CompareParameter,
    CompareParametersResponse,
    InterventionCompareCost,
    InterventionCompareParameter,
)
from app.services.resources import (
    create_compare_parameter,
    create_intervention_compare_parameter,
    get_compare_parameters,
    get_dynamic_form_options,
    get_form_field,
    validate_json,
)


@patch("pathlib.Path.read_text")
class TestValidateJson:
    schema: ClassVar[dict] = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "age": {"type": "integer"},
        },
        "required": ["name", "age"],
    }

    def test_with_valid_instance(self, mock_read_text: Mock):
        instance = {"name": "Alice", "age": 30}
        mock_read_text.return_value = json.dumps(self.schema)

        validate_json(instance, "TestSchema")

        mock_read_text.assert_called_once()

    def test_with_invalid_instance(self, mock_read_text: Mock):
        instance = {"name": "Alice", "age": "thirty"}
        mock_read_text.return_value = json.dumps(self.schema)

        try:
            validate_json(instance, "TestSchema")
        except Exception as e:
            assert isinstance(e, jsonschema.ValidationError)

        mock_read_text.assert_called_once()

    def test_with_invalid_json(self, mock_read_text: Mock):
        mock_read_text.return_value = ""

        with pytest.raises(json.JSONDecodeError):
            validate_json({}, "NonExistentSchema")

    def test_with_missing_schema_file(self, mock_read_text: Mock):
        mock_read_text.side_effect = FileNotFoundError
        with pytest.raises(FileNotFoundError):
            validate_json({}, "NonExistentSchema")


@patch("pathlib.Path.read_text")
@patch("app.services.resources.validate_json")
class TestGetDynamicFormOptions:
    def test_success(self, mock_validate_json: Mock, mock_read_text: Mock):
        options = {
            "seasons": ["seasonal", "non_seasonal"],
            "net_types": ["py_only", "py_pbo", "py_pyrrole", "py_ppf"],
        }
        mock_read_text.return_value = json.dumps(options)

        result = get_dynamic_form_options()

        assert result == options
        mock_validate_json.assert_called_once_with(options, "DynamicFormOptions")
        mock_read_text.assert_called_once()

    def test_invalid_json(self, _: Mock, mock_read_text: Mock):
        mock_read_text.return_value = "invalid json"

        with pytest.raises(json.JSONDecodeError):
            get_dynamic_form_options()

    def test_non_existent_file(self, _: Mock, mock_read_text: Mock):
        mock_read_text.side_effect = FileNotFoundError

        with pytest.raises(FileNotFoundError):
            get_dynamic_form_options()


class TestCreateCompareParameter:
    form_options: ClassVar[dict] = {
        "groups": [
            {
                "subGroups": [
                    {
                        "fields": [
                            {"id": "current_malaria_prevalence", "min": 2, "max": 70},
                            {"id": "preference_for_biting_in_bed", "min": 40, "max": 90},
                            {"id": "no_min_max_field"},
                            {"id": "itn_future"},
                            {"id": "itn_cost1", "label": "ITN Cost 1"},
                            {"id": "itn_cost2", "label": "ITN Cost 2"},
                        ]
                    }
                ]
            }
        ]
    }

    def test_field_found(self):
        field = get_form_field("current_malaria_prevalence", self.form_options)

        assert field == {"id": "current_malaria_prevalence", "min": 2, "max": 70}

    def test_field_not_found(self):
        with pytest.raises(ValueError, match=r"Parameter 'non_existent_field' not found in form options."):
            get_form_field("non_existent_field", self.form_options)

    def test_create_compare_parameter(self):
        param = ("current_malaria_prevalence", "Prevalence")

        compare_param = create_compare_parameter(param, self.form_options)

        assert compare_param.model_dump() == {
            "parameter_name": "current_malaria_prevalence",
            "label": "Prevalence",
            "min": 2,
            "max": 70,
        }

    def test_create_compare_parameter_no_min_max(self):
        param = ("no_min_max_field", "No Min Max")

        compare_param = create_compare_parameter(param, self.form_options)

        assert compare_param.model_dump() == {
            "parameter_name": "no_min_max_field",
            "label": "No Min Max",
            "min": 0.0,
            "max": 100.0,
        }

    def test_create_intervention_compare_parameter(self):
        param = ("itn_future", "ITN Usage", ["itn_cost1", "itn_cost2"])

        intervention_compare_param = create_intervention_compare_parameter(param, self.form_options)

        assert intervention_compare_param.model_dump() == {
            "parameter_name": "itn_future",
            "label": "ITN Usage",
            "min": 0.0,
            "max": 100.0,
            "linked_costs": [
                {"cost_name": "itn_cost1", "cost_label": "ITN Cost 1"},
                {"cost_name": "itn_cost2", "cost_label": "ITN Cost 2"},
            ],
        }


@patch("app.services.resources.get_dynamic_form_options")
@patch("app.services.resources.create_compare_parameter")
@patch("app.services.resources.create_intervention_compare_parameter")
class TestGetCompareParameters:
    def test_get_compare_parameters(self, mock_intervention_compare: Mock, mock_compare: Mock, mock_options: Mock):
        options = {"field": "test"}
        baseline_parameters = [
            CompareParameter(
                parameter_name="preference_for_biting_in_bed", label="Preference for Biting in Bed", min=0, max=100
            ),
        ]
        intervention_parameters = [
            InterventionCompareParameter(
                parameter_name="irs_future",
                label="IRS coverage",
                min=0,
                max=100,
                linked_costs=[
                    InterventionCompareCost(
                        cost_name="irs_household_annual_cost_product", cost_label="IRSHousehold Annual Cost Product"
                    )
                ],
            ),
            InterventionCompareParameter(
                parameter_name="itn_future",
                label="ITN usage",
                min=0,
                max=100,
                linked_costs=[
                    InterventionCompareCost(cost_name="mass_distribution_cost", cost_label="Mass Distribution Cost"),
                ],
            ),
            InterventionCompareParameter(
                parameter_name="lsm",
                label="LSM coverage",
                min=0,
                max=100,
                linked_costs=[InterventionCompareCost(cost_name="lsm_cost", cost_label="LSM Cost")],
            ),
        ]
        mock_options.return_value = options
        mock_compare.side_effect = baseline_parameters
        mock_intervention_compare.side_effect = intervention_parameters

        response = get_compare_parameters()

        mock_options.assert_called_once()
        expected_compare_calls = [
            (("current_malaria_prevalence", "Baseline prevalence"), options),
        ]
        expected_intervention_compare_calls = [
            (
                (
                    "itn_future",
                    "ITN usage",
                    ["people_per_bednet", "mass_distribution_cost", "continuous_itn_distribution_cost"],
                ),
                options,
            ),
            (
                (
                    "irs_future",
                    "IRS coverage",
                    ["irs_household_annual_cost_product", "irs_household_annual_cost_deployment"],
                ),
                options,
            ),
            (("lsm", "LSM coverage", ["lsm_cost"]), options),
        ]
        actual_compare_calls = [call.args for call in mock_compare.call_args_list]
        actual_intervention_compare_calls = [call.args for call in mock_intervention_compare.call_args_list]
        assert actual_compare_calls == expected_compare_calls
        assert actual_intervention_compare_calls == expected_intervention_compare_calls
        assert response == CompareParametersResponse(
            baseline_parameters=baseline_parameters,
            intervention_parameters=intervention_parameters,
        )
