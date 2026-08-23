import { useEffect, useRef } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { IndicatorDef, IndicatorKey } from "../types";
import { colorFor, defOf, fmt } from "../utils/scale";
import type { SyncState } from "../App";

const BOUNDS = L.latLngBounds([49.4, 5.72], [50.2, 6.54]);

interface GeoFeature {
  type: "Feature";
  properties: { LAU2: string; COMMUNE: string; CANTON: string };
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
  valueOf: (lau2: string) => number | undefined;
  onSelect: (lau2: string | null) => void;
  syncEnabled: boolean;
  sync: SyncState | null;
  onSync: (from: string, center: L.LatLng, zoom: number) => void;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
}: Props) {
  const activeDef = def ?? defOf(active);
  const geoKey = `${side}-${active}-${thresholds.join(",")}-${selected ?? ""}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  return (
    <MapContainer
      bounds={BOUNDS}
      boundsOptions={{ padding: [20, 20] }}
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
      <GeoJSON
        key={geoKey}
        data={geo}
        style={(feature) => {
          if (!feature) return {};
          const lau2 = feature.properties.LAU2;
          const isSel = lau2 === selected;
          return {
            fillColor: colorFor(valueOf(lau2), thresholds),
            fillOpacity: 0.85,
            weight: isSel ? 2.5 : 0.8,
            color: isSel ? "#0ea5e9" : "#64748b",
          };
        }}
        onEachFeature={(feature, layer) => {
          const { LAU2, COMMUNE } = feature.properties;
          const v = valueOf(LAU2);
          layer.bindTooltip(
            `<b>${escapeHtml(COMMUNE)}</b><br/>${escapeHtml(activeDef.label)} : ${fmt(v, activeDef.unit, activeDef.decimals ?? 0)} <span style="color:#94a3b8">(${activeDef.year})</span>`,
            { sticky: true, className: "lux-tooltip" },
          );
          layer.on("click", () => onSelect(LAU2));
        }}
      />
      {syncEnabled && <SyncController sync={sync} side={side} onSync={onSync} />}
    </MapContainer>
  );
}
