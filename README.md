# LuxMap

Interactive choropleth map of Luxembourg's 102 communes, visualizing open data from
[data.public.lu](https://data.public.lu) and other Luxembourg open-data sources — air
quality, sunshine, population density, housing prices, cost of living and employment —
with side-by-side comparisons between indicators.

**Version:** [2026.08.001](https://github.com/LostInTheBugs/LuxMap/releases)

## ✨ Features

*Planned (initial scaffold — nothing implemented yet):*

- Choropleth map of Luxembourg at commune level (React + Leaflet)
- Indicators: air quality, sunshine hours, population density, housing prices,
  cost of living, employment
- Dual-map comparison mode (indicator A vs indicator B, side by side)
- Data ETL from data.public.lu (udata API), STATEC and MeteoLux open data
- Deployed as a static Docker image behind Cloudflare → https://luxmap.cloudfr.net

## Data sources

See [docs/data-sources.md](docs/data-sources.md) for the full inventory.

| Theme | Source | Status |
|-------|--------|--------|
| Housing prices (per commune) | data.public.lu — "Prix annoncés des logements - Par commune" | ✅ found |
| Population density (per commune) | data.public.lu — "Densité de la population par canton et commune" | ✅ found |
| Employment / unemployment | data.public.lu — "Population et emploi - Marché du travail - Chômage" | ✅ found |
| Air quality | data.public.lu / Administration de l'environnement | 🔍 to explore |
| Sunshine hours | MeteoLux open data (ASTA stations) | 🔍 to explore |
| Cost of living | STATEC (CPI, national level) | 🔍 to explore |
| Commune boundaries (GeoJSON) | data.public.lu — administrative limits | 🔍 to explore |

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
