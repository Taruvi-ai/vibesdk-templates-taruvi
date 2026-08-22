import { build } from "esbuild";
import { createRequire } from "node:module";
const requireCjs = createRequire(import.meta.url);
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";

// Bare specifiers the app's own src/ is allowed to import.
const specifiers = [
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@mui/material",
  "@mui/system",
  "@mui/x-data-grid",
  "recharts",
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
  "@taruvi/navkit",
  "axios",
];

// Packages whose live namespace cannot be enumerated in Node (raw .tsx source
// dists). Export names are hand-listed; esbuild resolves the actual modules.
const handExports = {
  "@taruvi/navkit": {
    lines: [
      // npm 0.0.49 main (src/App.tsx) only exports default; the named API
      // lives in src/NavkitContext.tsx. No "exports" field in package.json,
      // so deep file imports resolve (esbuild default resolveExtensions
      // includes .tsx).
      `export { default } from "@taruvi/navkit";`,
      `export { NavkitProvider, useNavigation, NavigationContext } from "@taruvi/navkit/src/NavkitContext";`,
      // Convenience alias so \`import { Navkit } from "@taruvi/navkit"\` works too.
      `export { default as Navkit } from "@taruvi/navkit";`,
    ],
  },
};

const entryName = (spec) => spec.replace(/^@/, "").replace(/[/]/g, "_");

rmSync("entries", { recursive: true, force: true });
rmSync("out/vendor", { recursive: true, force: true });
mkdirSync("entries", { recursive: true });

const entryPoints = {};
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
for (const spec of specifiers) {
  const name = entryName(spec);
  if (handExports[spec]) {
    writeFileSync(`entries/${name}.js`, handExports[spec].lines.join("\n") + "\n");
    entryPoints[name] = `entries/${name}.js`;
    continue;
  }
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

// @mui/icons-material: 10k+ icons, ~4.4MB bundled — far over the platform's
// ~2MB per-file storage caps as one file. Emit alphabetical chunk entries
// (each bundling well under the cap) plus a root module re-exporting them;
// the import map points at the root, the chunks load via relative imports.
{
  const iconsDir = "node_modules/@mui/icons-material/esm";
  const iconNames = readdirSync(iconsDir)
    .filter((f) => f.endsWith(".js") && f !== "index.js" && /^[A-Z]/.test(f))
    .map((f) => f.slice(0, -3))
    .sort();
  const CHUNKS = 5;
  const perChunk = Math.ceil(iconNames.length / CHUNKS);
  const chunkEntryNames = [];
  for (let i = 0; i < CHUNKS; i++) {
    const slice = iconNames.slice(i * perChunk, (i + 1) * perChunk);
    if (!slice.length) continue;
    const name = `mui_icons-chunk-${i + 1}`;
    const lines = slice.map(
      (icon) => `export { default as ${icon} } from "@mui/icons-material/${icon}";`,
    );
    writeFileSync(`entries/${name}.js`, lines.join("\n") + "\n");
    entryPoints[name] = `entries/${name}.js`;
    chunkEntryNames.push(name);
  }
  writeFileSync(
    "entries/mui_icons-material.js",
    chunkEntryNames.map((n) => `export * from "./${n}.js";`).join("\n") + "\n",
  );
  entryPoints["mui_icons-material"] = "entries/mui_icons-material.js";
  console.log(`icons: ${iconNames.length} icons in ${chunkEntryNames.length} chunks`);
}

// navkit's NavkitContext.tsx does `import { version } from '../package.json'
// with { type: 'json' }` — spec-compliant JSON modules only have a default
// export, so esbuild errors on the named import. Stub the module.
const navkitPkg = requireCjs("@taruvi/navkit/package.json");
const navkitPkgJsonPlugin = {
  name: "navkit-pkg-json",
  setup(b) {
    b.onResolve({ filter: /^\.\.\/package\.json$/ }, (args) => {
      if (!/@taruvi[\\/]navkit[\\/]src/.test(args.importer)) return;
      return { path: "navkit-pkg-json", namespace: "navkit-pkg" };
    });
    b.onLoad({ filter: /.*/, namespace: "navkit-pkg" }, () => ({
      loader: "js",
      contents:
        `export const version = ${JSON.stringify(navkitPkg.version)};\n` +
        `export default { version };\n`,
    }));
  },
};

const result = await build({
  entryPoints,
  plugins: [navkitPkgJsonPlugin],
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
  // navkit ships raw .tsx source with image imports; inline assets as data
  // URLs, and compile its JSX with the automatic runtime (classic would need
  // a `React` binding its files don't import).
  loader: { ".png": "dataurl", ".svg": "dataurl" },
  jsx: "automatic",
});
writeFileSync("out/metafile.json", JSON.stringify(result.metafile));

// Import map (relative paths — previews are path-prefixed)
const imports = {};
for (const spec of specifiers) imports[spec] = `./vendor/${entryName(spec)}.js`;
imports["@mui/icons-material"] = "./vendor/mui_icons-material.js";
writeFileSync("out/importmap.json", JSON.stringify({ imports }, null, 2));
console.log("done");
