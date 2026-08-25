import { describe, expect, it } from "vitest";
import { INDICATORS } from "./utils/scale";
import { LANGS, STRINGS_ALL, detectLang, indLabelFor, indUnitFor, localeOf, translate } from "./i18n";
import { CIRCONSCRIPTIONS } from "./types";
import { INDICATOR_ROWS, aggregate, median } from "./utils/logic";

const LANGS_ALL = LANGS.map((l) => l.code);

describe("i18n dictionaries", () => {
  it("all languages define exactly the same keys as French", () => {
    const frKeys = Object.keys(STRINGS_ALL.fr).sort();
    for (const lang of LANGS_ALL) {
      expect(Object.keys(STRINGS_ALL[lang]).sort(), lang).toEqual(frKeys);
    }
  });

  it("every indicator has a label in every language", () => {
    for (const d of INDICATORS) {
      for (const lang of LANGS_ALL) {
        expect(STRINGS_ALL[lang][`ind.${d.key}`], `${lang}:ind.${d.key}`).toBeDefined();
        const label = indLabelFor(lang, d.key);
        expect(label, `${lang}:ind.${d.key}`).not.toBe(`ind.${d.key}`);
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });

  it("every indicator unit has a translation in every language", () => {
    const units = new Set(INDICATORS.map((d) => d.unit));
    for (const unit of units) {
      for (const lang of LANGS_ALL) {
        expect(STRINGS_ALL[lang][`unit.${unit}`], `${lang}:unit.${unit}`).toBeDefined();
        const translated = indUnitFor(lang, unit);
        expect(translated, `${lang}:unit.${unit}`).not.toBe(`unit.${unit}`);
        expect(translated.length).toBeGreaterThan(0);
      }
    }
  });

  it("translates an unknown key to the key itself", () => {
    expect(translate("fr", "no.such.key")).toBe("no.such.key");
  });

  it("interpolates variables", () => {
    expect(translate("fr", "detail.evo", { year: 1821 })).toBe("Évolution vs 1821");
    expect(translate("en", "count.units", { n: 100, units: "communes", m: 99 })).toBe(
      "100 communes · 99 with data",
    );
  });

  it("detects the language from navigator when available (Node ≥21 exposes it)", () => {
    const detected = detectLang();
    expect(LANGS_ALL).toContain(detected);
    expect(typeof detected).toBe("string");
  });

  it("falls back to French when navigator is unavailable", () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    try {
      // @ts-expect-error — temporarily remove the global to exercise the fallback
      delete globalThis.navigator;
      expect(detectLang()).toBe("fr");
    } finally {
      if (desc) Object.defineProperty(globalThis, "navigator", desc);
    }
  });

  it("maps locales per language", () => {
    expect(localeOf("fr")).toBe("fr-FR");
    expect(localeOf("en")).toBe("en-GB");
    expect(localeOf("de")).toBe("de-DE");
    expect(localeOf("pt")).toBe("pt-PT");
    expect(localeOf("lb")).toBe("fr-LU");
  });
});

describe("detail panel rows", () => {
  it("covers every indicator", () => {
    const rowKeys = INDICATOR_ROWS.map(([key]) => key).sort();
    const indicatorKeys = INDICATORS.map((d) => d.key).sort();
    expect(rowKeys).toEqual(indicatorKeys);
  });

  it("has a row.* label in every language for every indicator", () => {
    for (const [key] of INDICATOR_ROWS) {
      for (const lang of LANGS_ALL) {
        expect(STRINGS_ALL[lang][`row.${key}`], `${lang}:row.${key}`).toBeDefined();
        expect(translate(lang, `row.${key}`), `${lang}:row.${key}`).not.toBe(`row.${key}`);
      }
    }
  });

  it("has translated units in every language", () => {
    const units = new Set(INDICATOR_ROWS.map(([, , unit]) => unit));
    for (const unit of units) {
      for (const lang of LANGS_ALL) {
        expect(STRINGS_ALL[lang][`unit.${unit}`], `${lang}:unit.${unit}`).toBeDefined();
        expect(indUnitFor(lang, unit), `${lang}:unit.${unit}`).not.toBe(`unit.${unit}`);
      }
    }
  });
});

describe("median", () => {
  it("returns the middle value for odd-length arrays", () => {
    expect(median([1, 3, 9])).toBe(3);
  });

  it("averages the two middle values for even-length arrays", () => {
    expect(median([1, 3, 5, 9])).toBe(4);
  });

  it("works on sorted arrays only (documented contract)", () => {
    expect(median([5])).toBe(5);
    expect(median([2, 4])).toBe(3);
  });
});

describe("aggregate", () => {
  it("sums additive indicators regardless of the selected stat", () => {
    expect(aggregate([100, 200, 700], true, "median")).toBe(1000);
    expect(aggregate([100, 200, 700], true, "mean")).toBe(1000);
  });

  it("uses median or mean for intensive indicators", () => {
    expect(aggregate([100, 200, 700], false, "median")).toBe(200);
    expect(aggregate([100, 200, 600], false, "mean")).toBe(300);
  });

  it("does not depend on input order", () => {
    expect(aggregate([700, 100, 200], false, "median")).toBe(200);
  });

  it("marks exactly the three count indicators as additive", () => {
    const additive = INDICATORS.filter((d) => d.additive).map((d) => d.key).sort();
    expect(additive).toEqual(["population", "solde_migratoire", "solde_naturel"]);
  });
});

describe("CIRCONSCRIPTIONS", () => {
  it("maps all 12 cantons to 4 electoral circonscriptions", () => {
    const circs = new Set(Object.values(CIRCONSCRIPTIONS));
    expect(circs).toEqual(new Set(["Centre", "Est", "Nord", "Sud"]));
    expect(Object.keys(CIRCONSCRIPTIONS)).toHaveLength(12);
  });

  it("contains the official partition", () => {
    expect(CIRCONSCRIPTIONS["Esch-sur-Alzette"]).toBe("Sud");
    expect(CIRCONSCRIPTIONS.Luxembourg).toBe("Centre");
    expect(CIRCONSCRIPTIONS.Diekirch).toBe("Nord");
    expect(CIRCONSCRIPTIONS.Remich).toBe("Est");
  });
});
