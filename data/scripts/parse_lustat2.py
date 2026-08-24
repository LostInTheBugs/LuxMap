#!/usr/bin/env python3
"""Parse LUSTAT SDMX-JSON 2.0 dumps → data/processed/*.json.

Inputs (data/raw/, fetched with curl):
  - population.json   (flow LU1,DF_X021,1.1 — Population par canton et commune)
  - accidents.json    (flow LU1,DSD_ACCIDENT@DF_X040,1.0 — Accidents de la route
                       par canton et gravité; SEVERITY_ACC=_T kept = all accidents)

Outputs (data/processed/):
  - population.json   {lau2: {year: inhabitants}} — 100 communes
  - accidents.json    {lau2: {year: accidents}} — canton value disaggregated to
                       every commune of the canton (STATEC publishes accidents
                       per canton only)
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, "..", "raw"))
OUT = os.path.normpath(os.path.join(HERE, "..", "processed"))


def load_jsondata(path: str):
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    st = d["data"]["structures"][0]
    ds = d["data"]["dataSets"][0]
    return st, ds


def parse_population() -> dict[str, dict[str, int]]:
    """{lau2: {year: inhabitants}} — communes only (LAU2 codes, no cantons/total)."""
    st, ds = load_jsondata(os.path.join(RAW, "population.json"))
    dims = st["dimensions"]["series"]
    canton_dim = next(s for s in dims if s["id"] == "CANTON")
    periods = [v["id"] for v in st["dimensions"]["observation"][0]["values"]]
    canton_name = {}  # C0X -> STATEC canton name
    for v in canton_dim["values"]:
        if v["id"].startswith("C") and v.get("parent") == "T":
            canton_name[v["id"]] = v["name"]
    out: dict[str, dict[str, int]] = {}
    for sk, sv in ds["series"].items():
        _, ci = (int(x) for x in sk.split(":"))
        code = canton_dim["values"][ci]["id"]
        if not (len(code) == 4 and code.isdigit()):  # communes only
            continue
        obs = {}
        for i, o in sv.get("observations", {}).items():
            v = o[0]
            if v is not None and int(i) < len(periods):
                obs[periods[int(i)]] = int(v)
        if obs:
            out[code] = obs
    print(f"population: {len(out)} communes, {len(periods)} millésimes "
          f"({periods[0]}–{periods[-1]}), {len(canton_name)} cantons référencés")
    return out


def parse_accidents() -> dict[str, dict[str, int]]:
    """{lau2: {year: accidents}} — canton totals (SEVERITY_ACC=_T) disaggregated
    to every commune of the canton (via the canton code C0X)."""
    st, ds = load_jsondata(os.path.join(RAW, "accidents.json"))
    dims = st["dimensions"]["series"]
    geo_dim = next(s for s in dims if s["id"] == "GEO")
    sev_dim = next(s for s in dims if s["id"] == "SEVERITY_ACC")
    periods = [v["id"] for v in st["dimensions"]["observation"][0]["values"]]
    sev_total = next(i for i, v in enumerate(sev_dim["values"]) if v["id"] == "_T")

    # canton STATEC names ↔ codes: accidents GEO uses "Canton Esch" etc.
    geo_by_name = {}
    for v in geo_dim["values"]:
        if v["id"].startswith("LU"):
            geo_by_name[v["name"].removeprefix("Canton ").strip()] = v["id"]

    # commune -> canton code via the population dump (same STATEC naming)
    pop_st, pop_ds = load_jsondata(os.path.join(RAW, "population.json"))
    pop_canton_dim = next(s for s in pop_st["dimensions"]["series"] if s["id"] == "CANTON")
    pop_canton_name = {v["id"]: v["name"] for v in pop_canton_dim["values"] if v["id"].startswith("C")}
    lau2_to_canton_code: dict[str, str] = {}
    for v in pop_canton_dim["values"]:
        if len(v["id"]) == 4 and v["id"].isdigit() and v.get("parent", "").startswith("C"):
            lau2_to_canton_code[v["id"]] = v["parent"]

    canton_code_to_geo = {}
    for code, name in pop_canton_name.items():
        geo = geo_by_name.get(name)
        if geo is None:
            print(f"  ! canton sans correspondance accidents: {code} {name}")
        else:
            canton_code_to_geo[code] = geo

    # gather canton totals: {geo_id: {year: accidents}}
    canton_totals: dict[str, dict[str, int]] = {}
    for sk, sv in ds["series"].items():
        idx = [int(x) for x in sk.split(":")]
        gi, si = idx[-2], idx[-1]
        if si != sev_total:
            continue
        geo_id = geo_dim["values"][gi]["id"]
        obs = {}
        for i, o in sv.get("observations", {}).items():
            v = o[0]
            if v is not None and int(i) < len(periods):
                obs[periods[int(i)]] = int(v)
        if obs:
            canton_totals[geo_id] = obs

    out: dict[str, dict[str, int]] = {}
    for lau2, ccode in lau2_to_canton_code.items():
        geo = canton_code_to_geo.get(ccode)
        if geo and geo in canton_totals:
            out[lau2] = canton_totals[geo]
    print(f"accidents: {len(out)} communes couvertes, {len(periods)} années "
          f"({periods[0]}–{periods[-1]}), {len(canton_totals)} cantons")
    return out


def parse_commune_series(raw: str, var_dim_id: str, var_id: str) -> dict[str, dict[str, int]]:
    """{lau2: {year: value}} for one variable of a per-commune flow.

    Generic for DF_X024 (VARIABLE=A03 natural balance) and DF_X025
    (POP_MOVEMENT=M003 net migration): the CANTON dimension mixes communes
    (4-digit LAU2), cantons (C0X) and the total (T) — communes only.
    """
    st, ds = load_jsondata(os.path.join(RAW, raw))
    dims = st["dimensions"]["series"]
    var_dim = next(s for s in dims if s["id"] == var_dim_id)
    canton_dim = next(s for s in dims if s["id"] == "CANTON")
    periods = [v["id"] for v in st["dimensions"]["observation"][0]["values"]]
    var_idx = next(i for i, v in enumerate(var_dim["values"]) if v["id"] == var_id)
    out: dict[str, dict[str, int]] = {}
    for sk, sv in ds["series"].items():
        idx = [int(x) for x in sk.split(":")]
        vi, ci = idx[1], idx[2]
        if vi != var_idx:
            continue
        code = canton_dim["values"][ci]["id"]
        if not (len(code) == 4 and code.isdigit()):
            continue
        obs = {}
        for i, o in sv.get("observations", {}).items():
            v = o[0]
            if v is not None and int(i) < len(periods):
                obs[periods[int(i)]] = int(v)
        if obs:
            out[code] = obs
    print(f"{raw} ({var_id}): {len(out)} communes, {len(periods)} années "
          f"({periods[0]}–{periods[-1]})")
    return out


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    pop = parse_population()
    with open(os.path.join(OUT, "population.json"), "w", encoding="utf-8") as f:
        json.dump(pop, f, ensure_ascii=False)
    acc = parse_accidents()
    with open(os.path.join(OUT, "accidents.json"), "w", encoding="utf-8") as f:
        json.dump(acc, f, ensure_ascii=False)
    natural = parse_commune_series("natural.json", "VARIABLE", "A03")
    with open(os.path.join(OUT, "natural.json"), "w", encoding="utf-8") as f:
        json.dump(natural, f, ensure_ascii=False)
    migration = parse_commune_series("migration.json", "POP_MOVEMENT", "M003")
    with open(os.path.join(OUT, "migration.json"), "w", encoding="utf-8") as f:
        json.dump(migration, f, ensure_ascii=False)
    # échantillon
    s = sorted(natural)[0]
    print(f"  ex {s}: {dict(list(natural[s].items())[:3])} … {dict(list(natural[s].items())[-2:])}")
    s2 = sorted(migration)[0]
    print(f"  ex {s2}: {dict(list(migration[s2].items())[:3])} … {dict(list(migration[s2].items())[-2:])}")


if __name__ == "__main__":
    main()
