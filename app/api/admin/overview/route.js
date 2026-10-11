
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const AUTH_SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET;

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

/**
 * Verify the existing SAMBHAV signed session format:
 * payload.signature
 */
function verifyEmailSession(token) {
  try {
    if (!token || !AUTH_SESSION_SECRET) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !session?.userId ||
      !session?.exp ||
      !Number.isFinite(Number(session.exp)) ||
      Date.now() > Number(session.exp)
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Server-only Supabase REST request.
 * Never expose the service-role key to the browser.
 */
async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const baseUrl = SUPABASE_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/rest/v1/${path}`;

  return fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}

/**
 * Verify the signed-in user exists.
 * Uses the same cookie and users table as the existing admin API.
 */
async function getCurrentUser(userId) {
  const query = new URLSearchParams({
    id: `eq.${userId}`,
    select: "id,email,first_name,username",
    limit: "1",
  });

  const response = await supabaseRequest(
    `users?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error("USER_LOOKUP_FAILED");
  }

  const users = await response.json();

  return Array.isArray(users) && users.length
    ? users[0]
    : null;
}

/**
 * Admin authorization is based on:
 * admin_users.user_id = users.id
 * admin_users.is_active = true
 */
async function getActiveAdmin(userId) {
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    is_active: "eq.true",
    select: "id,user_id,first_name,username",
    limit: "1",
  });

  const response = await supabaseRequest(
    `admin_users?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error("ADMIN_LOOKUP_FAILED");
  }

  const admins = await response.json();

  return Array.isArray(admins) && admins.length
    ? admins[0]
    : null;
}

/**
 * Return an exact live row count using PostgREST HEAD.
 *
 * A failed query is represented as unavailable (null),
 * never as a genuine zero.
 */
async function countRows(name, query) {
  try {
    const response = await supabaseRequest(
      `${name}?${query}`,
      {
        method: "HEAD",
        headers: {
          Prefer: "count=exact",
          Range: "0-0",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `[ADMIN OVERVIEW] Count unavailable: ${name}`,
        response.status
      );

      return {
        value: null,
        available: false,
      };
    }

    const contentRange =
      response.headers.get("content-range") || "";

    const total = contentRange.split("/")[1];

    if (
      !total ||
      total === "*" ||
      !Number.isSafeInteger(Number(total)) ||
      Number(total) < 0
    ) {
      return {
        value: null,
        available: false,
      };
    }

    return {
      value: Number(total),
      available: true,
    };
  } catch (error) {
    console.error(
      `[ADMIN OVERVIEW] Count request failed: ${name}`,
      error?.name || "UnknownError"
    );

    return {
      value: null,
      available: false,
    };
  }
}

export async function GET() {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY ||
      !AUTH_SESSION_SECRET
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Admin overview is not configured.",
        },
        500
      );
    }

    // 1. Read the existing website session.
    const cookieStore = await cookies();

    const token =
      cookieStore.get("sambhav_session")?.value;

    const session = verifyEmailSession(token);

    if (!session?.userId) {
      return jsonResponse(
        {
          success: false,
          error: "Authentication required.",
        },
        401
      );
    }

    // 2. Verify that the account still exists.
    const user = await getCurrentUser(session.userId);

    if (!user) {
      return jsonResponse(
        {
          success: false,
          error: "Account not found.",
        },
        401
      );
    }

    // 3. Require an active admin_users record.
    const admin = await getActiveAdmin(user.id);

    if (!admin) {
      return jsonResponse(
        {
          success: false,
          error: "Admin access denied.",
        },
        403
      );
    }

    // 4. Fetch live database counts in parallel.
    // These are counts, not fabricated analytics.
    const definitions = [
      ["users", "users", "select=id"],
      [
        "pending_users",
        "users",
        "status=eq.pending&select=id",
      ],
      [
        "approved_users",
        "users",
        "status=eq.approved&select=id",
      ],
      [
        "banned_users",
        "users",
        "status=eq.banned&select=id",
      ],
      [
        "subscriptions",
        "subscriptions",
        "select=id",
      ],
      [
        "current_affairs_items",
        "current_affairs",
        "select=id",
      ],
      [
        "mains_evaluations",
        "mains_answer_history",
        "select=id",
      ],
      [
        "prelims_questions",
        "prelims_pyqs",
        "select=id",
      ],
    ];

    const results = await Promise.all(
      definitions.map(async ([metric, table, query]) => [
        metric,
        await countRows(table, query),
      ])
    );

    const metrics = Object.fromEntries(results);

    const unavailableMetrics = Object.entries(metrics)
      .filter(([, result]) => !result.available)
      .map(([metric]) => metric);

    return jsonResponse({
      success: true,
      generated_at: new Date().toISOString(),
      source: "live_supabase_counts",
      admin: {
        id: admin.id,
        user_id: user.id,
        email: user.email || null,
        first_name:
          admin.first_name || user.first_name || null,
        username:
          admin.username || user.username || null,
      },
      metrics,
      unavailable_metrics: unavailableMetrics,
      note:
        "Counts represent live database rows. They do not represent unique active subscribers, verified revenue, feature usage, conversion rates, or application latency.",
    });
  } catch (error) {
    console.error(
      "[ADMIN OVERVIEW] Request failed:",
      error?.message || "Unknown error"
    );

    const isTimeout =
      error?.name === "TimeoutError" ||
      error?.name === "AbortError";

    return jsonResponse(
      {
        success: false,
        error: isTimeout
          ? "Admin overview request timed out."
          : "Unable to load admin overview.",
      },
      isTimeout ? 504 : 500
    );
  }
}
