import type { AggStat, IndicatorKey } from "../types";

/** Median of a sorted numeric array. */
export function median(sorted: number[]): number {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/**
 * Agrège les valeurs d'un groupe de communes.
 * @param values valeurs des communes du groupe qui ont une donnée
 * @param additive true pour un effectif (somme), false pour une intensité
 * @param stat statistique appliquée aux intensités uniquement
 */
export function aggregate(values: number[], additive: boolean, stat: AggStat): number {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (additive) return sum;
  return stat === "median" ? median(sorted) : sum / sorted.length;
}

/** Short rows of the commune detail panel: [indicator, i18n row.* key, French unit]. */
export const INDICATOR_ROWS: [IndicatorKey, string, string][] = [
  ["density", "density", "hab/km²"],
  ["population", "population", "hab."],
  ["solde_naturel", "solde_naturel", "pers."],
  ["solde_migratoire", "solde_migratoire", "pers."],
  ["chomage", "chomage", "%"],
  ["accidents", "accidents", "accidents"],
  ["o3_days", "o3_days", "j"],
  ["age_median", "age_median", "ans"],
  ["etrangers", "etrangers", "%"],
  ["loyer_appart", "loyer_appart", "€/m²/mois"],
  ["prix_appart", "prix_appart", "€/m²"],
  ["prix_maison", "prix_maison", "€/m²"],
];
