import { useEffect, useRef } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { IndicatorDef, IndicatorKey } from "../types";
import { colorFor, defOf, fmt } from "../utils/scale";
import { useLang } from "../i18n";
import type { SyncState } from "../App";

const BOUNDS = L.latLngBounds([49.4, 5.72], [50.2, 6.54]);

interface GeoFeature {
  type: "Feature";
  properties: {
    LAU2?: string;
    COMMUNE?: string;
    CANTON?: string;
    CIRCONSCRIPTION?: string;
    [k: string]: string | undefined;
  };
  geometry: unknown;
}
interface GeoData {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface Props {
  geo: GeoData;
  side: string;
  active: IndicatorKey;
  def?: IndicatorDef;
  thresholds: number[];
  selected: string | null;
  valueOf: (key: string) => number | undefined;
  onSelect: (key: string | null) => void;
  syncEnabled: boolean;
  sync: SyncState | null;
  onSync: (from: string, center: L.LatLng, zoom: number) => void;
  refitKey: number;
  /** Geometry property carrying the feature id (LAU2 | CANTON | CIRCONSCRIPTION). */
  keyField: string;
  /** Geometry property carrying the display name. */
  nameField: string;
  /** Increments whenever the geometry data changes (forces a GeoJSON remount). */
  geoStamp: number;
  /** Year-over-year % evolution per group (markers + tooltip). */
  evo: { map: Record<string, number>; prevYear: string } | null;
}

/** Centroid (lng, lat) of the largest ring of a Polygon/MultiPolygon. */
function polygonCentroid(
  geometry: { type: string; coordinates: unknown },
): [number, number] | null {
  const rings: number[][][] =
    geometry.type === "Polygon"
      ? (geometry.coordinates as number[][][])
      : (geometry.coordinates as number[][][][]).flat();
  let best: [number, number] | null = null;
  let bestArea = -1;
  for (const ring of rings) {
    let s = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    const area = Math.abs(s) / 2;
    if (area <= bestArea) continue;
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      const f = x1 * y2 - x2 * y1;
      a += f;
      cx += (x1 + x2) * f;
      cy += (y1 + y2) * f;
    }
    if (a === 0) continue; // anneau dégénéré : garder le meilleur candidat précédent
    bestArea = area;
    best = [cx / (3 * a), cy / (3 * a)];
  }
  return best;
}

