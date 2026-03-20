/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WIX_CLIENT_ID: string
  readonly VITE_WIX_SITE_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
