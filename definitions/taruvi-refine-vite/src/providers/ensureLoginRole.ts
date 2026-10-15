/**
 * Assigns this app's default role to the signed-in user, the moment they are
 * authenticated, so a fresh user is never left role-less and hitting 403 on
 * their first write.
 *
 * The platform provisions a public function `assign-user-role-on-login` into
 * every built app (see the platform's login-role-provision service). It finds
 * the active user with this email and assigns the default `User` role; it
 * never activates an account.
 *
 * It is called ANONYMOUSLY - no session token, no cookies. A public function
 * called anonymously runs with the permissions of the user who created it
 * (the app's owner), which may assign roles. Called with the new user's own
 * session it would run as that role-less user and the assignment would be
 * refused, so the SDK client (which attaches the session) is not used here. Here it is triggered from the auth provider's `getIdentity`, which
 * Refine runs on every authenticated load, so it covers the in-app login form,
 * the hosted-login redirect, and the platform's adopted preview session alike.
 *
 * Best-effort and idempotent: it runs once per browser session, never blocks
 * rendering, and swallows every error (the role may already be assigned, or an
 * older app may not have the function).
 */
const FUNCTION_SLUG = "assign-user-role-on-login";

let assigned = false;

/**
 * Run the assignment for a user whose email still has to be fetched.
 *
 * The session guard is checked BEFORE the resolver runs, so the extra identity
 * round trip happens at most once per browser session rather than on every
 * authenticated load.
 */
export function ensureLoginRoleWith(resolveEmail: () => Promise<string | undefined>): void {
  if (assigned) return;
  void resolveEmail()
    .then((email) => ensureLoginRole(email))
    .catch(() => {
      /* identity unavailable; a later load retries */
    });
}

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
  const siteUrl = (__TARUVI_SITE_URL__ || "").replace(/\/+$/, "");
  void fetch(`${siteUrl}/api/apps/${appSlug}/functions/${FUNCTION_SLUG}/execute/`, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ async: false, params: { email: target } }),
  })
    .then((response) => {
      if (!response.ok) throw { status: response.status };
    })
    .catch((error: unknown) => {
      const status = errorStatus(error);
      // A missing or forbidden function is PERMANENT for this deployment: the
      // platform provisions `assign-user-role-on-login` when it deploys an
      // app, so a 404 means this app was never provisioned (or is running
      // outside the platform). Retrying then produced one failed request on
      // every authenticated page load, forever. Keep `assigned` set so it is
      // attempted exactly once, and say why - loudly enough to be actionable,
      // quietly enough not to break a working app.
      if (status === 404 || status === 403 || status === 501) {
        console.warn(
          `[taruvi] Default-role assignment is unavailable: the "${FUNCTION_SLUG}" ` +
            `function is not present in app "${appSlug}" (HTTP ${status}). New users will ` +
            'not receive a role automatically, so their first write may be denied. ' +
            'The platform provisions this function when it deploys the app - redeploy ' +
            'from the builder, or create the function in the TaruviBase console.',
        );
        return;
      }
      // Anything else (offline, timeout, 5xx) may well succeed next time.
      assigned = false;
    });
}

/** HTTP status from an SDK/axios-style rejection, when there is one. */
function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { status?: unknown; response?: { status?: unknown } };
  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.response?.status === "number") return candidate.response.status;
  return undefined;
}
