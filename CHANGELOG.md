# Changelog

All notable changes to LuxMap are documented in this file.

## [2026.08.010] — 2026-08-24

### Changed
- Lecture mode now starts at the **oldest** year of the series (press play to
  watch the evolution from the beginning)
- Year slider + play now available in **Simple and Comparer modes** too (any
  indicator with a historical series); in Comparer, map B gets its own year
  slider when its indicator has a series

## [2026.08.008-c1] — 2026-08-24

### Fixed
- Control panel degraded: the `float: right` version badge squeezed the
  Sources/PNG button row below it (fit-content width → two-line buttons).
  Replaced with a flex `space-between` row and widened the panel to 252 px

## [2026.08.008] — 2026-08-24

### Added
- **Lecture mode**: animated time slider (play/pause) for indicators with
  historical series — announced prices 2010-2025 (apartments & houses),
  announced rents 2009-2025, unemployment 2023-2025. Quantiles are recomputed
  per year; the button is disabled for snapshot-only indicators
- **Sources page** (ℹ️ button): link + methodology note for every dataset
  (data.public.lu, STATEC LUSTAT, AEV, RNPP, OSM)

## [2026.08.006] — 2026-08-24

### Added
- Median age per commune (RNPP age pyramid, 01-07-2026) — 64/100 communes
- Share of foreign residents per commune (RNPP nationality series, 30/09/2021)
  — 97/100
- Announced apartment rents per commune, €/m²/month (2025-26,
  data.public.lu "Loyers annoncés") — 35/100
- **PNG export** button (html2canvas, captures the map + legend at 2×)

### Fixed
- Legend scale now shows the unit on min/max values (e.g. "59 hab/km²" —
  "465 hab/km²")

## [2026.08.004-c3] — 2026-08-23

### Fixed
- Refit hardened: runs in requestAnimationFrame + `invalidateSize()` before
  `fitBounds` (fresh layout size), window-resize auto-size handler added
- Version badge in the control panel (bottom right) to identify the running
  build at a glance

## [2026.08.004-c2] — 2026-08-23

### Fixed
- Dual-mode maps misaligned at start on wide screens: map A kept its
  full-width fit when the split happened. Both maps now re-fit to the country
  bounds on every mode change (RefitController), and stale sync state is
  dropped when switching modes

## [2026.08.004-c1] — 2026-08-23

### Fixed
- Traefik routing on port 80: a router with `tls.certresolver` only matches
  HTTPS once the certificate is issued → split into two routers
  (`luxmap` on websecure+TLS, `luxmap-web` on web)

## [2026.08.004] — 2026-08-23

### Added
- **Ratio mode**: single map colored by the ratio A / B (e.g. house vs
  apartment prices), with A/B indicator selects, dedicated legend and a
  "Ratio A/B" row in the detail panel
- Mode selector (Simple / Comparer / Ratio) in the control panel
- `deploy.sh` — one-command redeploy on serveur-prod (Traefik labels included)

## [2026.08.002-c1] — 2026-08-23

### Fixed
- communes.geojson re-simplified with mapshaper (784 KB → 59 KB) after the
  ETL regenerated it at full resolution

## [2026.08.002] — 2026-08-23

### Added
- Unemployment rate per commune (2025, STATEC LUSTAT DF_X026) — 99/100 communes
- Air quality: days with O₃ 8h-mean > 120 µg/m³ (2021-23, AEV) — IDW
  interpolation from 53 Greater-Region stations to commune centroids (100/100)
- Dual-map comparison mode: two synchronized maps (pan/zoom sync), one
  indicator each, stacked on mobile
- First stable release, deployed to production (serveur-prod + Cloudflare)

## [2026.08.001] — 2026-08-23

### Added
- Choropleth map of Luxembourg's 100 communes (React 19 + Leaflet, Vite + TypeScript)
- Indicators: population density 2017 (STATEC SDMX-JSON via LUSTAT DF_X020),
  announced housing prices 2025-26 for apartments and houses (data.public.lu XLS)
- Indicator switcher, quantile color scale, legend, hover tooltips, click detail panel
- ETL scripts: `data/scripts/parse_prix.py` (XLS → JSON), `interpolate_o3.py`
  (IDW station → commune centroids), `build_data.py` (joins all indicators by
  LAU2 code)
- Docker multi-stage build + nginx config (port 3003, geojson mime + gzip)
- README, LICENSE (MIT), data-source inventory (docs/data-sources.md)
