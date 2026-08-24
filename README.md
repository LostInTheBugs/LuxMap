# LuxMap

Interactive choropleth map of Luxembourg's 102 communes, visualizing open data from
[data.public.lu](https://data.public.lu) and other Luxembourg open-data sources — air
quality, sunshine, population density, housing prices, cost of living and employment —
with side-by-side comparisons between indicators.

**Version:** [2026.08.020](https://github.com/LostInTheBugs/LuxMap/releases)

## ✨ Features

- Choropleth map of Luxembourg's **100 communes** (React + Leaflet, Vite + TypeScript)
- Indicators:
  - Population density (2017, STATEC — SDMX API)
  - Unemployment rate (2025, STATEC — SDMX API)
  - Air quality: days with O₃ 8h-mean > 120 µg/m³ (2021-23, AEV — IDW
    interpolation from 53 Greater-Region stations)
  - Announced housing prices, apartments & houses, €/m² (2025-26, data.public.lu)
  - Announced apartment rents, €/m²/month (2025-26, data.public.lu)
  - Median age (2026, RNPP) and share of foreign residents (2021, RNPP)
- **PNG export** of the current map (📷 button, 2× resolution)
- **Year slider + play/pause**: animate multi-year series on the map —
  prices 2010-2025, rents 2009-2025, unemployment 2023-2025. Available in
  Simple and Comparer modes (each map gets its own slider)
- **Synced years** in Comparer: checkbox to loop through the years common to
  both series with a single play button (both maps advance together)
- **Canton / circonscription view**: checkbox to regroup by the 12 cantons or
  the 4 electoral circonscriptions (dissolved boundaries), aggregated as
  median or mean over the communes that have data — year-aware, with a
  year-over-year % evolution label on each group (▲ green / ▼ red)
- **Mobile version**: on screens < 640 px the controls become a collapsible
  bottom sheet over a full-screen map — Simple mode only (Comparer/Ratio/PNG
  are desktop features)
- **Sources page**: ℹ️ button with the link and methodology of every dataset
- **Dual-map comparison mode**: two synchronized maps side by side, one
  indicator each (stacked on mobile)
- **Ratio mode**: one map colored by the ratio A / B (any two indicators)
- Mode selector: Simple / Comparer / Ratio
- Indicator switcher, quantile color scale, interactive legend
- Hover tooltips (value + year), click on a commune for a detail panel
- Data ETL in Python (`data/scripts/`): STATEC LUSTAT SDMX-JSON, data.public.lu
  udata API, XLS parsing, IDW interpolation
- Docker + nginx (port 3003), ready for Cloudflare → https://luxmap.cloudfr.net

## Data sources

See [docs/data-sources.md](docs/data-sources.md) for the full inventory.

| Theme | Source | Status |
|-------|--------|--------|
| Housing prices (per commune) | data.public.lu — "Prix annoncés des logements - Par commune" | ✅ integrated |
| Population density (per commune) | data.public.lu → STATEC LUSTAT (DF_X020, SDMX-JSON) | ✅ integrated |
| Unemployment rate (per commune) | STATEC LUSTAT (DF_X026, SDMX-JSON) | ✅ integrated |
| Air quality (O₃ exceedance days) | data.public.lu — "Ozone - O₃ > 120 µg/m³" (AEV, 53 stations, IDW) | ✅ integrated |
| Commune boundaries (GeoJSON) | data.public.lu — "Limites administratives" (limadmin.geojson) | ✅ integrated |
| Sunshine hours | MeteoLux HVD API — ❌ 1 station only (Findel), realtime airport data, no sunshine parameter | ⛔ not feasible per commune |
| Cost of living | STATEC (CPI, national level) | 🔍 to explore |

## Installation

```bash
npm install
npm run dev
```

## Deployment

Docker multi-stage build (node → nginx), reverse-proxied by Cloudflare
(proxied DNS record `luxmap.cloudfr.net` → serveur-prod).

```bash
docker build -t luxmap .
docker run -d -p ${PORT:-3003}:80 luxmap
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3003` | Internal port exposed by the container |

## Project structure

```
├── data/            # ETL scripts + raw/processed datasets
│   ├── raw/
│   └── processed/
├── docs/            # data source inventory, decision notes
├── public/          # GeoJSON, static assets
├── src/             # React app
└── Dockerfile
```

> Re-run `python3 data/scripts/shrink_geojson.py` after any regeneration of the
> GeoJSON files in `public/` (rounds coordinates to 5 decimals and minifies).

## License

[MIT](LICENSE)
