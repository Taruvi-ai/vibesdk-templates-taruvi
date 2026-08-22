import {
  dataProvider,
  authProvider,
  storageDataProvider,
  appDataProvider,
  userDataProvider,
  accessControlProvider,
} from "@taruvi/refine-providers";
import { taruviClient } from "../taruviClient";

export type { UserData as TaruviUser } from "@taruvi/sdk";
export type {
  TaruviMeta,
  TaruviListResponse,
  StorageUploadVariables,
  LoginParams,
  LogoutParams,
  RegisterParams,
  FunctionMeta,
  AnalyticsMeta,
} from "@taruvi/refine-providers";

export {
  buildRefineQueryParams,
  convertRefineFilters,
  convertRefineSorters,
  convertRefinePagination,
  buildQueryString,
  REFINE_OPERATOR_MAP,
} from "@taruvi/refine-providers";

/**
 * Refine providers for Taruvi
 *
 * - taruviDataProvider (default): Database CRUD
 * - taruviStorageProvider (storage): File upload/download/delete
 * - taruviAppProvider (app): Functions, analytics, roles, settings, secrets
 * - taruviUserProvider (user): User CRUD and roles
 * - taruviAuthProvider: Authentication
 * - taruviAccessControlProvider: Cerbos permission checks
 */

export const taruviDataProvider = dataProvider(taruviClient);

/**
 * Credentials-aware auth provider.
 *
 * Taruvi serves django-allauth's headless app API (the SDK's own session
 * check hits `_allauth/app/v1/auth/session`), so login/signup are plain JSON
 * endpoints returning a `session_token` — the same token the SDK's
 * HttpClient sends as `X-Session-Token`. Signing in via the API keeps the
 * whole flow inside the app (no cross-origin redirect, which the embedded
 * preview iframe cannot perform: the hosted login sends
 * `X-Frame-Options: DENY`). When no credentials are passed, the package
 * provider's hosted redirect flow is used as before.
 */
interface AllauthFlow {
  id: string;
  is_pending?: boolean;
}

interface AllauthBody {
  status: number;
  meta?: { session_token?: string; is_authenticated?: boolean };
  data?: { flows?: AllauthFlow[] };
  errors?: Array<{ message: string; param?: string }>;
}

interface CredentialParams {
  email?: string;
  username?: string;
  password?: string;
  redirect?: boolean;
  callbackUrl?: string;
}

const PENDING_FLOW_MESSAGES: Record<string, string> = {
  verify_email: "Check your inbox and verify your email address, then sign in.",
  mfa_authenticate: "This account requires two-factor authentication, which this app does not support yet.",
};

function allauthFailureMessage(body: AllauthBody | undefined, fallback: string): string {
  const fieldError = body?.errors?.[0]?.message;
  if (fieldError) return fieldError;
  const pending = body?.data?.flows?.find((flow) => flow.is_pending);
  if (pending) return PENDING_FLOW_MESSAGES[pending.id] ?? `Additional sign-in step required: ${pending.id}`;
  return fallback;
}

async function allauthAuthenticate(
  path: "login" | "signup",
  payload: Record<string, string>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const fallback = path === "login" ? "Invalid email or password." : "Could not create the account.";
  try {
    const response = await taruviClient.httpClient.post(`_allauth/app/v1/auth/${path}`, payload);
    const body = response.data as AllauthBody;
    const token = body.meta?.session_token;
    if (token && body.meta?.is_authenticated !== false) {
      taruviClient.tokenClient.setTokens({ sessionToken: token });
      return { ok: true };
    }
    return { ok: false, message: allauthFailureMessage(body, fallback) };
  } catch (error) {
    const body = (error as { response?: { data?: AllauthBody } }).response?.data;
    return { ok: false, message: allauthFailureMessage(body, fallback) };
  }
}

const packageAuthProvider = authProvider(taruviClient);

export const taruviAuthProvider: typeof packageAuthProvider = {
  ...packageAuthProvider,
  login: async (params: CredentialParams = {}) => {
    const { email, username, password } = params;
    if (password && (email || username)) {
      const result = await allauthAuthenticate("login", {
        ...(email ? { email } : {}),
        ...(username ? { username } : {}),
        password,
      });
      return result.ok
        ? { success: true, redirectTo: "/" }
        : { success: false, error: { name: "LoginError", message: result.message } };
    }
    return packageAuthProvider.login(params);
  },
  register: async (params: CredentialParams = {}) => {
    const { email, password } = params;
    if (email && password) {
      const result = await allauthAuthenticate("signup", { email, password });
      return result.ok
        ? { success: true, redirectTo: "/" }
        : { success: false, error: { name: "RegisterError", message: result.message } };
    }
    return packageAuthProvider.register(params);
  },
};
export const taruviStorageProvider = storageDataProvider(taruviClient);
export const taruviAppProvider = appDataProvider(taruviClient);
export const taruviUserProvider = userDataProvider(taruviClient);
export const taruviAccessControlProvider = accessControlProvider(taruviClient);
