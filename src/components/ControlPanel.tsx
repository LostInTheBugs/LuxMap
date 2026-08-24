import type { IndicatorKey, ViewMode } from "../types";
import { INDICATORS } from "../utils/scale";

const APP_VERSION = "2026.08.006";

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
}

const MODES: { value: ViewMode; label: string; title: string }[] = [
  { value: "simple", label: "Simple", title: "Une carte, un indicateur" },
  { value: "dual", label: "Comparer", title: "Deux cartes côte à côte" },
  { value: "ratio", label: "Ratio", title: "Rapport A / B sur une carte" },
];

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
}: Props) {
  const multi = mode !== "simple";
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 1000,
        background: "rgba(15,23,42,0.92)",
        color: "#f1f5f9",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 250,
        maxWidth: "calc(100vw - 24px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.5 }}>
        🇱🇺 LuxMap
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
        Données ouvertes du Luxembourg
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            title={m.title}
            onClick={() => onMode(m.value)}
            style={{
              flex: 1,
              padding: "6px 4px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: mode === m.value ? "#0ea5e9" : "#1e293b",
              color: mode === m.value ? "#082f49" : "#cbd5e1",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <label
        style={{
          display: "block",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: "#64748b",
          marginBottom: 4,
        }}
      >
        Indicateur {multi ? "A" : ""}
        {mode === "ratio" ? " (numérateur)" : ""}
      </label>
      <select
        value={active}
        onChange={(e) => onActive(e.target.value as IndicatorKey)}
        style={{
          width: "100%",
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: "7px 8px",
          fontSize: 13,
        }}
      >
        {INDICATORS.map((d) => (
          <option key={d.key} value={d.key}>
            {d.label} ({d.year})
          </option>
        ))}
      </select>

      {multi && (
        <>
          <label
            style={{
              display: "block",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "#64748b",
              margin: "10px 0 4px",
            }}
          >
            Indicateur B
            {mode === "ratio" ? " (dénominateur)" : ""}
          </label>
          <select
            value={activeB}
            onChange={(e) => onActiveB(e.target.value as IndicatorKey)}
            style={{
              width: "100%",
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "7px 8px",
              fontSize: 13,
            }}
          >
            {INDICATORS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label} ({d.year})
              </option>
            ))}
          </select>
        </>
      )}

      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
        {communes} communes · {withData} avec données
        <span style={{ float: "right", color: "#475569" }}>v{APP_VERSION}</span>
      </div>

      <button
        onClick={onExport}
        disabled={exporting}
        aria-label="Exporter en PNG"
        title="Exporter la carte en PNG"
        style={{
          width: "100%",
          marginTop: 10,
          padding: "7px 8px",
          borderRadius: 8,
          border: "1px solid #334155",
          background: exporting ? "#1e293b" : "#0ea5e9",
          color: exporting ? "#64748b" : "#082f49",
          fontSize: 13,
          fontWeight: 700,
          cursor: exporting ? "wait" : "pointer",
        }}
      >
        {exporting ? "⏳ Export…" : "📷 Exporter en PNG"}
      </button>
    </div>
  );
}
