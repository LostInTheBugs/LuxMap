#!/usr/bin/env python3
"""Median age per commune from the RNPP age pyramid CSV → data/processed/age_median.json.

Source (dataset "RNPP : Pyramide d'âge par commune"): 01-07-2026-rnrpp-pyramide-age-commune.csv
Columns: COMMUNE_CODE (LAU2, 4 digits), COMMUNE_NOM, SEXE, AGE00_05..AGE100_
The median is approximated inside the median 5-year band (linear interpolation).
"""
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, "..", "raw"))
OUT = os.path.normpath(os.path.join(HERE, "..", "processed"))

BANDS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]


def main() -> None:
    counts: dict[str, list[int]] = {}  # lau2 -> counts per band (F+M)
    with open(os.path.join(RAW, "pyramide-age.csv"), encoding="iso-8859-1") as f:
        reader = csv.DictReader(f)
        for row in reader:
            lau2 = row["COMMUNE_CODE"].strip()
            c = counts.setdefault(lau2, [0] * len(BANDS))
            for i, lo in enumerate(BANDS):
                key = f"AGE{lo:02d}_" if lo < 100 else "AGE100_"
                col = None
                for k in row:
                    if k.startswith(key):
                        col = k
                        break
                if col:
                    c[i] += int(row[col] or 0)

    out: dict[str, float] = {}
    for lau2, c in counts.items():
        total = sum(c)
        if total == 0:
            continue
        half = total / 2
        acc = 0
        median_lo, median_hi, acc_before = None, None, 0
        for i, lo in enumerate(BANDS):
            hi = lo + 5
            if acc + c[i] >= half:
                median_lo, median_hi, acc_before = lo, hi, acc
                break
            acc += c[i]
        if median_lo is None:
            continue
        # linear interpolation inside the median band
        frac = (half - acc_before) / max(c[BANDS.index(median_lo)], 1)
        out[lau2] = round(median_lo + 5 * frac, 1)

    with open(os.path.join(OUT, "age_median.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"age_median: {len(out)} communes")


if __name__ == "__main__":
    main()