/** "▲ +4,2 %" / "▼ −1,8 %" HTML span with direction color. */
function evoHtml(
  pct: number,
  prevYear: string,
  locale: string,
  t: (k: string, v?: Record<string, string | number>) => string,
): string {
  const up = pct > 0;
  const color = up ? "#16a34a" : pct < 0 ? "#dc2626" : "#64748b";
  const arrow = up ? "▲" : pct < 0 ? "▼" : "•";
  const sign = pct > 0 ? "+" : "";
  const val = pct.toLocaleString(locale, { maximumFractionDigits: 1 });
  return `<span style="color:${color};font-weight:700">${arrow} ${sign}${val} %</span> <span style="color:#94a3b8">(${t("evo.vs", { year: prevYear })})</span>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Contenu HTML du tooltip d'une entité. */
function tooltipHtml(
  name: string,
  value: number | undefined,
  def: IndicatorDef,
  pct: number | undefined,
  prevYear: string | undefined,
  indLabel: (k: string) => string,
  indUnit: (u: string) => string,
  locale: string,
  t: (k: string, v?: Record<string, string | number>) => string,
): string {
  const evoLine =
    pct === undefined || prevYear === undefined ? "" : `<br/>${evoHtml(pct, prevYear, locale, t)}`;
  return (
    `<b>${escapeHtml(name)}</b><br/>${escapeHtml(indLabel(def.key))} : ` +
    `${fmt(value, indUnit(def.unit), def.decimals ?? 0, locale)} ` +
    `<span style="color:#94a3b8">(${def.year})</span>${evoLine}`
  );
}

/** Style d'un polygone selon sa valeur et son état de sélection. */
function featureStyle(
  value: number | undefined,
  thresholds: number[],
  isSelected: boolean,
): L.PathOptions {
  return {
    fillColor: colorFor(value, thresholds),
    fillOpacity: 0.85,
    weight: isSelected ? 2.5 : 0.8,
    color: isSelected ? "#0ea5e9" : "#64748b",
  };
}

/**
 * Fits the map to the country bounds whenever `refitKey` changes — both maps
 * re-fit on layout changes (simple/ratio = full width, dual = half width) so
 * they always start from the same center/zoom.
 * Bulletproofing: runs in a requestAnimationFrame (after the browser applied
 * the new flex layout) and calls invalidateSize() first so the fit reads the
 * fresh container size.
 */
function RefitController({ bounds, refitKey }: { bounds: L.LatLngBounds; refitKey: number }) {
  const map = useMap();
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [20, 20], animate: false });
    });
    return () => cancelAnimationFrame(raf);
  }, [map, bounds, refitKey]);
  return null;
}

/** Keeps the map size in sync with its container on window resizes. */
function AutoSize() {
  const map = useMap();
  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);
  return null;
}

/**
 * Drops the "Leaflet" prefix from the attribution control — only the
 * required "© OpenStreetMap" credit stays (data sources live in the ℹ️
 * Sources button). @types/leaflet no longer exposes attributionPrefix on
 * MapOptions, hence the instance call.
 */
function NoLeafletPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);
  return null;
}

/** Keeps two maps' pan/zoom in sync (moveend → shared state → setView on the other). */
function SyncController({
  sync,
  side,
  onSync,
}: {
  sync: SyncState | null;
  side: string;
  onSync: Props["onSync"];
}) {
  const map = useMap();
  const applying = useRef(false);

  useEffect(() => {
    const onMoveEnd = () => {
      if (applying.current) {
        applying.current = false;
        return;
      }
      onSync(side, map.getCenter(), map.getZoom());
    };
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map, side, onSync]);

  useEffect(() => {
    if (sync && sync.from !== side) {
      applying.current = true;
      map.setView(sync.center, sync.zoom, { animate: false });
    }
  }, [sync, map, side]);

  return null;
}

export default function MapPanel({
  geo,
  side,
  active,
  def,
  thresholds,
  selected,
  valueOf,
  onSelect,
  syncEnabled,
  sync,
  onSync,
  refitKey,
  keyField,
  nameField,
  geoStamp,
  evo,
}: Props) {
  const { t, locale, indLabel, indUnit } = useLang();
  const activeDef = def ?? defOf(active);
  // La clé ne change QUE si la géométrie change (commune ↔ canton ↔ circonscription).
  // Les changements de couleur, de sélection et d'année sont appliqués en place
  // par l'effet ci-dessous, sans reconstruire les 100 polygones.
  const geoKey = `${side}-${keyField}-${geoStamp}`;
  const geoRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  // Applique couleurs, sélection et tooltips sur les couches existantes.
  useEffect(() => {
    const group = geoRef.current;
    if (!group) return;
    group.eachLayer((layer) => {
      const f = (layer as L.Layer & { feature?: GeoFeature }).feature;
      if (!f) return;
      const id = f.properties[keyField] as string;
      const name = String(f.properties[nameField] ?? id);
      const value = valueOf(id);
      const pct = evo ? evo.map[id] : undefined;
      (layer as L.Path).setStyle(featureStyle(value, thresholds, id === selected));
      (layer as L.Layer).setTooltipContent(
        tooltipHtml(name, value, activeDef, pct, evo?.prevYear, indLabel, indUnit, locale, t),
      );
    });
  }, [thresholds, selected, valueOf, activeDef, evo, keyField, nameField, indLabel, indUnit, locale, t]);

  return (
    <MapContainer
      center={[49.75, 6.1]}
      zoom={9}
      zoomControl={false}
      style={{ position: "absolute", inset: 0 }}
      minZoom={8}
      maxZoom={18}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <NoLeafletPrefix />
      <ZoomControl position="bottomright" />
      <RefitController bounds={BOUNDS} refitKey={refitKey} />
      <AutoSize />
      <GeoJSON
        key={geoKey}
        ref={geoRef}
        data={geo}
        style={(feature) => {
          if (!feature) return {};
          const id = feature.properties[keyField] as string;
          return featureStyle(valueOf(id), thresholds, id === selected);
        }}
        onEachFeature={(feature, layer) => {
          const id = feature.properties[keyField] as string;
          const name = String(feature.properties[nameField] ?? id);
          const pct = evo ? evo.map[id] : undefined;
          layer.bindTooltip(
            tooltipHtml(name, valueOf(id), activeDef, pct, evo?.prevYear, indLabel, indUnit, locale, t),
            { sticky: true, className: "lux-tooltip" },
          );
          layer.on("click", () => onSelect(id));
        }}
      />
      {evo &&
        geo.features.map((f) => {
          const id = f.properties[keyField] as string;
          const pct = evo.map[id];
          if (pct === undefined) return null;
          const c = polygonCentroid(f.geometry as { type: string; coordinates: unknown });
          if (!c) return null;
          const up = pct > 0;
          const color = up ? "#16a34a" : pct < 0 ? "#dc2626" : "#64748b";
          const arrow = up ? "▲" : pct < 0 ? "▼" : "•";
          const sign = pct > 0 ? "+" : "";
          const label = `${arrow} ${sign}${pct.toLocaleString(locale, { maximumFractionDigits: 1 })} %`;
          return (
            <Marker
              key={`evo-${geoStamp}-${id}`}
              position={[c[1], c[0]]}
              interactive={false}
              icon={L.divIcon({
                className: "lux-evo",
                html: `<span style="color:${color}">${label}</span>`,
              })}
            />
          );
        })}
      {syncEnabled && <SyncController sync={sync} side={side} onSync={onSync} />}
    </MapContainer>
  );
}
