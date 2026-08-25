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
    key: "population",
    label: "Population",
    unit: "hab.",
    year: "2026",
    source: "STATEC",
    decimals: 0,
    additive: true,
  },
  {
    key: "solde_naturel",
    label: "Excédent naturel",
    unit: "pers.",
    year: "2025",
    source: "STATEC",
    decimals: 0,
    additive: true,
  },
  {
    key: "solde_migratoire",
    label: "Solde migratoire",
    unit: "pers.",
    year: "2025",
    source: "STATEC",
    decimals: 0,
    additive: true,
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
    key: "accidents",
    label: "Accidents de la route (par canton)",
    unit: "accidents",
    year: "2025",
    source: "STATEC",
    decimals: 0,
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
    key: "age_median",
    label: "Âge médian de la population",
    unit: "ans",
    year: "2026",
    source: "RNPP",
    decimals: 1,
  },
  {
    key: "etrangers",
    label: "Résidents de nationalité étrangère",
    unit: "%",
    year: "2021",
    source: "RNPP",
    decimals: 1,
  },
  {
    key: "loyer_appart",
    label: "Loyers annoncés — appartements",
    unit: "€/m²/mois",
    year: "2025-26",
    source: "data.public.lu",
    decimals: 2,
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
  if (values.length === 0) return [];
  // d3 quantiles work from 1 value up (with fewer values than colors, some
  // boundaries repeat — colors then cover contiguous bands; with exactly 1
  // value every feature gets the first color). Keeping a min-count guard
  // here broke the 4-value circonscription groups (all grey, empty legend).
  const q = scaleQuantile<string>().domain(values).range(PALETTE);
  return q.quantiles();
}

export function colorFor(value: number | undefined, thresholds: number[]): string {
  if (value === undefined || thresholds.length === 0) return NO_DATA_COLOR;
  let i = 0;
  while (i < thresholds.length && value > thresholds[i]) i++;
  return PALETTE[Math.min(i, PALETTE.length - 1)];
}

export function fmt(v: number | undefined, unit: string, decimals = 0, locale = "fr-FR"): string {
  if (v === undefined) return "—";
  return v.toLocaleString(locale, { maximumFractionDigits: decimals }) + (unit ? " " + unit : "");
}
