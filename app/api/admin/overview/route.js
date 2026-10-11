import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

function jsonError(error, status = 500) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

async function supabaseFetch(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

function verifyEmailSession(token) {
  try {
    if (!token || !AUTH_SESSION_SECRET) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", AUTH_SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.userId || !data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

async function authenticateAdmin() {
  if (!AUTH_SESSION_SECRET) throw new Error("AUTH_SESSION_SECRET is missing.");

  const cookieStore = await cookies();
  const token = cookieStore.get("sambhav_session")?.value;
  const session = verifyEmailSession(token);
  if (!session?.userId) return false;

  const userResponse = await supabaseFetch(
    `users?id=eq.${encodeURIComponent(session.userId)}&select=id`
  );
  if (!userResponse.ok) {
    throw new Error(`User authentication lookup failed (${userResponse.status}).`);
  }
  const users = await userResponse.json();
  if (!users.length) return false;

  const adminResponse = await supabaseFetch(
    `admin_users?user_id=eq.${encodeURIComponent(session.userId)}&is_active=eq.true&select=id&limit=1`
  );
  if (!adminResponse.ok) {
    throw new Error(`Admin authorization lookup failed (${adminResponse.status}).`);
  }
  const admins = await adminResponse.json();
  return admins.length > 0;
}

async function countRows(table, query = "") {
  const path = `${table}?select=${encodeURIComponent("*")}${query ? `&${query}` : ""}`;
  const response = await supabaseFetch(path, {
    method: "HEAD",
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${table}: ${response.status} ${details.slice(0, 240)}`);
  }

  const contentRange = response.headers.get("content-range");
  const match = contentRange?.match(/\/(\d+|\*)$/);
  if (!match || match[1] === "*") {
    throw new Error(`${table}: Supabase did not return an exact row count.`);
  }
  return Number(match[1]);
}

function metric(value) {
  return { available: true, value };
}

async function safeMetric(table, query = "") {
  try {
    return metric(await countRows(table, query));
  } catch (error) {
    console.error(`Admin overview metric unavailable (${table}):`, error);
    return { available: false, value: null };
  }
}

export async function GET() {
  try {
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !AUTH_SESSION_SECRET) {
      return jsonError("Required Supabase or session environment variables are missing.", 500);
    }

    const isAdmin = await authenticateAdmin();
    if (!isAdmin) return jsonError("Admin access denied.", 403);

    // Core user counts. Status values match the existing admin user-management API.
    const [
      users,
      pendingUsers,
      approvedUsers,
      bannedUsers,
      subscriptions,
      currentAffairs,
      mainsEvaluations,
      prelimsQuestions,
    ] = await Promise.all([
      safeMetric("users"),
      safeMetric("users", "status=eq.pending"),
      safeMetric("users", "status=eq.approved"),
      safeMetric("users", "status=eq.banned"),
      safeMetric("subscriptions"),
      safeMetric("current_affairs"),
      safeMetric("mains_answer_history"),
      safeMetric("prelims_pyqs"),
    ]);

    const metrics = {
      users,
      pending_users: pendingUsers,
      approved_users: approvedUsers,
      banned_users: bannedUsers,
      subscriptions,
      current_affairs_items: currentAffairs,
      mains_evaluations: mainsEvaluations,
      prelims_questions: prelimsQuestions,
    };
    const unavailableMetrics = Object.entries(metrics)
      .filter(([, value]) => !value.available)
      .map(([key]) => key);

    return NextResponse.json(
      {
        success: true,
        metrics,
        unavailable_metrics: unavailableMetrics,
        generated_at: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Admin overview API error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Unable to load admin overview.",
      500
    );
  }
}
