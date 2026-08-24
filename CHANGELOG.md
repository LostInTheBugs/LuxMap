# Changelog

All notable changes to LuxMap are documented in this file.

## [2026.08.024] — 2026-08-24

### Added
- **First stable release.** 12 indicators: population density, population
  (1821–2026), natural balance (1987–2025), net migration (1990–2025),
  unemployment, road accidents (by canton), O₃ days, median age, foreign
  residents, advertised rents and prices (apartments/houses)
- **POC disclaimer** shown on first visit (dismissed per browser)
- **Multilingual UI**: 🇫🇷 Français, 🇬🇧 English, 🇩🇪 Deutsch, 🇵🇹 Português,
  🇱🇺 Lëtzebuergesch — language detected from the browser, selectable in the
  disclaimer and in the control panel, persisted in localStorage
- Release workflow supports `-pre` tags (prerelease GitHub releases)

## [2026.08.023-pre] — 2026-08-24

### Added
- **Natural balance** indicator (STATEC LUSTAT DF_X024, variable A03): births
  minus deaths per commune, series 1987–2025 with the year slider
- **Net migration** indicator (STATEC LUSTAT DF_X025, variable M003): arrivals
  minus departures per commune, series 1990–2025 with the year slider
- Release workflow now supports `-pre` tags (prerelease GitHub releases)

## [2026.08.022] — 2026-08-24

### Added
- **Population** indicator (STATEC LUSTAT DF_X021): per-commune series from
  1821 to 2026 (60 years) with the year slider and evolution labels
- **Road accidents** indicator (STATEC LUSTAT DF_X040): per-canton series
  2015–2025 (all severities), canton values reported on their communes
- New ETL parser `data/scripts/parse_lustat2.py` (SDMX-JSON 2.0 / `jsondata`
  format, DSD-prefixed flows) feeding `build_data.py` + `parse_series.py`
- Sources page entries + README/data-sources inventory for both indicators
- Version badge now tracks the release (APP_VERSION bumped with the release)

## [2026.08.021] — 2026-08-24

### Performance
- Couche GeoJSON mise à jour en place au lieu d'être reconstruite à chaque clic
  ou changement d'année (les 100 polygones ne sont plus recréés 2 fois/seconde
  pendant la lecture automatique)
- `html2canvas` chargé en import dynamique : ~200 Ko retirés du bundle initial
- Coordonnées GeoJSON arrondies à 5 décimales et fichiers minifiés
  (`communes.geojson` : 787 Ko → 486 Ko)
- `indicators.json` et `series.json` servis comme fichiers statiques au lieu
  d'être inlinés dans le bundle
- En-têtes `Cache-Control: immutable` sur les assets hashés

### Corrections
- Anneaux dégénérés ignorés dans le calcul de centroïde (étiquettes d'évolution
  manquantes sur certains regroupements)
- Nombre de communes corrigé dans le README (100, et non 102)
- Suppression du doublon `src/data/series.json` / `data/processed/series.json`

### Infrastructure
- Port d'écoute aligné sur la convention projet : 3003 → 8008
- ESLint + workflow CI (build sur push et PR)
- Workflow de release automatique sur tag
- `react-leaflet` mis à jour en v5 (support officiel de React 19)
- Favicon, meta description et balises OpenGraph
- En-têtes de sécurité nginx

## [2026.08.020] — 2026-08-24

### Added
- **Mobile layout** (< 640 px): full-screen map with a collapsible bottom
  sheet ("Réglages" bar) instead of the side panel. Simple mode only
  (Comparer/Ratio and the PNG export are desktop features), legend raised
  above the bar, footer hidden. Year slider, play button, regrouping and
  sources all work in the sheet

## [2026.08.018-c1] — 2026-08-24

### Fixed
- Evolution labels were not visible: the marker position was passed as
  [lng, lat] instead of [lat, lng] (labels landed off-map, e.g. over the
  Atlantic) and Leaflet's default 12×12 iconSize collapsed the pill to 14×12
  px. Position is now [lat, lng] and `.lux-evo` forces `width: max-content`
  (12 labels, each ~65×21 px, centered on the group centroid)

## [2026.08.018] — 2026-08-24

### Added
- **Year-over-year % evolution on canton/circonscription maps**: a label at
  each group's centroid shows the change of the selected year vs the previous
  year of the series — green ▲ when it rises, red ▼ when it falls (also in
  the tooltip and the click detail panel). Works with the year slider
  (e.g. Diekirch unemployment: 2024 vs 2023 ▲ +11,7 %); hidden for
  indicators without a series or on the first year of a series

## [2026.08.016-c1] — 2026-08-24

### Fixed
- Circonscription view showed all groups grey with an empty legend:
  `computeThresholds` required ≥ 7 values (palette size), but there are only
  4 circonscriptions → empty thresholds. The min-count guard is removed (d3
  quantiles work from 1 value up)

## [2026.08.016] — 2026-08-24

### Added
- **Regrouping by cantons (12) or electoral circonscriptions (4)** with a
  checkbox in Simple/Comparer modes: dissolved boundaries (mapshaper), data
  aggregated as **median or mean over the communes that have data** (communes
  without data no longer skew the display), year-aware (works with the time
  slider), detail panel shows the group aggregate
- The aggregate value is recomputed per selected year (e.g. Sud median house
  price: 5 594 €/m² in 2025 → 3 112 €/m² in 2010)

## [2026.08.014] — 2026-08-24

### Added
- **"Synchroniser les années" checkbox** in Comparer mode (when both
  indicators have historical series): a single slider + play button loops
  through the intersection of the two series' years, advancing both maps
  together

## [2026.08.012] — 2026-08-24

### Removed
- **Lecture mode button**: now redundant — the year slider + play/pause is
  available directly in Simple (and Comparer) modes

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
