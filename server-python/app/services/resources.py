import json
from pathlib import Path

import jsonschema

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
