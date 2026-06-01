import json
import sys
from pathlib import Path


def load_multiple_json_values(text):
    decoder = json.JSONDecoder()
    index = 0
    values = []

    while index < len(text):
        while index < len(text) and text[index].isspace():
            index += 1

        if index >= len(text):
            break

        value, next_index = decoder.raw_decode(text, index)
        values.append(value)
        index = next_index

    return values


def main():
    if len(sys.argv) != 3:
        print("Usage:")
        print("  python scripts/normalize_scenario_cards_json.py data\\scenario_cards_import.json data\\scenario_cards_import_clean.json")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    text = input_path.read_text(encoding="utf-8")
    values = load_multiple_json_values(text)

    merged = []

    for value in values:
        if isinstance(value, list):
            merged.extend(value)
        elif isinstance(value, dict):
            merged.append(value)
        else:
            raise ValueError("Only JSON objects or JSON lists are supported.")

    output_path.write_text(
        json.dumps(merged, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Normalized {len(merged)} cards.")
    print(f"Wrote: {output_path}")


if __name__ == "__main__":
    main()

    