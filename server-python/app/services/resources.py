import json
from pathlib import Path
from typing import Annotated

import jsonschema

from app.models import (
    CompareParameter,
    CompareParametersResponse,
    InterventionCompareCost,
    InterventionCompareParameter,
)

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
        (
            "itn_future",
            "ITN usage",
            ["people_per_bednet", "mass_distribution_cost", "continuous_itn_distribution_cost"],
        ),
        ("irs_future", "IRS coverage", ["irs_household_annual_cost_product", "irs_household_annual_cost_deployment"]),
        ("lsm", "LSM coverage", ["lsm_cost"]),
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
    param: Annotated[tuple[str, str, list[str]], "parameter name, label, linked cost names"],
    form_options: dict,
) -> InterventionCompareParameter:
    param_name, label, linked_cost_names = param
    cost_fields = [get_form_field(cost_name, form_options) for cost_name in linked_cost_names]
    linked_costs = [
        InterventionCompareCost(
            cost_name=cost_field["id"],
            cost_label=cost_field.get("label", cost_field["id"]),
        )
        for cost_field in cost_fields
    ]
    return InterventionCompareParameter(
        **create_compare_parameter((param_name, label), form_options).model_dump(),
        linked_costs=linked_costs,
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
