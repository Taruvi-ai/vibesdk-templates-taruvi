/**
 * Browser polyfills for Node globals.
 *
 * The platform bundler does not apply package.json `browser`-field remaps, so
 * some transitive dependencies ship their Node variants, which read `process`
 * at module init. This module MUST stay the FIRST import in `src/index.tsx`
 * (ESM evaluation order guarantees it runs before anything that needs it).
 */
type ProcessShim = {
  env: Record<string, string>;
  cwd: () => string;
  platform: string;
  version: string;
};

const globalScope = globalThis as typeof globalThis & { process?: ProcessShim };

if (typeof globalScope.process === "undefined") {
  globalScope.process = {
    env: { NODE_ENV: "production" },
    cwd: () => "/",
    platform: "browser",
    version: "",
  };
}

export {};
