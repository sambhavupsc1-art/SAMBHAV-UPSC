
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

function errorResponse(error, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

async function supabaseFetch(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Supabase server environment variables are missing.");
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

function verifySession(token) {
  try {
    if (!token || !AUTH_SESSION_SECRET) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", AUTH_SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !data?.userId ||
      !data?.exp ||
      Date.now() > Number(data.exp)
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sambhav_session")?.value;
  const session = verifySession(token);

  if (!session?.userId) return null;

  const response = await supabaseFetch(
    `users?id=eq.${encodeURIComponent(session.userId)}&select=id,email,status`
  );

  if (!response.ok) {
    throw new Error("Could not verify the logged-in user.");
  }

  const users = await response.json();
  const user = users[0] || null;

  if (!user || (user.status && user.status !== "approved")) {
    return null;
  }

  return user;
}

function validObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * GET /api/smart-upsc
 * Returns the published plan and this student's saved progress.
 */
export async function GET() {
  try {
    if (!AUTH_SESSION_SECRET || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      return errorResponse("Server environment is incomplete.", 500);
    }

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Please log in with an approved account.", 401);
    }

    const planResponse = await supabaseFetch(
      "smart_upsc_plans?status=eq.published&select=id,version,title,start_date,duration_days,status,schedule,published_at&order=version.desc&limit=1"
    );

    if (!planResponse.ok) {
      console.error("Published plan lookup failed:", await planResponse.text());
      return errorResponse("Could not load the published plan.", 500);
    }

    const plans = await planResponse.json();
    const plan = plans[0] || null;

    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        progress: null,
        message: "No Smart UPSC plan has been published yet.",
      });
    }

    const progressResponse = await supabaseFetch(
      `smart_upsc_progress?user_id=eq.${encodeURIComponent(user.id)}&plan_id=eq.${encodeURIComponent(plan.id)}&select=id,user_id,plan_id,current_day,completed_tasks,notes,created_at,updated_at&limit=1`
    );

    if (!progressResponse.ok) {
      console.error("Progress lookup failed:", await progressResponse.text());
      return errorResponse("Could not load your saved progress.", 500);
    }

    const progressRows = await progressResponse.json();

    return NextResponse.json({
      success: true,
      plan,
      progress: progressRows[0] || null,
    });
  } catch (error) {
    console.error("Smart UPSC student GET failed:", error);
    return errorResponse("Server error while loading your plan.", 500);
  }
}

/**
 * POST /api/smart-upsc
 * Saves progress for the currently logged-in student only.
 */
export async function POST(request) {
  try {
    if (!AUTH_SESSION_SECRET || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      return errorResponse("Server environment is incomplete.", 500);
    }

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Please log in with an approved account.", 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Request body must be valid JSON.", 400);
    }

    const planId =
      typeof body?.plan_id === "string" ? body.plan_id : "";

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(planId)) {
      return errorResponse("A valid plan_id is required.", 400);
    }

    const currentDay = Number(body.current_day);
    const completedTasks = body.completed_tasks ?? {};
    const notes = body.notes ?? {};

    if (
      !Number.isInteger(currentDay) ||
      currentDay < 1 ||
      currentDay > 365
    ) {
      return errorResponse("current_day must be between 1 and 365.", 400);
    }

    if (!validObject(completedTasks) || !validObject(notes)) {
      return errorResponse(
        "completed_tasks and notes must be JSON objects.",
        400
      );
    }

    if (
      JSON.stringify(completedTasks).length > 100000 ||
      JSON.stringify(notes).length > 100000
    ) {
      return errorResponse("Progress data is too large.", 413);
    }

    // Students can save progress only against the currently published plan.
    const planResponse = await supabaseFetch(
      `smart_upsc_plans?id=eq.${encodeURIComponent(planId)}&status=eq.published&select=id,duration_days`
    );

    if (!planResponse.ok) {
      return errorResponse("Could not verify the published plan.", 500);
    }

    const plans = await planResponse.json();
    const plan = plans[0];

    if (!plan) {
      return errorResponse("This plan is not currently published.", 409);
    }

    if (currentDay > Number(plan.duration_days)) {
      return errorResponse("current_day exceeds the plan duration.", 400);
    }

    const now = new Date().toISOString();

    const row = {
      user_id: user.id,
      plan_id: plan.id,
      current_day: currentDay,
      completed_tasks: completedTasks,
      notes,
      updated_at: now,
    };

    const response = await supabaseFetch(
      "smart_upsc_progress?on_conflict=user_id,plan_id",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(row),
      }
    );

    if (!response.ok) {
      console.error("Progress save failed:", await response.text());
      return errorResponse("Could not save your progress.", 500);
    }

    const rows = await response.json();

    return NextResponse.json({
      success: true,
      progress: rows[0] || row,
      message: "Progress saved.",
    });
  } catch (error) {
    console.error("Smart UPSC student POST failed:", error);
    return errorResponse("Server error while saving your progress.", 500);
  }
}
