
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

/**
 * Reuse the app's existing authentication endpoint.
 * Never trust a user_id supplied by the browser.
 */
export async function getSmartQuizUser(request) {
  const headers = new Headers();

  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");

  if (cookie) headers.set("cookie", cookie);
  if (authorization) headers.set("authorization", authorization);

  const authUrl = new URL("/api/auth/me", request.url);

  const response = await fetch(authUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data?.user?.id ? data.user : null;
}

/**
 * Server-side Supabase REST helper.
 * Keep the service-role/secret key out of client-side code.
 */
export async function smartQuizDb(
  table,
  query = "",
  options = {}
) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  const safeTable = String(table).replace(/[^a-zA-Z0-9_]/g, "");

  if (!safeTable) {
    throw new Error("Invalid table name.");
  }

  const url =
    `${SUPABASE_URL}/rest/v1/${safeTable}` +
    (query ? `?${query}` : "");

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
    cache: "no-store",
  });

  const text = await response.text();

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    console.error("Smart Quiz database error:", data);

    throw new Error(
      typeof data === "object" && data?.message
        ? data.message
        : "Smart Quiz database request failed."
    );
  }

  return data;
}
