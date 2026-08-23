# Data sources inventory

Verified against the data.public.lu udata API
(`GET https://data.public.lu/api/1/datasets/?q=<query>`) on 2026-08-23.

## Found datasets

| Theme | Dataset (data.public.lu) | Status |
|-------|--------------------------|--------|
| Boundaries | **Limites administratives du Grand-Duché de Luxembourg** | ✅ used (limadmin.geojson, 100 communes, LAU2 codes) |
| Housing | **Prix annoncés des logements - Par commune** (also: all-Luxembourg, Luxembourg-Ville per quartier) | ✅ used (XLS 2025-26) |
| Population density | **Densité de la population par canton et commune (Habitants par km²) 1821 - 2017** | ✅ used (STATEC LUSTAT DF_X020) |
| Unemployment | **Population et emploi - Marché du travail - Chômage** → STATEC LUSTAT **DF_X026** (Emploi et chômage par canton et commune) | ✅ used (VARIABLE C6 = taux de chômage %) |
| Air quality | **Ozone - O₃: days with maximum 8h mean values above 120 µg/m³** (AEV, 53 station points, Greater Region) | ✅ used (IDW interpolation → communes) |
| Air quality | **Environnement et urbanisme - Données brutes mesures qualité de l'air et trafic** (VDL, 2 stations city-only) | ⛔ too local |
| Weather | **Meteolux API** — HVD: 1 station only (Findel), realtime airport METAR params, **no sunshine/solar parameter** | ⛔ not feasible per commune |
| Cost of living | STATEC — consumer price index | 🔍 national level only |

## Known limitations

- **Cost of living** exists only at national level (STATEC CPI). The
  per-commune proxy is housing prices.
- **Sunshine hours are NOT feasible per commune**: the MeteoLux HVD API exposes
  a single station (Findel airport) with realtime METAR-style parameters only —
  no sunshine/solar radiation parameter, no climate history. (The ASTA agrometeo
  station network is not publicly reachable.)
- **Air quality** raw measurements exist for Luxembourg-Ville only (VDL, 2
  traffic stations) → too local. The O₃ exceedance dataset (AEV, Greater Region,
  53 points) is interpolated with IDW (power 2) at commune centroids.
- O₃ values are interpolated estimates, not measurements — display as such.
- Check each dataset's license / attribution requirement at ETL time
  (data.public.lu datasets are usually CC0 / open licenses).

## API notes

- data.public.lu exposes a udata API: `https://data.public.lu/api/1/datasets/?q=…`
  (dataset metadata + `resources[]` with download URLs — resource URLs include a
  trailing filename, without it the download 404s).
- STATEC LUSTAT SDMX-REST: `https://lustat.statec.lu/rest/data/LU1,<FLOW>,<version>/all?format=JSON`
  (version required, e.g. DF_X020 = 1.1, DF_X026 = 1.1; `Accept: application/json`
  returns SDMX-JSON; some observations use `""` for missing values).
- MeteoLux open-data API: HVD endpoints under `https://metapi.ana.lu/api/v1/hvd/…` (CC0).
