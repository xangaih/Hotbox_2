# utils.py
import json
import re


def parse_json_response(text: str) -> dict:
    """
    Safely parse JSON from a Claude response.
    Strips markdown code fences if present, then parses.
    Raises ValueError with the raw text if parsing still fails
    so the error is debuggable.
    """
    cleaned = text.strip()

    # Strip ```json ... ``` or ``` ... ``` fences
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Failed to parse Claude response as JSON.\n"
            f"Error: {e}\n"
            f"Raw response:\n{text}"
        ) from e
