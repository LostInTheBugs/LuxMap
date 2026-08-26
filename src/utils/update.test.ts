import { describe, expect, it } from "vitest";
import { compareVersions, isUpdateAvailable, parseVersion } from "./update";

describe("parseVersion", () => {
  it("parses YEAR.MONTH.NNN", () => {
    expect(parseVersion("2026.08.027")).toEqual([2026, 8, 27, 0]);
    expect(parseVersion("2026.08.028")).toEqual([2026, 8, 28, 0]);
  });

  it("parses the -cX hotfix suffix", () => {
    expect(parseVersion("2026.08.027-c2")).toEqual([2026, 8, 27, 2]);
  });

  it("rejects malformed tags", () => {
    expect(parseVersion("2026.08.027-pre")).toBeNull();
    expect(parseVersion("v2026.08.027")).toBeNull();
    expect(parseVersion("garbage")).toBeNull();
    expect(parseVersion("")).toBeNull();
  });
});

describe("compareVersions", () => {
  it("orders releases numerically", () => {
    expect(compareVersions("2026.08.027", "2026.08.028")).toBe(-1);
    expect(compareVersions("2026.08.028", "2026.08.027")).toBe(1);
    expect(compareVersions("2026.08.027", "2026.08.027")).toBe(0);
  });

  it("orders across months and years", () => {
    expect(compareVersions("2026.07.999", "2026.08.001")).toBe(-1);
    expect(compareVersions("2025.12.031", "2026.01.001")).toBe(-1);
  });

  it("ranks hotfixes above their base release", () => {
    expect(compareVersions("2026.08.027", "2026.08.027-c1")).toBe(-1);
    expect(compareVersions("2026.08.027-c1", "2026.08.027-c2")).toBe(-1);
    expect(compareVersions("2026.08.027-c1", "2026.08.027-c1")).toBe(0);
  });

  it("a newer release beats any hotfix of an older one", () => {
    expect(compareVersions("2026.08.027-c9", "2026.08.028")).toBe(-1);
  });

  it("treats malformed versions as equal (no update, no downgrade)", () => {
    expect(compareVersions("2026.08.027", "nope")).toBe(0);
    expect(compareVersions("", "2026.08.028")).toBe(0);
  });
});

describe("isUpdateAvailable", () => {
  it("flags newer versions only", () => {
    expect(isUpdateAvailable("2026.08.027", "2026.08.028")).toBe(true);
    expect(isUpdateAvailable("2026.08.028", "2026.08.027")).toBe(false);
    expect(isUpdateAvailable("2026.08.027", "2026.08.027")).toBe(false);
    expect(isUpdateAvailable("2026.08.027", "2026.08.027-c1")).toBe(true);
  });
});

describe("SELF_HOSTED flag", () => {
  it("is disabled unless VITE_SELF_HOSTED is exactly \"1\"", () => {
    // Le site public ne doit jamais afficher la vérification de mise à jour.
    expect(import.meta.env.VITE_SELF_HOSTED === "1").toBe(false);
  });
});
