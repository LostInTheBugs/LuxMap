# Changelog

All notable changes to LuxMap are documented in this file.

## [2026.08.001] — 2026-08-23

### Added
- Choropleth map of Luxembourg's 100 communes (React 19 + Leaflet, Vite + TypeScript)
- Indicators: population density 2017 (STATEC SDMX-JSON via LUSTAT DF_X020),
  announced housing prices 2025-26 for apartments and houses (data.public.lu XLS)
- Indicator switcher, quantile color scale, legend, hover tooltips, click detail panel
- ETL scripts: `data/scripts/parse_prix.py` (XLS → JSON), `data/scripts/build_data.py`
  (joins density + prices to commune polygons by LAU2 code)
- Docker multi-stage build + nginx config (port 3003, geojson mime + gzip)
- README, LICENSE (MIT), data-source inventory (docs/data-sources.md)
