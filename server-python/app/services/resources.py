import json
from pathlib import Path

import jsonschema

from app.models import CompareParameter, CompareParametersResponse, InterventionCompareParameter
from typing import Annotated

APP_DIR = Path(__file__).parent.parent


def validate_json(instance, schema_name: str) -> None:
    schema_path = APP_DIR / "schemas" / f"{schema_name}.schema.json"
    schema = json.loads(schema_path.read_text())
    jsonschema.validate(instance=instance, schema=schema)


def get_dynamic_form_options() -> dict:
    options_path = APP_DIR / "resources" / "dynamicFormOptions.json"
    options = json.loads(options_path.read_text())

    validate_json(options, "DynamicFormOptions")

    return options


def get_compare_parameters() -> CompareParametersResponse:
    form_options = get_dynamic_form_options()
    baseline_param_names = [
        ("current_malaria_prevalence", "Baseline prevalence"),
    ]
    intervention_param_names = [
        ("irs_future", "IRS coverage", "irs_household_annual_cost_product"),
        ("itn_future", "ITN usage", "mass_distribution_cost"),
        ("lsm", "LSM coverage", "lsm_cost"),
    ]

    baseline_parameters = [create_compare_parameter(param_name, form_options) for param_name in baseline_param_names]
    intervention_parameters = [
        create_intervention_compare_parameter(param_name, form_options) for param_name in intervention_param_names
    ]

    return CompareParametersResponse(
        baseline_parameters=baseline_parameters,
        intervention_parameters=intervention_parameters,
    )


def create_intervention_compare_parameter(
    param: Annotated[tuple[str, str, str], "parameter name, label, linked cost name"], form_options: dict
) -> InterventionCompareParameter:
    param_name, label, linked_cost_name = param
    cost_field = get_form_field(linked_cost_name, form_options)

    return InterventionCompareParameter(
        **create_compare_parameter((param_name, label), form_options).model_dump(),
        linked_cost_name=linked_cost_name,
        linked_cost_label=cost_field.get("label", linked_cost_name),
    )


def create_compare_parameter(
    param: Annotated[tuple[str, str], "parameter name, label"], form_options: dict
) -> CompareParameter:
    param_name, label = param
    field = get_form_field(param_name, form_options)
    return CompareParameter(
        parameter_name=param_name,
        label=label,
        min=field.get("min", 0.0),
        max=field.get("max", 100.0),
    )


def get_form_field(parameter_name: str, form_options: dict) -> dict:
    for group in form_options.get("groups", []):
        for sub_group in group.get("subGroups", []):
            for field in sub_group.get("fields", []):
                if field.get("id") == parameter_name:
                    return field
    raise ValueError(f"Parameter '{parameter_name}' not found in form options.")
