import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import MapPanel from "./components/MapPanel";
import ControlPanel from "./components/ControlPanel";
import ColorLegend from "./components/ColorLegend";
import InfoModal from "./components/InfoModal";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { CIRCONSCRIPTIONS, type AggMode, type AggStat, type CommuneData, type IndicatorDef, type IndicatorKey, type SeriesData, type ViewMode } from "./types";
import { computeThresholds, defOf } from "./utils/scale";

interface GeoData {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      LAU2?: string;
      COMMUNE?: string;
      CANTON?: string;
      CIRCONSCRIPTION?: string;
    };
    geometry: unknown;
  }>;
}

export interface SyncState {
  from: string;
  center: L.LatLng;
  zoom: number;
}

/** Median of a sorted numeric array. */
function median(sorted: number[]): number {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

export default function App() {
  const [data, setData] = useState<CommuneData[]>([]);
  const [seriesData, setSeriesData] = useState<SeriesData>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/indicators.json").then((r) => r.json()),
      fetch("/series.json").then((r) => r.json()),
    ]).then(([indicators, series]) => {
      if (cancelled) return;
      setData(indicators as CommuneData[]);
      setSeriesData(series as SeriesData);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [geoStamp, setGeoStamp] = useState(0);
  const [geoFor, setGeoFor] = useState<AggMode>("none");
  const applyGeo = useCallback((g: GeoData, mode: AggMode) => {
    setGeoFor(mode);
    setGeo(g);
    setGeoStamp((s) => s + 1);
  }, []);
  const [mode, setMode] = useState<ViewMode>("simple");
  const [active, setActive] = useState<IndicatorKey>("density");
  const [activeB, setActiveB] = useState<IndicatorKey>("prix_maison");
  const [selected, setSelected] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncState | null>(null);
  const [exporting, setExporting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [aggMode, setAggMode] = useState<AggMode>("none");
  const [aggStat, setAggStat] = useState<AggStat>("median");
  const captureRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    let cancelled = false;
    const mode = aggMode;
    const url =
      aggMode === "canton"
        ? "/cantons.geojson"
        : aggMode === "circonscription"
          ? "/circonscriptions.geojson"
          : "/communes.geojson";
    fetch(url)
      .then((r) => r.json())
      .then((g) => {
        if (!cancelled) applyGeo(g as GeoData, mode);
      });
    return () => {
      cancelled = true;
    };
  }, [aggMode, applyGeo]);

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

  // --- yearly series: per-year values when a year is selected (any mode) ---
  const yearsA = useMemo(
    () => Object.keys(seriesData[active] ?? {}).sort(),
    [active, seriesData],
  );
  const [yearA, setYearA] = useState<string | null>(null);
  const currentYearA = useMemo(() => {
    if (yearsA.length === 0) return null;
    if (yearA && yearsA.includes(yearA)) return yearA;
    return yearsA[yearsA.length - 1];
  }, [yearsA, yearA]);

  const yearsB = useMemo(
    () => Object.keys(seriesData[activeB] ?? {}).sort(),
    [activeB, seriesData],
  );
  const [yearB, setYearB] = useState<string | null>(null);
  const [syncYears, setSyncYears] = useState(false);
  const currentYearB = useMemo(() => {
    if (yearsB.length === 0) return null;
    if (yearB && yearsB.includes(yearB)) return yearB;
    return yearsB[yearsB.length - 1];
  }, [yearsB, yearB]);

  // in dual mode with synced years: only the years where BOTH series exist
  const commonYears = useMemo(
    () => yearsA.filter((y) => yearsB.includes(y)),
    [yearsA, yearsB],
  );

  // keep both maps on the same (common) year while synced
  useEffect(() => {
    if (!syncYears || mode !== "dual" || commonYears.length === 0) return;
    const y = yearA && commonYears.includes(yearA) ? yearA : commonYears[commonYears.length - 1];
    const id = requestAnimationFrame(() => {
      if (yearA !== y) setYearA(y);
      if (yearB !== y) setYearB(y);
    });
    return () => cancelAnimationFrame(id);
  }, [syncYears, mode, commonYears, yearA, yearB]);

  const handleYearA = useCallback(
    (v: string) => {
      setYearA(v);
      if (syncYears && mode === "dual") setYearB(v);
    },
    [syncYears, mode],
  );

  const yearlyValuesA = useMemo(() => {
    if (!currentYearA) return [];
    return Object.values(seriesData[active][currentYearA]).sort((a, b) => a - b);
  }, [active, currentYearA, seriesData]);

  const yearlyThresholdsA = useMemo(() => computeThresholds(yearlyValuesA), [yearlyValuesA]);

  const yearlyValueOfA = useCallback(
    (lau2: string): number | undefined =>
      currentYearA ? seriesData[active]?.[currentYearA]?.[lau2] : undefined,
    [active, currentYearA, seriesData],
  );

  const yearlyValuesB = useMemo(() => {
    if (!currentYearB) return [];
    return Object.values(seriesData[activeB][currentYearB]).sort((a, b) => a - b);
  }, [activeB, currentYearB, seriesData]);

  const yearlyThresholdsB = useMemo(() => computeThresholds(yearlyValuesB), [yearlyValuesB]);

  const yearlyValueOfB = useCallback(
    (lau2: string): number | undefined =>
      currentYearB ? seriesData[activeB]?.[currentYearB]?.[lau2] : undefined,
    [activeB, currentYearB, seriesData],
  );

  // auto-advance the year while playing (loops back to the first year)
  useEffect(() => {
    if (!playing || yearsA.length === 0) return;
    const years = syncYears && mode === "dual" && commonYears.length > 0 ? commonYears : yearsA;
    const id = setInterval(() => {
      setYearA((prev) => {
        const cur = prev && years.includes(prev) ? prev : years[years.length - 1];
        const idx = years.indexOf(cur);
        const next = years[(idx + 1) % years.length];
        if (syncYears && mode === "dual") setYearB(next);
        return next;
      });
    }, 500);
    return () => clearInterval(id);
  }, [playing, yearsA, syncYears, mode, commonYears]);

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

  // Mobile: Simple mode only (Comparer/Ratio/PNG are desktop features)
  useEffect(() => {
    if (isMobile && mode !== "simple") {
      const id = requestAnimationFrame(() => {
        setMode("simple");
        setSync(null);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isMobile, mode]);

  // Changing layout mode: drop stale sync state so the re-fit is deterministic
  // (a leftover sync from a previous zoom would otherwise override the fresh fit).
  const changeMode = useCallback((m: ViewMode) => {
    setMode(m);
    setSync(null);
  }, []);

  const exportPng = useCallback(async () => {
    const el = captureRef.current;
    if (!el || exporting) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
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

  // --- canton / circonscription aggregation (mean/median over communes WITH data) ---
  const groupKeyOf = useCallback(
    (row: CommuneData): string =>
      aggMode === "canton" ? row.canton : CIRCONSCRIPTIONS[row.canton] ?? row.canton,
    [aggMode],
  );
  const aggDefs = useCallback(
    (valueOf: (lau2: string) => number | undefined): Record<string, number> => {
      const groups = new Map<string, number[]>();
      for (const row of data) {
        const v = valueOf(row.lau2);
        if (v === undefined) continue;
        const g = groupKeyOf(row);
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(v);
      }
      const out: Record<string, number> = {};
      for (const [g, vs] of groups) {
        vs.sort((a, b) => a - b);
        out[g] = aggStat === "median" ? median(vs) : vs.reduce((a, b) => a + b, 0) / vs.length;
      }
      return out;
    },
    [data, groupKeyOf, aggStat],
  );

  const baseValueOfA = currentYearA ? yearlyValueOfA : valueOfA;
  const baseValueOfB = currentYearB ? yearlyValueOfB : valueOfB;
  const aggregatesA = useMemo(
    () => (aggMode !== "none" ? aggDefs(baseValueOfA) : null),
    [aggMode, aggDefs, baseValueOfA],
  );
  const aggregatesB = useMemo(
    () => (aggMode !== "none" ? aggDefs(baseValueOfB) : null),
    [aggMode, aggDefs, baseValueOfB],
  );

  // --- year-over-year % evolution per group (selected year vs previous year) ---
  const evoA = useMemo<{ map: Record<string, number>; prevYear: string } | null>(() => {
    if (aggMode === "none" || yearsA.length < 2) return null;
    const curYear = currentYearA ?? yearsA[yearsA.length - 1];
    const idx = yearsA.indexOf(curYear);
    if (idx <= 0) return null; // first year of the series: nothing to compare
    const prevYear = yearsA[idx - 1];
    const cur = aggDefs((lau2) => seriesData[active]?.[curYear]?.[lau2]);
    const prev = aggDefs((lau2) => seriesData[active]?.[prevYear]?.[lau2]);
    const map: Record<string, number> = {};
    for (const [g, v] of Object.entries(cur)) {
      const p = prev[g];
      if (p === undefined || p === 0) continue;
      map[g] = ((v - p) / p) * 100;
    }
    return { map, prevYear };
  }, [aggMode, yearsA, currentYearA, aggDefs, active, seriesData]);
  const evoB = useMemo<{ map: Record<string, number>; prevYear: string } | null>(() => {
    if (aggMode === "none" || yearsB.length < 2) return null;
    const curYear = currentYearB ?? yearsB[yearsB.length - 1];
    const idx = yearsB.indexOf(curYear);
    if (idx <= 0) return null;
    const prevYear = yearsB[idx - 1];
    const cur = aggDefs((lau2) => seriesData[activeB]?.[curYear]?.[lau2]);
    const prev = aggDefs((lau2) => seriesData[activeB]?.[prevYear]?.[lau2]);
    const map: Record<string, number> = {};
    for (const [g, v] of Object.entries(cur)) {
      const p = prev[g];
      if (p === undefined || p === 0) continue;
      map[g] = ((v - p) / p) * 100;
    }
    return { map, prevYear };
  }, [aggMode, yearsB, currentYearB, aggDefs, activeB, seriesData]);

  // geometry key/name fields + aggregate-aware valueOf for the maps
  const keyField = aggMode === "canton" ? "CANTON" : aggMode === "circonscription" ? "CIRCONSCRIPTION" : "LAU2";
  const nameField = aggMode === "canton" ? "CANTON" : aggMode === "circonscription" ? "CIRCONSCRIPTION" : "COMMUNE";

  const refitKey = mode === "dual" ? 2 : 1;

  const mapADef =
    mode === "ratio" && ratioDef
      ? ratioDef
      : currentYearA
        ? { ...def, year: currentYearA }
        : def;
  const mapAThresholds = mode === "ratio"
    ? ratioThresholds
    : aggMode !== "none" && aggregatesA
      ? computeThresholds(Object.values(aggregatesA))
      : currentYearA
        ? yearlyThresholdsA
        : thresholds;
  const mapAValueOf =
    mode === "ratio"
      ? ratioValueOf
      : aggMode !== "none" && aggregatesA
        ? (key: string) => aggregatesA[key]
        : currentYearA
          ? yearlyValueOfA
          : valueOfA;
  const legendA = mapADef;
  const mapBDef = currentYearB ? { ...defB, year: currentYearB } : defB;
  const mapBThresholds =
    aggMode !== "none" && aggregatesB
      ? computeThresholds(Object.values(aggregatesB))
      : currentYearB
        ? yearlyThresholdsB
        : thresholdsB;
  const mapBValueOf =
    aggMode !== "none" && aggregatesB
      ? (key: string) => aggregatesB[key]
      : currentYearB
        ? yearlyValueOfB
        : valueOfB;

  const withData =
    mode === "ratio"
      ? ratioValues.length
      : aggMode !== "none"
        ? aggregatesA
          ? Object.keys(aggregatesA).length
          : 0
        : currentYearA
          ? yearlyValuesA.length
          : valuesOf(active).length;
  const unitLabel = aggMode === "canton" ? "cantons" : aggMode === "circonscription" ? "circonscriptions" : "communes";
  const unitCount = aggMode === "none" ? data.length : new Set(data.map(groupKeyOf)).size;

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
              keyField={keyField}
              nameField={nameField}
              geoStamp={geoStamp}
              evo={aggMode !== "none" && geoFor === aggMode ? evoA : null}
            />
          )}
          <ColorLegend side={mode === "dual" ? "A" : undefined} thresholds={mapAThresholds} def={legendA} bottom={isMobile ? 92 : 34} />
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
                def={mapBDef}
                thresholds={mapBThresholds}
                selected={selected}
                valueOf={mapBValueOf}
                onSelect={setSelected}
                syncEnabled={mode === "dual"}
                sync={sync}
                onSync={onSync}
                refitKey={refitKey}
                keyField={keyField}
                nameField={nameField}
                geoStamp={geoStamp}
                evo={aggMode !== "none" && geoFor === aggMode ? evoB : null}
              />
            )}
            <ColorLegend side="B" thresholds={mapBThresholds} def={mapBDef} bottom={isMobile ? 92 : 34} />
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
        withData={withData}
        onExport={exportPng}
        exporting={exporting}
        onInfo={() => setShowInfo(true)}
        yearsA={yearsA}
        yearA={currentYearA}
        onYearA={handleYearA}
        yearsB={yearsB}
        yearB={currentYearB}
        onYearB={setYearB}
        playing={playing}
        onPlay={() => setPlaying((p) => !p)}
        syncYears={syncYears}
        onSyncYears={setSyncYears}
        commonYears={commonYears}
        aggMode={aggMode}
        onAggMode={setAggMode}
        aggStat={aggStat}
        onAggStat={setAggStat}
        unitLabel={unitLabel}
        unitCount={unitCount}
        mobile={isMobile}
      />

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      {!isMobile && (
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
      )}

      {selected &&
        (aggMode !== "none" && aggregatesA ? (
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
              {selected}
              <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6, fontSize: 12 }}>
                {aggStat === "median" ? "médiane" : "moyenne"} · {aggMode === "canton" ? "canton" : "circonscription"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: "#cbd5e1" }}>{def.label}</span>
              <b>
                {aggregatesA[selected] === undefined
                  ? "—"
                  : `${aggregatesA[selected].toLocaleString("fr-FR", { maximumFractionDigits: def.decimals ?? 0 })} ${def.unit}`}
              </b>
            </div>
            {evoA && evoA.map[selected] !== undefined && (
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
                <span style={{ color: "#cbd5e1" }}>Évolution vs {evoA.prevYear}</span>
                <b style={{ color: evoA.map[selected] >= 0 ? "#4ade80" : "#f87171" }}>
                  {evoA.map[selected] >= 0 ? "▲ +" : "▼ "}
                  {evoA.map[selected].toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                </b>
              </div>
            )}
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
              Cliquez ailleurs pour quitter
            </div>
          </div>
        ) : (
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
        ))}
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
