# Changelog

All notable changes to LuxMap are documented in this file.

## [2026.08.001] — 2026-08-23

### Added
- Choropleth map of Luxembourg's 100 communes (React 19 + Leaflet, Vite + TypeScript)
- Indicators: population density 2017 (STATEC SDMX-JSON via LUSTAT DF_X020),
  unemployment rate 2025 (LUSTAT DF_X026), O₃ exceedance days 2021-23 (AEV,
  IDW interpolation from 53 Greater-Region stations), announced housing prices
  2025-26 for apartments and houses (data.public.lu XLS)
- Dual-map comparison mode: two synchronized maps (pan/zoom sync), one
  indicator each, stacked on mobile
- Indicator switcher, quantile color scale, legend, hover tooltips, click detail panel
- ETL scripts: `data/scripts/parse_prix.py` (XLS → JSON), `interpolate_o3.py`
  (IDW station → commune centroids), `build_data.py` (joins all indicators by
  LAU2 code)
- Docker multi-stage build + nginx config (port 3003, geojson mime + gzip)
- README, LICENSE (MIT), data-source inventory (docs/data-sources.md)
