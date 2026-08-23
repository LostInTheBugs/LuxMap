# LuxMap

Interactive choropleth map of Luxembourg's 102 communes, visualizing open data from
[data.public.lu](https://data.public.lu) and other Luxembourg open-data sources — air
quality, sunshine, population density, housing prices, cost of living and employment —
with side-by-side comparisons between indicators.

**Version:** [2026.08.001](https://github.com/LostInTheBugs/LuxMap/releases)

## ✨ Features

- Choropleth map of Luxembourg's **100 communes** (React + Leaflet, Vite + TypeScript)
- Indicators:
  - Population density (2017, STATEC — SDMX API)
  - Announced housing prices, apartments & houses, €/m² (2025-26, data.public.lu)
- Indicator switcher, quantile color scale, interactive legend
- Hover tooltips (value + year), click on a commune for a detail panel
- Data ETL in Python (`data/scripts/`): STATEC LUSTAT SDMX-JSON, data.public.lu
  udata API, XLS parsing
- Docker + nginx (port 3003), ready for Cloudflare → https://luxmap.cloudfr.net

## Data sources

See [docs/data-sources.md](docs/data-sources.md) for the full inventory.

| Theme | Source | Status |
|-------|--------|--------|
| Housing prices (per commune) | data.public.lu — "Prix annoncés des logements - Par commune" | ✅ integrated |
| Population density (per commune) | data.public.lu → STATEC LUSTAT (DF_X020, SDMX-JSON) | ✅ integrated |
| Commune boundaries (GeoJSON) | data.public.lu — "Limites administratives" (limadmin.geojson) | ✅ integrated |
| Employment / unemployment | data.public.lu — "Population et emploi - Marché du travail - Chômage" | 🔍 to integrate |
| Air quality | data.public.lu — "Données brutes mesures qualité de l'air et trafic" | 🔍 to integrate |
| Sunshine hours | MeteoLux open data (HVD API, ASTA stations) | 🔍 to integrate |
| Cost of living | STATEC (CPI, national level) | 🔍 to explore |

## Installation

```bash
npm install --legacy-peer-deps
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

## License

[MIT](LICENSE)
