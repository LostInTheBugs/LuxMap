#!/usr/bin/env python3
"""Parse rental (loyer) XLS files from data.public.lu → data/processed/loyers.json.

Sources (dataset "Loyers annoncés des logements - Par commune"):
  - loyer-appart-2025-26.xls  (rents announced over the last 12 months, €/m²/month)
  - loyer-maison-2025-26.xls

Same layout as the vente files: col 2 = commune, col 5 = value (€/m²/month).
Run with: uv run --with xlrd python3 data/scripts/parse_loyers.py
"""
import json
import os

import xlrd

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, "..", "raw"))
OUT = os.path.normpath(os.path.join(HERE, "..", "processed"))

FILES = {
    "appart": "loyer-appart-2025-26.xls",
    "maison": "loyer-maison-2025-26.xls",
}


def parse(path: str) -> dict[str, float]:
    wb = xlrd.open_workbook(path)
    sh = wb.sheet_by_index(0)
    out: dict[str, float] = {}
    for r in range(sh.nrows):
        commune = str(sh.cell_value(r, 2)).strip()
        if not commune or commune == "Commune":
            continue
        val = sh.cell_value(r, 5)
        if isinstance(val, str) and val.strip() in ("*", ""):
            continue
        try:
            out[commune] = round(float(val), 2)
        except (TypeError, ValueError):
            continue
    return out


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    result = {key: parse(os.path.join(RAW, fname)) for key, fname in FILES.items()}
    with open(os.path.join(OUT, "loyers.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    for key, d in result.items():
        print(f"loyers {key}: {len(d)} communes")


if __name__ == "__main__":
    main()
