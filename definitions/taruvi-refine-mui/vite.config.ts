import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * LOCAL DEVELOPMENT config only. The platform never runs vite — it bundles
 * `src/` itself and serves `public/` (whose index.html carries the vendor
 * import map). `copyPublicDir: false` keeps that platform HTML and the vendor
 * bundles out of local builds.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    copyPublicDir: false,
  },
});
