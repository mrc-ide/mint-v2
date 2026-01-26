import json
from typing import ClassVar
from unittest.mock import Mock, patch

import jsonschema
import pytest

from app.services.resources import get_dynamic_form_options, validate_json


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
