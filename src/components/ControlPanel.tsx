import type { IndicatorKey, ViewMode } from "../types";
import { INDICATORS } from "../utils/scale";

const APP_VERSION = "2026.08.012";

interface Props {
  mode: ViewMode;
  onMode: (m: ViewMode) => void;
  active: IndicatorKey;
  onActive: (k: IndicatorKey) => void;
  activeB: IndicatorKey;
  onActiveB: (k: IndicatorKey) => void;
  communes: number;
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

export default function ControlPanel({
  mode,
  onMode,
  active,
  onActive,
  activeB,
  onActiveB,
  communes,
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
}: Props) {
  const multi = mode === "dual" || mode === "ratio";
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

      {mode !== "ratio" && yearsA.length > 0 && (
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
            min={yearsA[0]}
            max={yearsA[yearsA.length - 1]}
            step={1}
            value={yearA ?? yearsA[yearsA.length - 1]}
            onChange={(e) => onYearA(e.target.value)}
            aria-label="Année"
            style={{ flex: 1, accentColor: "#0ea5e9" }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#f8fafc", minWidth: 30, textAlign: "right" }}>
            {yearA}
          </span>
        </div>
      )}

      {mode === "dual" && yearsB.length > 0 && (
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
          {communes} communes · {withData} avec données
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
