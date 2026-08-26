/**
 * Update check logic for LuxMap.
 *
 * The app compares its own APP_VERSION against the latest GitHub release
 * tag (public repo, no auth needed) and offers a reload when a newer
 * build is available. Tags follow the convention YEAR.MONTH.NNN with an
 * optional hotfix suffix -cX (2026.08.027-c1 > 2026.08.027).
 */

/** Parses "YYYY.MM.NNN(-cX)" into a comparable tuple, or null if malformed. */
export function parseVersion(v: string): [number, number, number, number] | null {
  const m = /^(\d{4})\.(\d{1,2})\.(\d{1,3})(?:-c(\d+))?$/.exec(v.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 0 : Number(m[4])];
}

/** -1 / 0 / 1. A -cX hotfix ranks above its base release (027-c1 > 027). */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0; // malformed → treat as equal (no update, no downgrade)
  for (let i = 0; i < pa.length; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

export function isUpdateAvailable(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0;
}

const GITHUB_RELEASES_LATEST =
  "https://api.github.com/repos/LostInTheBugs/LuxMap/releases/latest";

/** Latest release tag (leading "v" stripped) or null on any failure/timeout. */
export async function fetchLatestVersion(timeoutMs = 6000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(GITHUB_RELEASES_LATEST, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const tag = (data as { tag_name?: unknown })?.tag_name;
    if (typeof tag !== "string") return null;
    return tag.replace(/^v/, "");
  } catch {
    return null;
  }
}
