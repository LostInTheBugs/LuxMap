import { useEffect, useMemo, useState } from "react";
import MapView from "./Map";
import ControlPanel from "./components/ControlPanel";
import ColorLegend from "./components/ColorLegend";
import type { CommuneData, IndicatorKey } from "./types";
import { computeThresholds, defOf } from "./utils/scale";
import indicatorsData from "./data/indicators.json";

interface GeoFeature {
  type: "Feature";
  properties: { LAU2: string; COMMUNE: string; CANTON: string };
  geometry: unknown;
}
interface GeoData {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export default function App() {
  const [data] = useState<CommuneData[]>(indicatorsData as CommuneData[]);
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [active, setActive] = useState<IndicatorKey>("density");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/communes.geojson")
      .then((r) => r.json())
      .then((g) => {
        if (!cancelled) setGeo(g as GeoData);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byLau2 = useMemo(() => {
    const m = new Map<string, CommuneData>();
    for (const row of data ?? []) m.set(row.lau2, row);
    return m;
  }, [data]);

  const def = defOf(active);
  const values = useMemo(() => {
    if (!data) return [];
    return data
      .map((r) => r[active])
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => a - b);
  }, [data, active]);

  const thresholds = useMemo(() => computeThresholds(values), [values]);

  const valueOf = (lau2: string): number | undefined => byLau2.get(lau2)?.[active];

  const valueOfKey = (lau2: string, key: IndicatorKey): number | undefined =>
    byLau2.get(lau2)?.[key];

  const withData = values.length;

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {geo && (
        <MapView
          geo={geo}
          thresholds={thresholds}
          active={active}
          selected={selected}
          valueOf={valueOf}
          onSelect={setSelected}
        />
      )}
      <ControlPanel
        active={active}
        onActive={setActive}
        communes={data?.length ?? 0}
        withData={withData}
      />
      <ColorLegend thresholds={thresholds} def={def} />
      <footer
        style={{
          position: "absolute",
          right: 10,
          bottom: 8,
          zIndex: 1000,
          fontSize: 11,
          color: "#475569",
          background: "rgba(255,255,255,0.85)",
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        Sources : STATEC (densité 2017), data.public.lu (prix annoncés 2025-26), OpenStreetMap
      </footer>
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 1001,
            background: "rgba(15,23,42,0.92)",
            color: "#f1f5f9",
            borderRadius: 10,
            padding: "10px 14px",
            minWidth: 220,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {byLau2.get(selected)?.commune}
            <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6, fontSize: 12 }}>
              {byLau2.get(selected)?.canton}
            </span>
          </div>
          {INDICATOR_ROWS.map(([key, label, unit]) => {
            const v = valueOfKey(selected, key);
            return (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: 13, lineHeight: 1.7 }}>
                <span style={{ color: "#cbd5e1" }}>{label}</span>
                <b>{v === undefined ? "—" : `${v.toLocaleString("fr-FR")} ${unit}`}</b>
              </div>
            );
          })}
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
            Cliquez sur une autre commune pour comparer
          </div>
        </div>
      )}
    </div>
  );
}

const INDICATOR_ROWS: [IndicatorKey, string, string][] = [
  ["density", "Densité", "hab/km²"],
  ["prix_appart", "Appartement", "€/m²"],
  ["prix_maison", "Maison", "€/m²"],
];
