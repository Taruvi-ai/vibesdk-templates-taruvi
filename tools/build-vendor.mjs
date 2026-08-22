import { build } from "esbuild";
import { createRequire } from "node:module";
const requireCjs = createRequire(import.meta.url);
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

// Bare specifiers the app's own src/ is allowed to import.
const specifiers = [
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@mui/material",
  "@mui/system",
  "@mui/lab",
  "@refinedev/core",
  "@refinedev/mui",
  "@refinedev/kbar",
  "@refinedev/react-router",
  "@refinedev/react-hook-form",
  "react-hook-form",
  "react-router",
  "@emotion/react",
  "@emotion/styled",
  "@taruvi/sdk",
  "@taruvi/refine-providers",
  "axios",
  "@fortawesome/fontawesome-svg-core",
  "@fortawesome/free-solid-svg-icons",
  "@fortawesome/react-fontawesome",
];

const entryName = (spec) => spec.replace(/^@/, "").replace(/[/]/g, "_");

rmSync("entries", { recursive: true, force: true });
rmSync("out/vendor", { recursive: true, force: true });
mkdirSync("entries", { recursive: true });

const entryPoints = {};
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
for (const spec of specifiers) {
  const name = entryName(spec);
  // Enumerate the package's real export names with Node's own interop
  // (cjs-module-lexer): `export * from` a CJS module only surfaces `default`
  // under esbuild, which breaks `import { Component } from "react"` in the
  // browser. Explicit named exports generated from the live namespace are
  // correct for both CJS and ESM packages.
  let ns;
  try {
    ns = await import(spec);
  } catch {
    // Some dists deep-import directories (fine for bundlers, invalid for the
    // Node ESM runtime); CJS require resolution accepts them.
    const cjs = requireCjs(spec);
    ns = { ...cjs, default: cjs && cjs.__esModule ? cjs.default : cjs };
  }
  const names = Object.keys(ns).filter((k) => k !== "default" && k !== "__esModule" && IDENT.test(k));
  const lines = [
    `import * as __ns from ${JSON.stringify(spec)};`,
    `const __m = __ns.default !== undefined && typeof __ns.default === "object" && Object.keys(__ns).length <= 2 ? __ns.default : __ns;`,
  ];
  for (const k of names) lines.push(`export const ${k} = __ns[${JSON.stringify(k)}] !== undefined ? __ns[${JSON.stringify(k)}] : __m[${JSON.stringify(k)}];`);
  lines.push(`const __default = __ns.default === undefined ? __ns : __ns.default;`);
  lines.push(`export default __default;`);
  writeFileSync(`entries/${name}.js`, lines.join("\n") + "\n");
  entryPoints[name] = `entries/${name}.js`;
}

const result = await build({
  entryPoints,
  outdir: "out/vendor",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  minify: true,
  metafile: true,
  logLevel: "warning",
  define: { "process.env.NODE_ENV": '"production"' },
  conditions: ["browser"],
});
writeFileSync("out/metafile.json", JSON.stringify(result.metafile));

// Import map (relative paths — previews are path-prefixed)
const imports = {};
for (const spec of specifiers) imports[spec] = `./vendor/${entryName(spec)}.js`;
writeFileSync("out/importmap.json", JSON.stringify({ imports }, null, 2));
console.log("done");
