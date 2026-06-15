const OUTLOOK_SCOPES = [
  "offline_access",
  "openid",
  "email",
  "profile",
  "User.Read",
  "Mail.Read",
  "Mail.Send",
  "Mail.ReadWrite",
];

const TENANT = "common";

export function getRedirectUri(origin: string): string {
  return `${origin}/api/oauth/microsoft/callback`;
}

export function buildAuthorizeUrl(opts: {
  origin: string;
  state: string;
}): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) throw new Error("MICROSOFT_CLIENT_ID is not set.");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(opts.origin),
    response_type: "code",
    response_mode: "query",
    scope: OUTLOOK_SCOPES.join(" "),
    state: opts.state,
    prompt: "consent",
  });
  return `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize?${params.toString()}`;
}

export type MicrosoftTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

export async function exchangeCodeForTokens(opts: {
  code: string;
  origin: string;
}): Promise<MicrosoftTokenResponse> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("MICROSOFT_CLIENT_ID/SECRET not set.");
  }
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: opts.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(opts.origin),
        grant_type: "authorization_code",
        scope: OUTLOOK_SCOPES.join(" "),
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as MicrosoftTokenResponse;
}

export async function refreshAccessToken(opts: {
  refreshToken: string;
}): Promise<MicrosoftTokenResponse> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("MICROSOFT_CLIENT_ID/SECRET not set.");
  }
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: opts.refreshToken,
        grant_type: "refresh_token",
        scope: OUTLOOK_SCOPES.join(" "),
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as MicrosoftTokenResponse;
}

export async function getUserInfo(
  accessToken: string
): Promise<{ email: string; name?: string }> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Graph /me failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as {
    mail?: string | null;
    userPrincipalName?: string | null;
    displayName?: string | null;
  };
  const email = (body.mail ?? body.userPrincipalName ?? "").toLowerCase();
  if (!email) throw new Error("Graph /me returned no email address");
  return { email, name: body.displayName ?? undefined };
}
