#!/usr/bin/env python3
"""Interpolate O₃ exceedance days (station points) to communes and add to indicators.

Source: data.public.lu "Ozone - O₃: days with maximum 8h mean values above 120 µg/m³"
  (AEV network, Greater Region, 2021-2023) → data/raw/o3.geojson

Method: inverse-distance weighting (IDW, power 2) from the station points,
evaluated at each commune centroid (computed from the full-precision geometry).
Writes data/processed/o3_communes.json: {lau2: {o3_days: float}}.
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, "..", "raw"))
PROC = os.path.normpath(os.path.join(HERE, "..", "processed"))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))

POWER = 2.0


def polygon_centroid(ring: list) -> tuple[float, float] | None:
    """Centroid of a ring (shoelace). Returns None for degenerate rings."""
    n = len(ring)
    if n < 3:
        return None
    area2 = 0.0
    cx = cy = 0.0
    for i in range(n):
        x0, y0 = ring[i][0], ring[i][1]
        x1, y1 = ring[(i + 1) % n][0], ring[(i + 1) % n][1]
        cross = x0 * y1 - x1 * y0
        area2 += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    if area2 == 0:
        return None
    a6 = area2 * 3.0
    return (cx / a6, cy / a6)


def multipolygon_centroid(coords) -> tuple[float, float]:
    """Area-weighted centroid of a MultiPolygon (lon, lat — fine at this scale)."""
    tx = ty = total = 0.0
    for poly in coords:
        c = polygon_centroid(poly[0])  # exterior ring
        if c is None:
            continue
        area = abs(sum(
            poly[0][i][0] * poly[0][(i + 1) % len(poly[0])][1]
            - poly[0][(i + 1) % len(poly[0])][0] * poly[0][i][1]
            for i in range(len(poly[0]))
        )) / 2.0
        tx += c[0] * area
        ty += c[1] * area
        total += area
    return (tx / total, ty / total)


def main() -> None:
    with open(os.path.join(RAW, "limadmin.geojson"), encoding="utf-8") as f:
        gj = json.load(f)
    with open(os.path.join(RAW, "o3.geojson"), encoding="utf-8") as f:
        o3 = json.load(f)

    stations = []
    for feat in o3["features"]:
        lon, lat = feat["geometry"]["coordinates"]
        days = feat["properties"].get("o3_days")
        if days is None:
            continue
        stations.append((lon, lat, float(days)))
    print(f"stations: {len(stations)}")

    out: dict[str, float] = {}
    missing = 0
    for feat in gj["communes"]["features"]:
        lau2 = feat["properties"]["LAU2"]
        clon, clat = multipolygon_centroid(feat["geometry"]["coordinates"])
        # IDW
        num = den = 0.0
        for slon, slat, val in stations:
            d = math.hypot(slon - clon, slat - clat)
            if d < 1e-9:
                num, den = val, 1.0
                break
            w = 1.0 / (d**POWER)
            num += w * val
            den += w
        if den == 0:
            missing += 1
            continue
        out[lau2] = round(num / den, 1)

    os.makedirs(PROC, exist_ok=True)
    with open(os.path.join(PROC, "o3_communes.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"communes interpolées: {len(out)}, échecs: {missing}")
    vals = sorted(out.values())
    print(f"min {vals[0]} · max {vals[-1]}")


if __name__ == "__main__":
    main()
