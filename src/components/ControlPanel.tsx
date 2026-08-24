import { useState } from "react";
import type { AggMode, AggStat, IndicatorKey, ViewMode } from "../types";
import { INDICATORS } from "../utils/scale";
import { LANGS, useLang, type Lang } from "../i18n";

export const APP_VERSION = "2026.08.024";

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
  /** Mobile layout: bottom sheet, Simple mode only, no PNG export. */
  mobile: boolean;
}

const MODES: { value: ViewMode; labelKey: string; titleKey: string }[] = [
  { value: "simple", labelKey: "mode.simple", titleKey: "mode.simple.title" },
  { value: "dual", labelKey: "mode.dual", titleKey: "mode.dual.title" },
  { value: "ratio", labelKey: "mode.ratio", titleKey: "mode.ratio.title" },
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
  mobile,
}: Props) {
  const [open, setOpen] = useState(false);
  const { t, lang, setLang, indLabel } = useLang();
  const langSel = (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label={t("disclaimer.lang")}
      title={t("disclaimer.lang")}
      style={{
        padding: "4px 6px",
        borderRadius: 8,
        border: "1px solid #334155",
        background: "#1e293b",
        color: "#e2e8f0",
        fontSize: 11.5,
        cursor: "pointer",
      }}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.name}
        </option>
      ))}
    </select>
  );
  const multi = mode === "dual" || mode === "ratio";
  const synced = mode === "dual" && syncYears && commonYears.length > 0;
  if (mobile && !open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          background: "rgba(15,23,42,0.95)",
          borderTop: "1px solid #1e293b",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#f1f5f9",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          🇱🇺{" "}
          <span style={{ color: "#38bdf8" }}>
            {indLabel(active)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0, marginLeft: 10 }}>
          {t("panel.settings")} <span style={{ fontSize: 10 }}>▲</span>
        </div>
      </div>
    );
  }
  return (
    <div
      style={
        mobile
          ? {
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2000,
              maxHeight: "64vh",
              overflowY: "auto",
              background: "rgba(15,23,42,0.97)",
              borderTop: "1px solid #1e293b",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: "14px 16px 16px",
              boxShadow: "0 -6px 24px rgba(0,0,0,0.4)",
            }
          : {
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
            }
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
            🇱🇺 LuxMap
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{t("ui.subtitle")}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {langSel}
          {mobile && (
            <button
              onClick={() => setOpen(false)}
              aria-label={t("panel.close")}
              style={{
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                fontSize: 15,
                cursor: "pointer",
                background: "#1e293b",
                color: "#cbd5e1",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!mobile && (
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          {MODES.map((m) => (
            <button
              key={m.value}
              title={t(m.titleKey)}
              onClick={() => onMode(m.value)}
              style={btn(mode === m.value)}
            >
              {t(m.labelKey)}
            </button>
          ))}
        </div>
      )}

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
            aria-label={playing ? t("play.pause") : t("play.play")}
            title={playing ? t("play.pause") : t("play.auto")}
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
            aria-label={t("slider.year")}
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
          🔗 {t("sync.label")}
          <span title={t("sync.title")} style={{ color: "#64748b" }}>
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
            aria-label={t("slider.yearB")}
            style={{ flex: 1, accentColor: "#0ea5e9" }}
          />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc", minWidth: 30, textAlign: "right" }}>
            {yearB}
          </span>
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "#64748b", margin: "10px 0 4px" }}>
        {t(multi ? "indicator.A" : "indicator.label")}
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
            {indLabel(i.key)} ({i.year})
          </option>
        ))}
      </select>

      {multi && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "#64748b", margin: "8px 0 4px" }}>
            {t("indicator.B")}
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
                {indLabel(i.key)} ({i.year})
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
          🗂 {t("agg.label")}
        </label>
      )}

      {aggMode !== "none" && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <select
            value={aggMode}
            onChange={(e) => onAggMode(e.target.value as AggMode)}
            aria-label={t("agg.split")}
            style={selStyle}
          >
            <option value="canton">{t("agg.cantons")}</option>
            <option value="circonscription">{t("agg.circs")}</option>
          </select>
          <select
            value={aggStat}
            onChange={(e) => onAggStat(e.target.value as AggStat)}
            aria-label={t("agg.stat")}
            style={selStyle}
          >
            <option value="median">{t("agg.median")}</option>
            <option value="mean">{t("agg.mean")}</option>
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
          {t("count.units", { n: unitCount, units: unitLabel, m: withData })}
        </span>
        <span style={{ color: "#475569" }}>v{APP_VERSION}</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button
          onClick={onInfo}
          aria-label={t("info.aria")}
          title={t("info.title")}
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
          ℹ️ {t("info.btn")}
        </button>
        {!mobile && (
          <button
            onClick={onExport}
            disabled={exporting}
            aria-label={t("export.aria")}
            title={t("export.title")}
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
        )}
      </div>
    </div>
  );
}
