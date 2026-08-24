#!/usr/bin/env python3
"""Share of foreign residents per commune from the RNPP nationality series
→ data/processed/etrangers.json  {lau2: pct_etrangers} and a name→lau2 map.

Source: dataset "Ressortissants par Nationalité par Commune - série complète"
(ressortissants-par-nationalite.json, ~24 MB). COMMUNE_CODE is NOT the LAU2
code → communes are matched by name (same normalisation as build_data.py).
"""
import json
import os
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, "..", "raw"))
OUT = os.path.normpath(os.path.join(HERE, "..", "processed"))


def norm(s: str) -> str:
    return s.strip().lower().replace("-", " ").replace("'", " ").replace("/", " ").replace("  ", " ")


def main() -> None:
    with open(os.path.join(RAW, "rnpp_nat.json"), encoding="utf-8") as f:
        data = json.load(f)

    # latest date in the series
    latest = max(datetime.strptime(d["DATE"], "%d/%m/%Y") for d in data)
    latest_s = latest.strftime("%d/%m/%Y")
    print("latest date:", latest_s)

    per_commune: dict[str, dict[str, int]] = {}  # name -> {iso3: count}
    for d in data:
        if d["DATE"] != latest_s:
            continue
        per_commune.setdefault(norm(d["COMMUNE_NOM"]), {}).setdefault(d["NATIONALITE_ISO3"], 0)
        per_commune[norm(d["COMMUNE_NOM"])][d["NATIONALITE_ISO3"]] += d["NOMBRE_TOTAL"]

    out: dict[str, float] = {}
    for name, nat in per_commune.items():
        total = sum(nat.values())
        lux = nat.get("LUX", 0)
        if total == 0:
            continue
        out[name] = round((total - lux) / total * 100, 1)

    with open(os.path.join(OUT, "etrangers.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"etrangers: {len(out)} communes (par nom)")


if __name__ == "__main__":
    main()
