import { useEffect, useRef } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { IndicatorDef, IndicatorKey } from "../types";
import { colorFor, defOf, fmt } from "../utils/scale";
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
    bestArea = area;
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
    best = a === 0 ? null : [cx / (3 * a), cy / (3 * a)];
  }
  return best;
}

/** "▲ +4,2 %" / "▼ −1,8 %" HTML span with direction color. */
function evoHtml(pct: number, prevYear: string): string {
  const up = pct > 0;
  const color = up ? "#16a34a" : pct < 0 ? "#dc2626" : "#64748b";
  const arrow = up ? "▲" : pct < 0 ? "▼" : "•";
  const sign = pct > 0 ? "+" : "";
  const val = pct.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `<span style="color:${color};font-weight:700">${arrow} ${sign}${val} %</span> <span style="color:#94a3b8">(vs ${prevYear})</span>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const activeDef = def ?? defOf(active);
  const geoKey = `${side}-${keyField}-${geoStamp}-${active}-${thresholds.join(",")}-${selected ?? ""}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

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
      <ZoomControl position="bottomright" />
      <RefitController bounds={BOUNDS} refitKey={refitKey} />
      <AutoSize />
      <GeoJSON
        key={geoKey}
        data={geo}
        style={(feature) => {
          if (!feature) return {};
          const id = feature.properties[keyField];
          const isSel = id === selected;
          return {
            fillColor: colorFor(valueOf(id as string), thresholds),
            fillOpacity: 0.85,
            weight: isSel ? 2.5 : 0.8,
            color: isSel ? "#0ea5e9" : "#64748b",
          };
        }}
        onEachFeature={(feature, layer) => {
          const id = feature.properties[keyField];
          const name = feature.properties[nameField] ?? id;
          const v = valueOf(id as string);
          const pct = evo ? evo.map[id as string] : undefined;
          const evoLine =
            pct === undefined || !evo
              ? ""
              : `<br/>${evoHtml(pct, evo.prevYear)}`;
          layer.bindTooltip(
            `<b>${escapeHtml(String(name))}</b><br/>${escapeHtml(activeDef.label)} : ${fmt(v, activeDef.unit, activeDef.decimals ?? 0)} <span style="color:#94a3b8">(${activeDef.year})</span>${evoLine}`,
            { sticky: true, className: "lux-tooltip" },
          );
          layer.on("click", () => onSelect(id as string));
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
          const label = `${arrow} ${sign}${pct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
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
