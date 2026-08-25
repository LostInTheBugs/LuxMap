export interface CommuneData {
  lau2: string;
  commune: string;
  canton: string;
  density?: number;
  chomage?: number;
  o3_days?: number;
  age_median?: number;
  etrangers?: number;
  loyer_appart?: number;
  prix_appart?: number;
  prix_maison?: number;
  population?: number;
  accidents?: number;
  solde_naturel?: number;
  solde_migratoire?: number;
}

export type IndicatorKey =
  | "density"
  | "chomage"
  | "o3_days"
  | "age_median"
  | "etrangers"
  | "loyer_appart"
  | "prix_appart"
  | "prix_maison"
  | "population"
  | "accidents"
  | "solde_naturel"
  | "solde_migratoire";

export type ViewMode = "simple" | "dual" | "ratio";

/** Multi-year series: indicator key → year → lau2 → value. */
export type SeriesData = Record<string, Record<string, Record<string, number>>>;

/** Display unit for choropleth coloring: commune, canton or electoral district. */
export type AggMode = "none" | "canton" | "circonscription";
export type AggStat = "mean" | "median";

/** Official electoral circonscriptions (loi électorale 2002/2016). */
export const CIRCONSCRIPTIONS: Record<string, string> = {
  Luxembourg: "Centre",
  Capellen: "Centre",
  Mersch: "Centre",
  Grevenmacher: "Est",
  Echternach: "Est",
  Remich: "Est",
  Diekirch: "Nord",
  Clervaux: "Nord",
  Vianden: "Nord",
  Wiltz: "Nord",
  Redange: "Nord",
  "Esch-sur-Alzette": "Sud",
};

export interface IndicatorDef {
  key: IndicatorKey;
  label: string;
  unit: string;
  year: string;
  source: string;
  decimals?: number;
  /** true = effectif (population, soldes) : seule la somme a un sens en
   *  agrégation par canton. false/absent = intensité (taux, prix, âge, densité,
   *  et accidents dont la valeur cantonale est répliquée sur les communes). */
  additive?: boolean;
}
