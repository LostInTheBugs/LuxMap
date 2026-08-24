import { useEffect, useRef } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
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
          layer.bindTooltip(
            `<b>${escapeHtml(String(name))}</b><br/>${escapeHtml(activeDef.label)} : ${fmt(v, activeDef.unit, activeDef.decimals ?? 0)} <span style="color:#94a3b8">(${activeDef.year})</span>`,
            { sticky: true, className: "lux-tooltip" },
          );
          layer.on("click", () => onSelect(id as string));
        }}
      />
      {syncEnabled && <SyncController sync={sync} side={side} onSync={onSync} />}
    </MapContainer>
  );
}
