interface Props {
  onClose: () => void;
}

/** Avertissement POC affiché à l'arrivée sur le site (une fois par navigateur). */
export default function DisclaimerModal({ onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        background: "rgba(2,6,23,0.65)",
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
          padding: 22,
          maxWidth: 560,
          maxHeight: "85vh",
          overflowY: "auto",
          fontFamily: "system-ui, sans-serif",
          color: "#e2e8f0",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc", marginBottom: 10 }}>
          🚧 Projet de démonstration (POC)
        </div>
        <p style={{ fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.7, margin: "0 0 12px" }}>
          Bienvenue sur <b>LuxMap</b> — une maquette construite pour imaginer ce que les
          données ouvertes du Luxembourg permettent de visualiser.
        </p>
        <div
          style={{
            background: "#1e293b",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            color: "#e2e8f0",
            lineHeight: 1.7,
          }}
        >
          ⚠️ Ce site est un <b>prototype</b> :
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>il peut contenir des bugs ou des données mal interprétées ;</li>
            <li>
              les valeurs affichées sont souvent des estimations ou des agrégations
              (interpolations, médianes, regroupements) qui peuvent être inexactes ;
            </li>
            <li>
              il ne constitue <b>pas</b> une source officielle et ne doit pas servir à
              prendre des décisions.
            </li>
          </ul>
        </div>
        <p style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6, margin: "12px 0 16px" }}>
          Les sources et les limites de chaque indicateur sont détaillées dans la page
          «&nbsp;Sources&nbsp;» (bouton ℹ️ du panneau).
        </p>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "#0ea5e9",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Compris, c'est parti →
        </button>
      </div>
    </div>
  );
}
