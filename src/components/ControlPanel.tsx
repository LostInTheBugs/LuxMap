import type { AggMode, AggStat, IndicatorKey, ViewMode } from "../types";
import { INDICATORS } from "../utils/scale";

const APP_VERSION = "2026.08.018";

interface Props {
  mode: ViewMode;
  onMode: (m: ViewMode) => void;
  active: IndicatorKey;
  onActive: (k: IndicatorKey) => void;
  activeB: IndicatorKey;
  onActiveB: (k: IndicatorKey) => void;
  withData: number;
  onExport: () => void;
  exporting: boolean;
  onInfo: () => void;
  yearsA: string[];
  yearA: string | null;
  onYearA: (y: string) => void;
  yearsB: string[];
  yearB: string | null;
  onYearB: (y: string) => void;
  playing: boolean;
  onPlay: () => void;
  syncYears: boolean;
  onSyncYears: (v: boolean) => void;
  commonYears: string[];
  aggMode: AggMode;
  onAggMode: (m: AggMode) => void;
  aggStat: AggStat;
  onAggStat: (s: AggStat) => void;
  unitLabel: string;
  unitCount: number;
}

const MODES: { value: ViewMode; label: string; title: string }[] = [
  { value: "simple", label: "Simple", title: "Une seule carte" },
  { value: "dual", label: "Comparer", title: "Deux cartes synchronisées" },
  { value: "ratio", label: "Ratio", title: "Rapport entre deux indicateurs" },
];

const btn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "6px 4px",
  borderRadius: 7,
  border: "none",
  fontSize: 12.5,
  fontWeight: 700,
  background: active ? "#0ea5e9" : "#1e293b",
  color: active ? "#082f49" : "#94a3b8",
  cursor: "pointer",
});

const selStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  fontSize: 12.5,
  color: "#e2e8f0",
};

