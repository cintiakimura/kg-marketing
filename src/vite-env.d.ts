/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KG_MARKETING_API_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GROK_API_KEY?: string;
  readonly VITE_GROK_USE_BACKEND_PROXY?: string;
  readonly VITE_GROK_API_URL?: string;
  readonly VITE_GROK_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
