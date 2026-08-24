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
}

export type IndicatorKey =
  | "density"
  | "chomage"
  | "o3_days"
  | "age_median"
  | "etrangers"
  | "loyer_appart"
  | "prix_appart"
  | "prix_maison";

export type ViewMode = "simple" | "dual" | "ratio";

export interface IndicatorDef {
  key: IndicatorKey;
  label: string;
  unit: string;
  year: string;
  source: string;
  decimals?: number;
}
