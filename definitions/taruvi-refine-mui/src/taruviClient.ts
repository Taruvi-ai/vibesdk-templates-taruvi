import { Client } from "@taruvi/sdk";

/**
 * Taruvi Client, configured at runtime.
 *
 * The platform injects the site URL and app slug into the server's env; the
 * `App` Durable Object serves them (non-secret) at `./api/taruvi-config`.
 * For LOCAL development (npm run dev), `VITE_TARUVI_SITE_URL` /
 * `VITE_TARUVI_APP_SLUG` from `.env` take precedence and no config fetch
 * happens. No credential is embedded anywhere: browser calls to Taruvi
 * authenticate as the signed-in end user via session tokens, which the SDK
 * manages itself. The `apiKey` below is a required-but-never-transmitted
 * constructor field - do NOT replace it with a real key.
 */
interface TaruviRuntimeConfig {
  siteUrl: string;
  appSlug: string;
}

/**
 * The SDK stores its session token under the GLOBAL localStorage key
 * `session_token`, and on this platform every app preview shares one origin.
 * Without an ownership check, a token from another app (or another Taruvi
 * site) silently signs the user into THIS app. Record which site|slug the
 * stored token belongs to and clear it when this app differs, so each app
 * starts at its own login.
 */
const TOKEN_OWNER_KEY = "taruvi_token_owner";

function enforceTokenOwnership(client: Client, config: TaruviRuntimeConfig): void {
  if (typeof localStorage === "undefined") return;
  const owner = `${config.siteUrl}|${config.appSlug}`;
  const storedOwner = localStorage.getItem(TOKEN_OWNER_KEY);
  if (storedOwner !== owner) {
    if (storedOwner !== null) client.tokenClient.clearTokens();
    localStorage.setItem(TOKEN_OWNER_KEY, owner);
  }
}

async function loadConfig(): Promise<TaruviRuntimeConfig> {
  // Local vite dev injects import.meta.env; the platform bundler does not
  // define it at all, so guard the access.
  const viteEnv =
    typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env
      ? (import.meta as unknown as { env: Record<string, string> }).env
      : undefined;
  const envSiteUrl = viteEnv?.VITE_TARUVI_SITE_URL;
  const envAppSlug = viteEnv?.VITE_TARUVI_APP_SLUG;
  if (envSiteUrl && envAppSlug) {
    return { siteUrl: envSiteUrl, appSlug: envAppSlug };
  }

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

/**
 * Set when configuration could not be loaded. `src/index.tsx` checks this and
 * renders a readable error panel instead of mounting the app — a config
 * failure must never be a blank page.
 */
export let taruviConfigError: string | null = null;

let runtimeConfig: TaruviRuntimeConfig = { siteUrl: "", appSlug: "" };
try {
  runtimeConfig = await loadConfig();
} catch (error) {
  taruviConfigError = error instanceof Error ? error.message : String(error);
}

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
  // session tokens managed by the SDK. When configuration failed, harmless
  // placeholders keep the constructor from throwing so `src/index.tsx` can
  // render the error panel instead of a dead module graph.
  apiKey: "browser",
  appSlug: runtimeConfig.appSlug || "unconfigured",
  apiUrl: runtimeConfig.siteUrl || "https://unconfigured.invalid",
});

if (!taruviConfigError) {
  enforceTokenOwnership(taruviClient, runtimeConfig);
}
