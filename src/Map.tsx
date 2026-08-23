import { useEffect } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import type { IndicatorKey } from "./types";
import { colorFor, defOf, fmt } from "./utils/scale";

const BOUNDS = L.latLngBounds([49.4, 5.72], [50.2, 6.54]);

interface Props {
  geo: { type: "FeatureCollection"; features: Array<{ type: "Feature"; properties: { LAU2: string; COMMUNE: string }; geometry: unknown }> };
  thresholds: number[];
  active: IndicatorKey;
  selected: string | null;
  valueOf: (lau2: string) => number | undefined;
  onSelect: (lau2: string | null) => void;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default function MapView({ geo, thresholds, active, selected, valueOf, onSelect }: Props) {
  const def = defOf(active);
  const geoKey = `${active}-${thresholds.join(",")}-${selected ?? ""}`;

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
            `<b>${escapeHtml(COMMUNE)}</b><br/>${escapeHtml(def.label)} : ${fmt(v, def.unit, 0)} <span style="color:#94a3b8">(${def.year})</span>`,
            { sticky: true, className: "lux-tooltip" },
          );
          layer.on("click", () => onSelect(LAU2));
        }}
      />
    </MapContainer>
  );
}
