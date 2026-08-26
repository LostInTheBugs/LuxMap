import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";

const APP_VERSION = readFileSync(new URL("./VERSION", import.meta.url), "utf-8").trim();

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
});
