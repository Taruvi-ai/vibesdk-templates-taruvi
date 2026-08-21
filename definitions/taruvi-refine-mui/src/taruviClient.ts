import { Client } from "@taruvi/sdk";

/**
 * Taruvi Client, configured at runtime.
 *
 * The platform injects the site URL and app slug into the server's env; the
 * `App` Durable Object serves them (non-secret) at `./api/taruvi-config`. No
 * credential is embedded here or anywhere in this project: browser calls to
 * Taruvi authenticate as the signed-in end user via session tokens, which the
 * SDK manages itself. The `apiKey` below is a required-but-never-transmitted
 * constructor field - do NOT replace it with a real key.
 *
 * Top-level await keeps the export shape (`taruviClient`) identical for every
 * importer; the bundler targets browsers that support module-level await.
 */
interface TaruviRuntimeConfig {
  siteUrl: string;
  appSlug: string;
}

async function loadConfig(): Promise<TaruviRuntimeConfig> {
  // Relative path: the preview serves this app under a path prefix, and
  // JS-side URLs are not rewritten. Never use a leading slash here.
  const response = await fetch("./api/taruvi-config");
  if (!response.ok) {
    throw new Error(
      `Could not load Taruvi configuration (${response.status}). ` +
        "The platform injects TARUVI_SITE_URL and TARUVI_APP_SLUG into the " +
        "server env; check the deployment.",
    );
  }
  const config = (await response.json()) as TaruviRuntimeConfig;
  if (!config.siteUrl || !config.appSlug) {
    throw new Error(
      "Taruvi configuration is incomplete. Connect TaruviBase in the platform settings.",
    );
  }
  return config;
}

const runtimeConfig = await loadConfig();

/** Non-secret runtime configuration (site URL + app slug). */
export const taruviRuntimeConfig: TaruviRuntimeConfig = runtimeConfig;

/**
 * Taruvi Client instance.
 * Used for Refine providers and direct SDK operations.
 *
 * @example
 * // Use with Refine providers (recommended)
 * import { taruviDataProvider, taruviAuthProvider } from "./providers/refineProviders";
 *
 * @example
 * // Direct SDK usage (advanced)
 * import { taruviClient } from "./taruviClient";
 * const response = await taruviClient.httpClient.get("api/...");
 */
export const taruviClient = new Client({
  // Required by the constructor, never sent on the wire; auth is per-user
  // session tokens managed by the SDK.
  apiKey: "browser",
  appSlug: runtimeConfig.appSlug,
  apiUrl: runtimeConfig.siteUrl,
});
