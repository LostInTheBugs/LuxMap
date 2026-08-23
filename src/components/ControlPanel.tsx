import type { IndicatorKey } from "../types";
import { INDICATORS } from "../utils/scale";

interface Props {
  active: IndicatorKey;
  onActive: (k: IndicatorKey) => void;
  communes: number;
  withData: number;
}

export default function ControlPanel({ active, onActive, communes, withData }: Props) {
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

      <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#64748b", marginBottom: 4 }}>
        Indicateur
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

      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
        {communes} communes · {withData} avec données
      </div>
    </div>
  );
}
