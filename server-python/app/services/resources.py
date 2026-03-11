import json
from pathlib import Path

import jsonschema

from app.models import (
    BaselineParameterOption,
    CompareParameter,
    CompareParametersResponse,
    InterventionCompareCost,
    InterventionCompareParameter,
    InterventionParameterOption,
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
    baseline_param_options = [
        BaselineParameterOption(name="current_malaria_prevalence", label="Prevalence (0-5 year olds)"),
        BaselineParameterOption(name="mosquito_delta", label="Human Biting Rate (all ages)"),
    ]
    intervention_param_options = [
        InterventionParameterOption(
            name="itn_future",
            linked_costs=[
                ("people_per_bednet", True),
                ("mass_distribution_cost", False),
                ("continuous_itn_distribution_cost", False),
            ],
        ),
        InterventionParameterOption(
            name="irs_future",
            linked_costs=[
                ("irs_household_annual_cost_product", False),
                ("irs_household_annual_cost_deployment", False),
            ],
        ),
        InterventionParameterOption(name="lsm", linked_costs=[("lsm_cost", False)]),
    ]

    baseline_parameters = [create_compare_parameter(param, form_options) for param in baseline_param_options]
    intervention_parameters = [
        create_intervention_compare_parameter(param, form_options) for param in intervention_param_options
    ]

    return CompareParametersResponse(
        baseline_parameters=baseline_parameters,
        intervention_parameters=intervention_parameters,
    )


def create_intervention_compare_parameter(
    param: InterventionParameterOption,
    form_options: dict,
) -> InterventionCompareParameter:
    name, linked_costs_config = param.name, param.linked_costs
    intervention_field = get_form_field(name, form_options)
    cost_fields = [
        (get_form_field(cost_name, form_options), cost_decreases_with_increase)
        for cost_name, cost_decreases_with_increase in linked_costs_config
    ]
    linked_costs = [
        InterventionCompareCost(
            cost_name=cost_field["id"],
            cost_label=cost_field.get("label", cost_field["id"]),
            step=cost_field.get("step", 1.0),
            cost_decreases_with_increase=cost_decreases_with_increase,
        )
        for cost_field, cost_decreases_with_increase in cost_fields
    ]

    return InterventionCompareParameter(
        **create_compare_parameter(
            BaselineParameterOption(name=name, label=intervention_field.get("label", name)), form_options
        ).model_dump(),
        linked_costs=linked_costs,
    )


def create_compare_parameter(param: BaselineParameterOption, form_options: dict) -> CompareParameter:
    name, label = param.name, param.label
    field = get_form_field(name, form_options)
    return CompareParameter(
        parameter_name=name,
        label=label,
        min=field.get("min", 0.0),
        max=field.get("max", 100.0),
        step=field.get("step", 1.0),
    )


def get_form_field(parameter_name: str, form_options: dict) -> dict:
    for group in form_options.get("groups", []):
        for sub_group in group.get("subGroups", []):
            for field in sub_group.get("fields", []):
                if field.get("id") == parameter_name:
                    return field
    raise ValueError(f"Parameter '{parameter_name}' not found in form options.")
