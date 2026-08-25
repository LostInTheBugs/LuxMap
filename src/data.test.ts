import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { INDICATORS } from "./utils/scale";

const indicators = JSON.parse(
  readFileSync(new URL("../public/indicators.json", import.meta.url), "utf-8"),
) as Record<string, unknown>[];

describe("public/indicators.json", () => {
  it("covers the 100 communes", () => {
    expect(indicators).toHaveLength(100);
  });

  it("stores every indicator as a number, never a string", () => {
    const offenders: string[] = [];
    for (const row of indicators) {
      for (const def of INDICATORS) {
        const v = row[def.key];
        if (v !== undefined && typeof v !== "number") {
          offenders.push(`${row.commune}.${def.key} = ${JSON.stringify(v)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("has a plausible total population", () => {
    const total = indicators.reduce(
      (s, r) => s + (typeof r.population === "number" ? r.population : 0),
      0,
    );
    expect(total).toBeGreaterThan(600_000);
    expect(total).toBeLessThan(750_000);
  });

  it("never stores a year where a value is expected", () => {
    // Un indicateur valant exactement l'année en cours sur les 100 communes
    // est le signe d'un latest() qui renvoie la clé au lieu de la valeur.
    for (const def of INDICATORS) {
      const values = indicators.map((r) => r[def.key]).filter((v) => v !== undefined);
      if (values.length < 50) continue;
      const distinct = new Set(values);
      expect(distinct.size, `${def.key} : une seule valeur sur ${values.length}`)
        .toBeGreaterThan(1);
    }
  });
});