export default function ControlPanel({
  mode,
  onMode,
  active,
  onActive,
  activeB,
  onActiveB,
  withData,
  onExport,
  exporting,
  onInfo,
  yearsA,
  yearA,
  onYearA,
  yearsB,
  yearB,
  onYearB,
  playing,
  onPlay,
  syncYears,
  onSyncYears,
  commonYears,
  aggMode,
  onAggMode,
  aggStat,
  onAggStat,
  unitLabel,
  unitCount,
}: Props) {
  const multi = mode === "dual" || mode === "ratio";
  const synced = mode === "dual" && syncYears && commonYears.length > 0;
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 2000,
        width: 252,
        background: "rgba(15,23,42,0.92)",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: "14px 14px 12px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        fontFamily: "system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
        🇱🇺 LuxMap
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>
        Données ouvertes du Luxembourg
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            title={m.title}
            onClick={() => onMode(m.value)}
            style={btn(mode === m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode !== "ratio" && ((synced && commonYears.length > 0) || yearsA.length > 0) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            background: "#1e293b",
            borderRadius: 8,
            padding: "6px 8px",
          }}
        >
          <button
            onClick={onPlay}
            aria-label={playing ? "Pause" : "Lecture"}
            title={playing ? "Pause" : "Lecture automatique"}
            style={{
              border: "none",
              borderRadius: 6,
              width: 30,
              height: 26,
              fontSize: 13,
              cursor: "pointer",
              background: playing ? "#f59e0b" : "#0ea5e9",
              color: "#082f49",
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <input
            type="range"
            min={synced ? commonYears[0] : yearsA[0]}
            max={synced ? commonYears[commonYears.length - 1] : yearsA[yearsA.length - 1]}
            step={1}
            value={yearA ?? (synced ? commonYears[commonYears.length - 1] : yearsA[yearsA.length - 1])}
            onChange={(e) => onYearA(e.target.value)}
            aria-label="Année"
            style={{ flex: 1, accentColor: "#0ea5e9" }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#f8fafc", minWidth: 30, textAlign: "right" }}>
            {yearA}
          </span>
        </div>
      )}

      {mode === "dual" && yearsA.length > 0 && yearsB.length > 0 && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            fontSize: 11.5,
            color: "#cbd5e1",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={syncYears}
            onChange={(e) => onSyncYears(e.target.checked)}
            style={{ accentColor: "#0ea5e9", cursor: "pointer", width: 14, height: 14 }}
          />
          🔗 Synchroniser les années
          <span title="Ne lit que les années où les deux jeux de données existent" style={{ color: "#64748b" }}>
            (?)
          </span>
        </label>
      )}

      {mode === "dual" && !synced && yearsB.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
            background: "#1e293b",
            borderRadius: 8,
            padding: "4px 8px",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b" }}>B</span>
          <input
            type="range"
            min={yearsB[0]}
            max={yearsB[yearsB.length - 1]}
            step={1}
            value={yearB ?? yearsB[yearsB.length - 1]}
            onChange={(e) => onYearB(e.target.value)}
            aria-label="Année B"
            style={{ flex: 1, accentColor: "#0ea5e9" }}
          />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc", minWidth: 30, textAlign: "right" }}>
            {yearB}
          </span>
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "#64748b", margin: "10px 0 4px" }}>
        {multi ? "INDICATEUR A" : "INDICATEUR"}
      </div>
      <select
        value={active}
        onChange={(e) => onActive(e.target.value as IndicatorKey)}
        style={{
          width: "100%",
          padding: "6px 8px",
          borderRadius: 8,
          border: "1px solid #334155",
          background: "#1e293b",
          color: "#e2e8f0",
          fontSize: 12.5,
        }}
      >
        {INDICATORS.map((i) => (
          <option key={i.key} value={i.key}>
            {i.label} ({i.year})
          </option>
        ))}
      </select>

      {multi && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "#64748b", margin: "8px 0 4px" }}>
            INDICATEUR B
          </div>
          <select
            value={activeB}
            onChange={(e) => onActiveB(e.target.value as IndicatorKey)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
              fontSize: 12.5,
            }}
          >
            {INDICATORS.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label} ({i.year})
              </option>
            ))}
          </select>
        </>
      )}

      {mode !== "ratio" && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            fontSize: 11.5,
            color: "#cbd5e1",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={aggMode !== "none"}
            onChange={(e) => onAggMode(e.target.checked ? "canton" : "none")}
            style={{ accentColor: "#0ea5e9", cursor: "pointer", width: 14, height: 14 }}
          />
          🗂 Regrouper par cantons / circonscriptions
        </label>
      )}

      {aggMode !== "none" && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <select
            value={aggMode}
            onChange={(e) => onAggMode(e.target.value as AggMode)}
            aria-label="Découpage"
            style={selStyle}
          >
            <option value="canton">Cantons</option>
            <option value="circonscription">Circonscriptions</option>
          </select>
          <select
            value={aggStat}
            onChange={(e) => onAggStat(e.target.value as AggStat)}
            aria-label="Statistique"
            style={selStyle}
          >
            <option value="median">Médiane</option>
            <option value="mean">Moyenne</option>
          </select>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#94a3b8",
          marginTop: 10,
        }}
      >
        <span>
          {unitCount} {unitLabel} · {withData} avec données
        </span>
        <span style={{ color: "#475569" }}>v{APP_VERSION}</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button
          onClick={onInfo}
          aria-label="Sources des données"
          title="Voir les sources des données"
          style={{
            flex: 1,
            padding: "7px 8px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: "#1e293b",
            color: "#e2e8f0",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ℹ️ Sources
        </button>
        <button
          onClick={onExport}
          disabled={exporting}
          aria-label="Exporter en PNG"
          title="Exporter la carte en PNG"
          style={{
            flex: 1,
            padding: "7px 8px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: exporting ? "#1e293b" : "#0ea5e9",
            color: exporting ? "#64748b" : "#082f49",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: exporting ? "wait" : "pointer",
          }}
        >
          {exporting ? "⏳…" : "📷 PNG"}
        </button>
      </div>
    </div>
  );
}
