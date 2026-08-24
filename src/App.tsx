import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import html2canvas from "html2canvas";
import MapPanel from "./components/MapPanel";
import ControlPanel from "./components/ControlPanel";
import ColorLegend from "./components/ColorLegend";
import { useMediaQuery } from "./hooks/useMediaQuery";
import type { CommuneData, IndicatorDef, IndicatorKey, ViewMode } from "./types";
import { computeThresholds, defOf } from "./utils/scale";
import indicatorsData from "./data/indicators.json";

interface GeoData {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { LAU2: string; COMMUNE: string; CANTON: string };
    geometry: unknown;
  }>;
}

export interface SyncState {
  from: string;
  center: L.LatLng;
  zoom: number;
}

export default function App() {
  const [data] = useState<CommuneData[]>(indicatorsData as CommuneData[]);
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [mode, setMode] = useState<ViewMode>("simple");
  const [active, setActive] = useState<IndicatorKey>("density");
  const [activeB, setActiveB] = useState<IndicatorKey>("prix_maison");
  const [selected, setSelected] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncState | null>(null);
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

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
    for (const row of data) m.set(row.lau2, row);
    return m;
  }, [data]);

  const def = defOf(active);
  const defB = defOf(activeB);

  const valuesOf = useCallback(
    (key: IndicatorKey) =>
      data
        .map((r) => r[key])
        .filter((v): v is number => v !== undefined)
        .sort((a, b) => a - b),
    [data],
  );
  const thresholds = useMemo(() => computeThresholds(valuesOf(active)), [valuesOf, active]);
  const thresholdsB = useMemo(() => computeThresholds(valuesOf(activeB)), [valuesOf, activeB]);

  const valueOfKey = useCallback(
    (lau2: string, key: IndicatorKey): number | undefined => byLau2.get(lau2)?.[key],
    [byLau2],
  );
  const valueOfA = useCallback(
    (lau2: string) => valueOfKey(lau2, active),
    [valueOfKey, active],
  );
  const valueOfB = useCallback(
    (lau2: string) => valueOfKey(lau2, activeB),
    [valueOfKey, activeB],
  );

  // --- ratio mode: single map colored by A / B ---
  const ratioDef: IndicatorDef | null = useMemo(() => {
    if (mode !== "ratio") return null;
    return {
      key: active,
      label: `Ratio ${def.label} / ${defB.label}`,
      unit: "",
      year: `${def.year} / ${defB.year}`,
      source: "calculé",
      decimals: 2,
    };
  }, [mode, def, defB, active]);

  const ratioValues = useMemo(() => {
    if (mode !== "ratio") return [];
    const out: number[] = [];
    for (const r of data) {
      const a = r[active];
      const b = r[activeB];
      if (a !== undefined && b !== undefined && b !== 0) out.push(a / b);
    }
    return out.sort((x, y) => x - y);
  }, [data, active, activeB, mode]);

  const ratioThresholds = useMemo(() => computeThresholds(ratioValues), [ratioValues]);

  const ratioValueOf = useCallback(
    (lau2: string): number | undefined => {
      const a = valueOfKey(lau2, active);
      const b = valueOfKey(lau2, activeB);
      return a !== undefined && b !== undefined && b !== 0 ? a / b : undefined;
    },
    [valueOfKey, active, activeB],
  );

  const onSync = useCallback((from: string, center: L.LatLng, zoom: number) => {
    setSync((prev) =>
      prev && prev.from === from && prev.zoom === zoom && prev.center.equals(center)
        ? prev
        : { from, center, zoom },
    );
  }, []);

  // Changing layout mode: drop stale sync state so the re-fit is deterministic
  // (a leftover sync from a previous zoom would otherwise override the fresh fit).
  const changeMode = useCallback((m: ViewMode) => {
    setMode(m);
    setSync(null);
  }, []);

  const withData =
    mode === "ratio" ? ratioValues.length : valuesOf(active).length;

  const exportPng = useCallback(async () => {
    const el = captureRef.current;
    if (!el || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const a = document.createElement("a");
      a.download = `luxmap-${new Date().toISOString().slice(0, 10)}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  // Re-fit both maps to the country bounds whenever the layout changes
  // (simple/ratio = full width, dual = half width). Without this, map A keeps
  // its full-width zoom when the split happens → the two maps are misaligned.
  const refitKey = mode === "dual" ? 2 : 1;

  const mapADef = mode === "ratio" && ratioDef ? ratioDef : def;
  const mapAThresholds = mode === "ratio" ? ratioThresholds : thresholds;
  const mapAValueOf = mode === "ratio" ? ratioValueOf : valueOfA;
  const legendA = mode === "ratio" && ratioDef ? ratioDef : def;

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <div
        ref={captureRef}
        className="lux-capture"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {geo && (
            <MapPanel
              geo={geo}
              side="A"
              active={active}
              def={mapADef}
              thresholds={mapAThresholds}
              selected={selected}
              valueOf={mapAValueOf}
              onSelect={setSelected}
              syncEnabled={mode === "dual"}
              sync={sync}
              onSync={onSync}
              refitKey={refitKey}
            />
          )}
          <ColorLegend side={mode === "dual" ? "A" : undefined} thresholds={mapAThresholds} def={legendA} />
        </div>
        {mode === "dual" && (
          <div
            style={{
              flex: 1,
              position: "relative",
              minHeight: 0,
              borderTop: isMobile ? "2px solid #0f172a" : undefined,
              borderLeft: isMobile ? undefined : "2px solid #0f172a",
            }}
          >
            {geo && (
              <MapPanel
                geo={geo}
                side="B"
                active={activeB}
                thresholds={thresholdsB}
                selected={selected}
                valueOf={valueOfB}
                onSelect={setSelected}
                syncEnabled={mode === "dual"}
                sync={sync}
                onSync={onSync}
                refitKey={refitKey}
              />
            )}
            <ColorLegend side="B" thresholds={thresholdsB} def={defB} />
          </div>
        )}
      </div>

      <ControlPanel
        mode={mode}
        onMode={changeMode}
        active={active}
        onActive={setActive}
        activeB={activeB}
        onActiveB={setActiveB}
        communes={data.length}
        withData={withData}
        onExport={exportPng}
        exporting={exporting}
      />

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
        Sources : STATEC (densité 2017 · chômage 2025), AEV (O₃ 2021-23), data.public.lu (prix 2025-26), OpenStreetMap
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
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 14,
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <span style={{ color: "#cbd5e1" }}>{label}</span>
                <b>{v === undefined ? "—" : `${v.toLocaleString("fr-FR")} ${unit}`}</b>
              </div>
            );
          })}
          {mode === "ratio" && ratioDef && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                fontSize: 13,
                lineHeight: 1.7,
                borderTop: "1px solid #334155",
                marginTop: 4,
                paddingTop: 4,
              }}
            >
              <span style={{ color: "#7dd3fc" }}>Ratio A/B</span>
              <b>
                {ratioValueOf(selected) === undefined
                  ? "—"
                  : ratioValueOf(selected)!.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
              </b>
            </div>
          )}
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
  ["chomage", "Chômage", "%"],
  ["o3_days", "Jours O₃", "j"],
  ["age_median", "Âge médian", "ans"],
  ["etrangers", "Étrangers", "%"],
  ["loyer_appart", "Loyer appart.", "€/m²/mois"],
  ["prix_appart", "Appartement", "€/m²"],
  ["prix_maison", "Maison", "€/m²"],
];
