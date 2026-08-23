import { scaleQuantile } from "d3-scale";
import type { IndicatorKey, IndicatorDef } from "../types";

export const PALETTE = [
  "#e0f2fe",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0284c7",
  "#0c4a6e",
];
export const NO_DATA_COLOR = "#e2e8f0";

export const INDICATORS: IndicatorDef[] = [
  {
    key: "density",
    label: "Densité de population",
    unit: "hab/km²",
    year: "2017",
    source: "STATEC",
    decimals: 0,
  },
  {
    key: "chomage",
    label: "Taux de chômage",
    unit: "%",
    year: "2025",
    source: "STATEC",
    decimals: 1,
  },
  {
    key: "o3_days",
    label: "Jours O₃ > 120 µg/m³",
    unit: "jours",
    year: "2021-23",
    source: "AEV",
    decimals: 1,
  },
  {
    key: "prix_appart",
    label: "Prix annoncés — appartements",
    unit: "€/m²",
    year: "2025-26",
    source: "data.public.lu",
    decimals: 0,
  },
  {
    key: "prix_maison",
    label: "Prix annoncés — maisons",
    unit: "€/m²",
    year: "2025-26",
    source: "data.public.lu",
    decimals: 0,
  },
];

export const defOf = (key: IndicatorKey): IndicatorDef =>
  INDICATORS.find((d) => d.key === key) ?? INDICATORS[0];

/** Quantile thresholds over sorted values (PALETTE.length - 1 boundaries). */
export function computeThresholds(values: number[]): number[] {
  if (values.length < PALETTE.length) return [];
  const q = scaleQuantile<string>().domain(values).range(PALETTE);
  return q.quantiles();
}

export function colorFor(value: number | undefined, thresholds: number[]): string {
  if (value === undefined || thresholds.length === 0) return NO_DATA_COLOR;
  let i = 0;
  while (i < thresholds.length && value > thresholds[i]) i++;
  return PALETTE[Math.min(i, PALETTE.length - 1)];
}

export function fmt(v: number | undefined, unit: string, decimals = 0): string {
  if (v === undefined) return "—";
  return v.toLocaleString("fr-FR", { maximumFractionDigits: decimals }) + (unit ? " " + unit : "");
}
