import "server-only";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  type PlaidError,
} from "plaid";

// Plaid client wired against the environment selected by PLAID_ENV.
// Defaults to "sandbox" so a missing/unset value never hits a real
// banking environment. Switch to "production" only after we've been
// approved through Plaid's production review.
export type PlaidEnv = keyof typeof PlaidEnvironments;

function resolvePlaidEnv(): PlaidEnv {
  const raw = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  if (raw === "production") return "production";
  if (raw === "development") return "development";
  return "sandbox";
}

let cachedClient: PlaidApi | null = null;

export function plaidClient(): PlaidApi {
  if (cachedClient) return cachedClient;
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error(
      "Plaid is not configured — set PLAID_CLIENT_ID and PLAID_SECRET in Vercel env vars."
    );
  }
  const env = resolvePlaidEnv();
  const config = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
        "Plaid-Version": "2020-09-14",
      },
    },
  });
  cachedClient = new PlaidApi(config);
  return cachedClient;
}

export function isPlaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

// Plaid errors carry useful `error_code`/`error_message` fields under
// the AxiosError response. Pull them out so the caller can surface a
// useful message instead of a generic "Plaid call failed".
export function formatPlaidError(err: unknown): string {
  const maybe = err as { response?: { data?: PlaidError } };
  const data = maybe?.response?.data;
  if (data?.error_message) {
    return data.error_message;
  }
  if (err instanceof Error) return err.message;
  return "Plaid call failed";
}
