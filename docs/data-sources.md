# Data sources inventory

Verified against the data.public.lu udata API
(`GET https://data.public.lu/api/1/datasets/?q=<query>`) on 2026-08-23.

## Found datasets

| Theme | Dataset (data.public.lu) | Status |
|-------|--------------------------|--------|
| Boundaries | **Limites administratives du Grand-Duché de Luxembourg** | ✅ |
| Housing | **Prix annoncés des logements - Par commune** (also: all-Luxembourg, Luxembourg-Ville per quartier) | ✅ |
| Population density | **Densité de la population par canton et commune (Habitants par km²) 1821 - 2017** | ✅ |
| Employment | **Population et emploi - Marché du travail - Chômage** | ✅ |
| Air quality | **Environnement et urbanisme - Données brutes mesures qualité de l'air et trafic** (raw station measurements) | ✅ |
| Air quality | **Territoire environnement et énergie - Environnement - Air** | ✅ |
| Air quality | **Ozone - O₃: days with maximum 8h mean values above 120 µg/m³** | ✅ |
| Weather | **Meteolux API** (forecast + climate; sunshine hours from ASTA measurement stations) | ✅ |
| Cost of living | STATEC — consumer price index | 🔍 national level only |

## Known limitations

- **Cost of living** exists only at national level (STATEC CPI). The
  per-commune proxy is housing prices.
- **Sunshine** comes from MeteoLux/ASTA measurement stations, not commune
  polygons → needs interpolation (or station markers) for a choropleth.
- **Air quality** raw measurements are per-station point data → same
  interpolation question.
- Check each dataset's license / attribution requirement at ETL time
  (data.public.lu datasets are usually CC0 / open licenses).

## API notes

- data.public.lu exposes a udata API: `https://data.public.lu/api/1/datasets/?q=…`
  (dataset metadata + `resources[]` with download URLs).
- MeteoLux open-data API: documented in the "Meteolux API" dataset on
  data.public.lu.
