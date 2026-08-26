import { useCallback, useEffect, useState } from "react";
import { safeGet, safeSet } from "./i18n";
import { fetchLatestVersion, isUpdateAvailable } from "./utils/update";

/** La vérification de mise à jour ne concerne que les instances
 *  auto-hébergées : sur le site public, le visiteur ne peut rien redéployer.
 *  Activée au build par VITE_SELF_HOSTED=1. */
export const SELF_HOSTED = import.meta.env.VITE_SELF_HOSTED === "1";

export type UpdateStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "upToDate" }
  | { state: "available"; version: string }
  | { state: "error" };

/** GitHub API is rate-limited (60 req/h per IP) → auto-check at most once/hour. */
const AUTO_MIN_INTERVAL_MS = 60 * 60 * 1000;
const LAST_CHECK_KEY = "luxmap-last-update-check";

/**
 * Compares APP_VERSION against the latest GitHub release.
 * - Auto-checks once per page load (throttled to 1/h via localStorage).
 * - `check(true)` forces a manual check (update button).
 */
export function useUpdateCheck(currentVersion: string) {
  const [status, setStatus] = useState<UpdateStatus>({ state: "idle" });

  const check = useCallback(
    async (force = false) => {
      if (!SELF_HOSTED) return;
      const last = Number(safeGet(LAST_CHECK_KEY) ?? 0);
      if (!force && Date.now() - last < AUTO_MIN_INTERVAL_MS) return;
      setStatus({ state: "checking" });
      const latest = await fetchLatestVersion();
      if (latest === null) {
        setStatus({ state: "error" });
        return;
      }
      safeSet(LAST_CHECK_KEY, String(Date.now()));
      setStatus(
        isUpdateAvailable(currentVersion, latest)
          ? { state: "available", version: latest }
          : { state: "upToDate" },
      );
    },
    [currentVersion],
  );

  // Auto-check on mount, deferred via rAF (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!SELF_HOSTED) return;
    const raf = requestAnimationFrame(() => void check());
    return () => cancelAnimationFrame(raf);
  }, [check]);

  return { status, check };
}
