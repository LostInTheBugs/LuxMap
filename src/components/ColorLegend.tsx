import type { IndicatorDef } from "../types";
import { PALETTE, fmt } from "../utils/scale";
import { useLang } from "../i18n";

interface Props {
  thresholds: number[];
  def: IndicatorDef;
  side?: "A" | "B";
  /** Distance from the bottom of the map (desktop 34; raised on mobile so the
   *  collapsed control bar doesn't cover it). */
  bottom?: number;
}

export default function ColorLegend({ thresholds, def, side, bottom = 34 }: Props) {
  const { locale, indLabel, indUnit } = useLang();
  if (thresholds.length === 0) return null;
  const n = thresholds.length + 1;
  const colors = PALETTE.slice(0, n);
  const dec = def.decimals ?? 0;
  const min = fmt(thresholds[0], indUnit(def.unit), dec, locale);
  const max = fmt(thresholds[thresholds.length - 1], indUnit(def.unit), dec, locale);
  return (
    <div
      style={{
        position: "absolute",
        left: side === "B" ? undefined : 12,
        right: side === "B" ? 12 : undefined,
        bottom: bottom,
        zIndex: 1000,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
        {side ? `${side} · ` : ""}
        {indLabel(def.key)} · {def.year}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {colors.map((c, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 10,
              background: c,
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "#64748b",
          marginTop: 3,
          width: colors.length * 30 - 2,
        }}
      >
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
