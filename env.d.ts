/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_API_URL: string
  readonly VITE_AI_API_KEY: string
  readonly VITE_AI_MODEL: string
  readonly VITE_AI_API_TIMEOUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
