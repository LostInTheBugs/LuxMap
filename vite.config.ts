import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const APP_VERSION = readFileSync(new URL("./VERSION", import.meta.url), "utf-8").trim();

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
  server: { port: 3003, host: true },
  preview: { port: 3003, host: true },
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
});
