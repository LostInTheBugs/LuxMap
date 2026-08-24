import { LANGS, useLang, type Lang } from "../i18n";

interface Props {
  onClose: () => void;
}

/** Avertissement POC affiché à l'arrivée sur le site (une fois par navigateur),
 *  avec sélection de la langue d'interface. */
export default function DisclaimerModal({ onClose }: Props) {
  const { t, lang, setLang } = useLang();
  const html = (key: string) => ({ __html: t(key) });
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>
            {t("disclaimer.title")}
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label={t("disclaimer.lang")}
            title={t("disclaimer.lang")}
            style={{
              padding: "5px 8px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
              fontSize: 12.5,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.7, margin: "12px 0" }}>
          <span dangerouslySetInnerHTML={html("disclaimer.intro")} />
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
          <span dangerouslySetInnerHTML={html("disclaimer.warnTitle")} />
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>{t("disclaimer.warn1")}</li>
            <li>{t("disclaimer.warn2")}</li>
            <li>
              <span dangerouslySetInnerHTML={html("disclaimer.warn3")} />
            </li>
          </ul>
        </div>
        <p style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6, margin: "12px 0 16px" }}>
          {t("disclaimer.sourcesNote")}
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
          {t("disclaimer.cta")}
        </button>
      </div>
    </div>
  );
}
