#!/usr/bin/env python3
"""Parse housing price XLS files from data.public.lu → data/processed/prix.json.

Sources (dataset "Prix annoncés des logements - Par commune"):
  - vente-appartement-2025-26.xls  (prices announced over the last 12 months)
  - vente-maison-2025-2026.xls

Run with: uv run --with xlrd python3 data/scripts/parse_prix.py
"""
import json
import os

import xlrd

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, "..", "raw"))
OUT = os.path.normpath(os.path.join(HERE, "..", "processed"))

FILES = {
    "appart": "vente-appartement-2025-26.xls",
    "maison": "vente-maison-2025-2026.xls",
}


def parse(path: str) -> dict[str, float]:
    """Return {commune_name: price_per_m2} for rows with a published price."""
    wb = xlrd.open_workbook(path)
    sh = wb.sheet_by_index(0)
    out: dict[str, float] = {}
    for r in range(sh.nrows):
        commune = str(sh.cell_value(r, 2)).strip()
        if not commune or commune == "Commune":
            continue
        prix_m2 = sh.cell_value(r, 5)
        if isinstance(prix_m2, str) and prix_m2.strip() in ("*", ""):
            continue
        try:
            out[commune] = round(float(prix_m2))
        except (TypeError, ValueError):
            continue
    return out


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    result: dict[str, dict[str, float]] = {}
    for key, fn in FILES.items():
        result[key] = parse(os.path.join(RAW, fn))
        print(f"{key}: {len(result[key])} communes avec prix publié")
    with open(os.path.join(OUT, "prix.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
