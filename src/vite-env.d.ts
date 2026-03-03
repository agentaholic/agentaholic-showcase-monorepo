/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITEST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
