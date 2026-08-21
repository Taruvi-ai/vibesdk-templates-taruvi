import { DurableObject } from "cloudflare:workers";

/**
 * The app's entire backend. The platform loads this class as a Durable Object
 * Facet and forwards every non-asset request to `fetch`.
 *
 * `env.TARUVI_SITE_URL`, `env.TARUVI_APP_SLUG` and `env.TARUVI_API_KEY` are
 * injected by the platform - never declare them in wrangler.json and never
 * write them into any file. The API key is privileged: it must not be logged,
 * echoed in a response, or shipped to the browser. The browser gets only the
 * non-secret site URL and app slug via /api/taruvi-config and talks to Taruvi
 * directly as the signed-in end user.
 */
interface AppEnv {
  TARUVI_SITE_URL?: string;
  TARUVI_APP_SLUG?: string;
  TARUVI_API_KEY?: string;
}

export class App extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const env = this.env as AppEnv;

    if (url.pathname.endsWith("/api/taruvi-config")) {
      return Response.json({
        siteUrl: env.TARUVI_SITE_URL ?? "",
        appSlug: env.TARUVI_APP_SLUG ?? "",
      });
    }

    // Server-side endpoints (privileged Taruvi calls, webhooks, aggregation)
    // go here. `this.ctx.storage` (SQLite + KV) is available for caches and
    // sessions; durable domain data belongs in Taruvi.

    return new Response("Not found", { status: 404 });
  }
}
