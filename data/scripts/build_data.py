#!/usr/bin/env python3
"""Build app data from raw sources (stdlib only).

Inputs (data/raw/):
  - limadmin.geojson        (dataset "Limites administratives du Grand-Duché de Luxembourg")
  - density2017.json        (STATEC LUSTAT SDMX-JSON, flow LU1,DF_X020,1.1, 2017)
  - processed/prix.json     (output of parse_prix.py)

Outputs:
  - src/data/indicators.json   [{lau2, commune, canton, density?, prix_appart?, prix_maison?}]
  - public/communes.geojson    commune polygons, properties {LAU2, COMMUNE, CANTON}
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, "..", "raw"))
PROC = os.path.normpath(os.path.join(HERE, "..", "processed"))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))


BLACKLIST = {"moyenne nationale"}  # aggregate rows in the price files
ALIASES = {"redange sur attert": "redange attert"}


def norm(name: str) -> str:
    """Normalize a commune name for matching (accents/case/spaces insensitive)."""
    n = name.strip().lower()
    n = re.sub(r"['\u2019\-\.]", " ", n)
    n = re.sub(r"\s+", " ", n)
    return ALIASES.get(n, n)


def load_density() -> dict[str, float]:
    """Parse the STATEC SDMX-JSON (flow DF_X020) → {lau2: inhabitants per km²}."""
    with open(os.path.join(RAW, "density2017.json"), encoding="utf-8") as f:
        d = json.load(f)
    st = d["structure"]
    canton_dim = st["dimensions"]["series"][1]  # FREQ, CANTON
    code2name = {v["id"]: v["name"] for v in canton_dim["values"]}
    out: dict[str, float] = {}
    for sk, sv in d["dataSets"][0]["series"].items():
        idx = sk.split(":")
        code = canton_dim["values"][int(idx[1])]["id"]
        if len(code) == 4 and not code.startswith("C"):  # communes only
            obs = sv.get("observations", {})
            if "0" in obs:
                out[code] = float(obs["0"][0])
    return out


def load_prix() -> dict[str, dict[str, float]]:
    with open(os.path.join(PROC, "prix.json"), encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    with open(os.path.join(RAW, "limadmin.geojson"), encoding="utf-8") as f:
        gj = json.load(f)
    communes_fc = gj["communes"]

    density = load_density()
    prix = load_prix()
    prix_by_norm = {
        key: {norm(n): v for n, v in d.items() if norm(n) not in BLACKLIST}
        for key, d in prix.items()
    }

    indicators = []
    unmatched = {k: set() for k in prix}
    for feat in communes_fc["features"]:
        p = feat["properties"]
        lau2, name = p["LAU2"], p["COMMUNE"]
        row = {"lau2": lau2, "commune": name, "canton": p["CANTON"]}
        if lau2 in density:
            row["density"] = round(density[lau2], 1)
        for key in prix_by_norm:
            v = prix_by_norm[key].get(norm(name))
            if v is not None:
                row["prix_" + key] = int(v)
            else:
                unmatched[key].add(name)
        indicators.append(row)

    # keep only expected keys, stable order
    out = []
    for row in sorted(indicators, key=lambda r: r["commune"]):
        clean = {"lau2": row["lau2"], "commune": row["commune"], "canton": row["canton"]}
        if "density" in row:
            clean["density"] = row["density"]
        for key in ("prix_appart", "prix_maison"):
            if key in row:
                clean[key] = row[key]
        out.append(clean)

    os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
    with open(os.path.join(ROOT, "src", "data", "indicators.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    simple = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "LAU2": f["properties"]["LAU2"],
                    "COMMUNE": f["properties"]["COMMUNE"],
                    "CANTON": f["properties"]["CANTON"],
                },
                "geometry": f["geometry"],
            }
            for f in communes_fc["features"]
        ],
    }
    with open(os.path.join(ROOT, "public", "communes.geojson"), "w", encoding="utf-8") as f:
        json.dump(simple, f)

    print(f"communes: {len(out)}")
    print(f"  density: {sum('density' in r for r in out)}")
    print(f"  prix_appart: {sum('prix_appart' in r for r in out)}")
    print(f"  prix_maison: {sum('prix_maison' in r for r in out)}")
    for k, names in unmatched.items():
        print(f"  sans prix ({k}): {len(names)} — {sorted(names)[:12]}")


if __name__ == "__main__":
    main()
