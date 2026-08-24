import type { IndicatorKey } from "../types";

interface SourceEntry {
  key: IndicatorKey | "base";
  label: string;
  org: string;
  period: string;
  note: string;
  url: string;
}

const SOURCES: SourceEntry[] = [
  {
    key: "base",
    label: "Limites administratives (fond de carte)",
    org: "data.public.lu — cadastre.lu",
    period: "2024",
    note: "Découpage des 100 communes (LAU2). Simplifié (mapshaper, 59 Ko).",
    url: "https://data.public.lu/fr/datasets/limites-administratives-du-grand-duche-de-luxembourg/",
  },
  {
    key: "density",
    label: "Densité de population",
    org: "data.public.lu — STATEC",
    period: "2017",
    note: "Habitants par km² (recensement 2011 → 2017).",
    url: "https://data.public.lu/fr/datasets/densite-de-la-population-par-canton-et-commune-habitants-par-km2-1821-2017",
  },
  {
    key: "chomage",
    label: "Taux de chômage",
    org: "STATEC LUSTAT (DF_X026)",
    period: "2023–2025",
    note: "Emploi et chômage par canton et commune. Série temporelle disponible en mode Lecture.",
    url: "https://lustat.statec.lu/rest/data/LU1,DF_X026,1.1/all?startPeriod=2023&endPeriod=2025",
  },
  {
    key: "population",
    label: "Population",
    org: "STATEC LUSTAT (DF_X021)",
    period: "1821–2026",
    note: "Population par canton et commune au 1er janvier. Recensements espacés jusqu'en 1978, puis annuel. Série temporelle en mode Lecture.",
    url: "https://lustat.statec.lu/rest/data/LU1,DF_X021,1.1/all?format=jsondata",
  },
  {
    key: "accidents",
    label: "Accidents de la route (par canton)",
    org: "STATEC LUSTAT (DF_X040)",
    period: "2015–2025",
    note: "Accidents corporels de circulation routière, tous gravités, par canton. La valeur du canton est reportée sur ses communes. Série temporelle en mode Lecture.",
    url: "https://lustat.statec.lu/rest/data/LU1,DSD_ACCIDENT@DF_X040,1.0/all?format=jsondata",
  },
  {
    key: "o3_days",
    label: "Jours O₃ > 120 µg/m³",
    org: "data.public.lu — AEV",
    period: "2021–2023",
    note: "53 stations (Grande Région), interpolation IDW vers les centroïdes des communes.",
    url: "https://data.public.lu/fr/datasets/ozone-o3-days-with-maximum-8h-mean-values-above-120-ug-m3",
  },
  {
    key: "prix_appart",
    label: "Prix annoncés — appartements",
    org: "data.public.lu — Observatoire de l'habitat",
    period: "2010–2025",
    note: "€/m², prix moyens annoncés (vente). « * » = moins de 30 annonces → non publié. Série temporelle en mode Lecture.",
    url: "https://data.public.lu/fr/datasets/prix-annonces-des-logements-par-commune",
  },
  {
    key: "prix_maison",
    label: "Prix annoncés — maisons",
    org: "data.public.lu — Observatoire de l'habitat",
    period: "2010–2025",
    note: "€/m², prix moyens annoncés (vente). Série temporelle en mode Lecture.",
    url: "https://data.public.lu/fr/datasets/prix-annonces-des-logements-par-commune",
  },
  {
    key: "loyer_appart",
    label: "Loyers annoncés — appartements",
    org: "data.public.lu — Observatoire de l'habitat",
    period: "2009–2025",
    note: "€/m²/mois, loyers moyens annoncés (location). Série temporelle en mode Lecture.",
    url: "https://data.public.lu/fr/datasets/loyers-annonces-des-logements-par-commune",
  },
  {
    key: "age_median",
    label: "Âge médian de la population",
    org: "data.public.lu — RNPP",
    period: "01/07/2026",
    note: "Pyramide d'âge par commune (tranches de 5 ans), médiane interpolée.",
    url: "https://data.public.lu/fr/datasets/registre-national-des-personnes-physiques-rnpp-pyramide-dage-par-commune-population-age-pyramid-per-municipality",
  },
  {
    key: "etrangers",
    label: "Résidents de nationalité étrangère",
    org: "data.public.lu — RNPP",
    period: "30/09/2021",
    note: "Série complète des ressortissants par nationalité et commune (dernière date publiée).",
    url: "https://data.public.lu/fr/datasets/ressortissants-par-nationalite-par-commune-serie-complete",
  },
];

interface Props {
  onClose: () => void;
}

export default function InfoModal({ onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(2,6,23,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: 20,
          maxWidth: 640,
          maxHeight: "85vh",
          overflowY: "auto",
          fontFamily: "system-ui, sans-serif",
          color: "#e2e8f0",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: "#f8fafc" }}>ℹ️ Sources des données</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              border: "none",
              background: "#1e293b",
              color: "#94a3b8",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 0 }}>
          Chaque indicateur de la carte provient d'un jeu de données public. Cliquez sur un lien pour
          consulter la source originale.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SOURCES.map((s) => (
            <div
              key={s.key}
              style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
                {s.org} · {s.period}
              </div>
              <div style={{ fontSize: 11.5, color: "#cbd5e1", marginTop: 4 }}>{s.note}</div>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: "#38bdf8", display: "inline-block", marginTop: 6 }}
              >
                🔗 {s.url.replace("https://", "").split("/")[0] + "/" + (s.url.split("/fr/datasets/")[1]?.slice(0, 40) ?? "") + "…"}
              </a>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: "#64748b", marginTop: 14, lineHeight: 1.5 }}>
          Fond de carte : © OpenStreetMap. Les données sont présentées à titre informatif ; les prix
          annoncés ne reflètent pas les transactions effectives. Version 2026.08.008 — MIT — LostInTheBugs.
        </p>
      </div>
    </div>
  );
}
