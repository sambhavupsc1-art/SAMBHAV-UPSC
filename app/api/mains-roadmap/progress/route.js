
import crypto from "crypto";
import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    ...extra,
  };
}

function verifyEmailSession(token) {
  try {
    if (!token || !AUTH_SESSION_SECRET) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadPart, signaturePart] = parts;

    const expected = crypto
      .createHmac("sha256", AUTH_SESSION_SECRET)
      .update(payloadPart)
      .digest("base64url");

    const a = Buffer.from(signaturePart);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8")
    );

    if (!payload?.userId) return null;

    if (
      payload.exp &&
      Number(payload.exp) < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function getUserById(userId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=id`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const users = await response.json();
  return users[0] || null;
}

async function getUserByTelegramId(telegramId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(telegramId)}&select=id,telegram_id`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const users = await response.json();
  return users[0] || null;
}

async function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    /(?:^|;\s*)sambhav_session=([^;]+)/
  );

  if (match?.[1]) {
    let token = match[1];

    try {
      token = decodeURIComponent(token);
    } catch {}

    const session = verifyEmailSession(token);

    if (session?.userId) {
      const user = await getUserById(session.userId);
      if (user) return user;
    }
  }

  const authorization = request.headers.get("authorization") || "";

  if (authorization.startsWith("tma ")) {
    try {
      const telegramUser = validateTelegramInitData(
        authorization.slice(4)
      );

      if (telegramUser?.id) {
        return await getUserByTelegramId(telegramUser.id);
      }
    } catch {}
  }

  return null;
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

async function checkConfiguration() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return jsonError(
      "Roadmap database configuration missing.",
      500
    );
  }

  return null;
}

export async function GET(request) {
  try {
    const configurationError = await checkConfiguration();
    if (configurationError) return configurationError;

    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return jsonError("Authentication required.", 401);
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/mains_roadmap_progress?user_id=eq.${encodeURIComponent(
        String(user.id)
      )}&select=progress,updated_at`,
      {
        headers: supabaseHeaders(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Roadmap progress GET failed:",
        await response.text()
      );

      return jsonError(
        "Roadmap progress load nahi ho payi. Database table check karein.",
        500
      );
    }

    const rows = await response.json();
    const row = rows[0] || null;

    return NextResponse.json({
      success: true,
      progress: row?.progress || {},
      updated_at: row?.updated_at || null,
    });
  } catch (error) {
    console.error("Roadmap progress GET error:", error);

    return jsonError("Server error while loading roadmap.", 500);
  }
}

export async function POST(request) {
  try {
    const configurationError = await checkConfiguration();
    if (configurationError) return configurationError;

    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return jsonError("Authentication required.", 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body.", 400);
    }

    if (!isPlainObject(body?.progress)) {
      return jsonError("progress must be an object.", 400);
    }

    // Prevent accidentally storing an excessively large client payload.
    const serialized = JSON.stringify(body.progress);

    if (serialized.length > 200_000) {
      return jsonError("Roadmap progress payload is too large.", 413);
    }

    const payload = {
      user_id: String(user.id),
      progress: body.progress,
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/mains_roadmap_progress?on_conflict=user_id`,
      {
        method: "POST",
        headers: supabaseHeaders({
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        }),
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Roadmap progress POST failed:",
        await response.text()
      );

      return jsonError(
        "Roadmap progress save nahi hui. Database table aur server credentials check karein.",
        500
      );
    }

    const rows = await response.json();
    const row = rows[0];

    return NextResponse.json({
      success: true,
      progress: row?.progress ?? body.progress,
      updated_at: row?.updated_at ?? payload.updated_at,
    });
  } catch (error) {
    console.error("Roadmap progress POST error:", error);

    return jsonError("Server error while saving roadmap.", 500);
  }
}
