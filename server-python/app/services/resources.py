import json
from pathlib import Path

import jsonschema


def validate_json(instance, schema_name: str):
    schema_path = Path("app", "schemas", f"{schema_name}.schema.json")
    schema = json.loads(schema_path.read_text())
    jsonschema.validate(instance=instance, schema=schema)


def get_dynamic_form_options():
    options_path = Path("app", "resources", "dynamicFormOptions.json")
    options = json.loads(options_path.read_text())

    validate_json(options, "DynamicFormOptions")

    return options
