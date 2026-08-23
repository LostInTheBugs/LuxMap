export interface CommuneData {
  lau2: string;
  commune: string;
  canton: string;
  density?: number;
  prix_appart?: number;
  prix_maison?: number;
}

export type IndicatorKey = "density" | "prix_appart" | "prix_maison";

export interface IndicatorDef {
  key: IndicatorKey;
  label: string;
  unit: string;
  year: string;
  source: string;
}
