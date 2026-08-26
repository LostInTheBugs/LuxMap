/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SELF_HOSTED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
