// Template-managed Vite config — do not modify. Taruvi env injection + Cloudflare Workers integration.
import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

function reloadTriggerPlugin() {
  return {
    name: "reload-trigger",
    configureServer(server: any) {
      const triggerFile = path.resolve(".reload-trigger");
      server.watcher.add(triggerFile);
      server.watcher.on("change", (filePath: string) => {
        if (filePath === triggerFile || filePath.endsWith(".reload-trigger")) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}

import fs from "node:fs";

function loadDevVars(): Record<string, string> {
  // The platform sandbox provides credentials via .dev.vars (wrangler convention)
  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), ".dev.vars"), "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}

export default ({ mode }: { mode: string }) => {
  // Empty prefix so TARUVI_* vars (no VITE_ prefix) load from .env / process env / .dev.vars
  const env = { ...loadDevVars(), ...loadEnv(mode, process.cwd(), "") };
  return defineConfig({
    plugins: [react(), cloudflare(), reloadTriggerPlugin()],
    define: {
      __TARUVI_SITE_URL__: JSON.stringify(env.TARUVI_SITE_URL ?? ""),
      __TARUVI_APP_SLUG__: JSON.stringify(env.TARUVI_APP_SLUG ?? ""),
      __TARUVI_API_KEY__: JSON.stringify(env.TARUVI_API_KEY ?? ""),
      __TARUVI_APP_TITLE__: JSON.stringify(env.TARUVI_APP_TITLE ?? ""),
      global: "globalThis",
    },
    build: {
      minify: true,
      sourcemap: "inline",
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
    css: { devSourcemap: true },
    server: {
      allowedHosts: true,
      watch: {
        awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
      },
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@emotion/react",
        "@emotion/styled",
        "hoist-non-react-statics",
        "prop-types",
        "react-is",
      ],
      esbuildOptions: { target: "esnext" },
      force: true,
    },
    cacheDir: "node_modules/.vite",
  });
};
