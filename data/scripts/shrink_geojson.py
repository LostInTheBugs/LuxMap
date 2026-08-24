#!/usr/bin/env python3
"""Arrondit les coordonnées des GeoJSON de public/ à 5 décimales (~1 m) et
les réécrit minifiés. Idempotent : peut être relancé sans dommage."""
import json
import pathlib

PRECISION = 5
PUBLIC = pathlib.Path(__file__).resolve().parents[2] / "public"


def round_coords(obj):
    if isinstance(obj, list):
        return [round_coords(x) for x in obj]
    if isinstance(obj, float):
        return round(obj, PRECISION)
    return obj


def main() -> None:
    for path in sorted(PUBLIC.glob("*.geojson")):
        before = path.stat().st_size
        data = json.loads(path.read_text(encoding="utf-8"))
        for feature in data["features"]:
            feature["geometry"]["coordinates"] = round_coords(
                feature["geometry"]["coordinates"]
            )
        path.write_text(
            json.dumps(data, separators=(",", ":"), ensure_ascii=False),
            encoding="utf-8",
        )
        after = path.stat().st_size
        print(f"{path.name}: {before:,} -> {after:,} octets")


if __name__ == "__main__":
    main()
