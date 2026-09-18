import { taruviClient } from "../taruviClient";

/**
 * Assigns this app's default role to the signed-in user, the moment they are
 * authenticated, so a fresh user is never left role-less and hitting 403 on
 * their first write.
 *
 * The platform provisions a public function `assign-user-role-on-login` into
 * every built app (see the platform's login-role-provision service). It finds
 * the user by email, activates them, and assigns the default `User` role. This
 * mirrors the Build-a-thon app, whose frontend calls the same function on
 * login. Here it is triggered from the auth provider's `getIdentity`, which
 * Refine runs on every authenticated load, so it covers the in-app login form,
 * the hosted-login redirect, and the platform's adopted preview session alike.
 *
 * Best-effort and idempotent: it runs once per browser session, never blocks
 * rendering, and swallows every error (the role may already be assigned, or an
 * older app may not have the function).
 */
const FUNCTION_SLUG = "assign-user-role-on-login";

let assigned = false;

export function ensureLoginRole(email: string | undefined): void {
  if (assigned) return;
  const target = (email ?? "").trim();
  if (!target) return;
  assigned = true;
  const appSlug = __TARUVI_APP_SLUG__;
  if (!appSlug) return;
  // Fire-and-forget: the session is already usable; the role assignment just
  // needs to land before the user's first write, which the network round-trip
  // comfortably beats.
  void taruviClient.httpClient
    .post(`api/apps/${appSlug}/functions/${FUNCTION_SLUG}/execute/`, {
      async: false,
      params: { email: target },
    })
    .catch(() => {
      // Reset so a later authenticated load can retry a transient failure.
      assigned = false;
    });
}
