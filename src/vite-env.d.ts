/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMMIT_SHA?: string;
  readonly VITE_BUILD_TIME?: string;
}
