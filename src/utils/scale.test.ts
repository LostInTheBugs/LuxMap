import { describe, expect, it } from "vitest";
import { INDICATORS, NO_DATA_COLOR, PALETTE, colorFor, computeThresholds, defOf, fmt } from "./scale";

describe("INDICATORS", () => {
  it("has 12 indicators with unique keys", () => {
    expect(INDICATORS).toHaveLength(12);
    const keys = INDICATORS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every indicator defines label, unit, year and source", () => {
    for (const d of INDICATORS) {
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.unit.length).toBeGreaterThan(0);
      expect(d.year.length).toBeGreaterThan(0);
      expect(d.source.length).toBeGreaterThan(0);
      expect(typeof d.decimals).toBe("number");
    }
  });

  it("keys match the IndicatorKey union (spot-check critical ones)", () => {
    const keys = INDICATORS.map((d) => d.key).sort();
    expect(keys).toEqual(
      [
        "accidents",
        "age_median",
        "chomage",
        "density",
        "etrangers",
        "loyer_appart",
        "o3_days",
        "population",
        "prix_appart",
        "prix_maison",
        "solde_migratoire",
        "solde_naturel",
      ].sort(),
    );
  });
});

describe("defOf", () => {
  it("finds every indicator by key", () => {
    for (const d of INDICATORS) {
      expect(defOf(d.key).key).toBe(d.key);
    }
  });

  it("falls back to the first indicator for unknown keys", () => {
    expect(defOf("unknown" as never).key).toBe(INDICATORS[0].key);
  });
});

describe("computeThresholds", () => {
  it("returns [] for no values", () => {
    expect(computeThresholds([])).toEqual([]);
  });

  it("returns one boundary per color beyond the first", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const t = computeThresholds(values);
    expect(t).toHaveLength(PALETTE.length - 1);
  });

  it("produces increasing thresholds", () => {
    const values = Array.from({ length: 40 }, (_, i) => i * i);
    const t = computeThresholds(values);
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
  });

  it("handles a single value", () => {
    expect(computeThresholds([7]).length).toBeGreaterThanOrEqual(1);
  });
});

describe("colorFor", () => {
  const t = [10, 20, 30];

  it("returns NO_DATA_COLOR for undefined values or empty thresholds", () => {
    expect(colorFor(undefined, t)).toBe(NO_DATA_COLOR);
    expect(colorFor(5, [])).toBe(NO_DATA_COLOR);
  });

  it("maps values to the palette bands", () => {
    expect(colorFor(1, t)).toBe(PALETTE[0]);
    expect(colorFor(10, t)).toBe(PALETTE[0]); // boundary belongs to the lower band
    expect(colorFor(15, t)).toBe(PALETTE[1]);
    expect(colorFor(20, t)).toBe(PALETTE[1]);
    expect(colorFor(25, t)).toBe(PALETTE[2]);
    expect(colorFor(30, t)).toBe(PALETTE[2]);
    // Above the last threshold: last band defined by the thresholds (4 bands here).
    expect(colorFor(999, t)).toBe(PALETTE[t.length]);
  });

  it("reaches the darkest palette color with 5 thresholds (6 bands)", () => {
    const t5 = [10, 20, 30, 40, 50];
    expect(colorFor(999, t5)).toBe(PALETTE[5]);
    expect(colorFor(50, t5)).toBe(PALETTE[4]); // equality stays in the lower band
  });
});

describe("fmt", () => {
  it("formats undefined as an em dash", () => {
    expect(fmt(undefined, "%")).toBe("—");
  });

  it("uses the French locale by default (comma decimal)", () => {
    expect(fmt(4.26, "%", 1)).toBe("4,3 %");
  });

  it("respects decimals and empty units", () => {
    expect(fmt(3.14159, "", 2)).toBe("3,14");
    expect(fmt(42, "hab.")).toBe("42 hab.");
  });

  it("uses the requested locale", () => {
    expect(fmt(4.5, "%", 1, "de-DE")).toBe("4,5 %");
  });
});
