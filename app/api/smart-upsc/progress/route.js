
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

function respondError(message, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

async function supabaseFetch(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
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
      !Number.isFinite(data.exp) ||
      Date.now() > data.exp
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function getApprovedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sambhav_session")?.value;
  const session = verifySession(token);

  if (!session?.userId) return null;

  const response = await supabaseFetch(
    `users?id=eq.${encodeURIComponent(
      session.userId
    )}&select=id,status`
  );

  if (!response.ok) {
    throw new Error("Could not verify the current user.");
  }

  const users = await response.json();
  const user = users[0];

  if (!user || user.status !== "approved") return null;

  return user;
}

async function getPublishedPlan() {
  const response = await supabaseFetch(
    "smart_upsc_plans?status=eq.published&select=id,version,title,start_date,duration_days,schedule,published_at&order=version.desc&limit=1"
  );

  if (!response.ok) {
    throw new Error("Could not load the published Smart UPSC plan.");
  }

  const plans = await response.json();
  return plans[0] || null;
}

async function getProgress(userId, planId) {
  const response = await supabaseFetch(
    `smart_upsc_progress?user_id=eq.${encodeURIComponent(
      userId
    )}&plan_id=eq.${encodeURIComponent(
      planId
    )}&select=id,user_id,plan_id,current_day,completed_tasks,notes,created_at,updated_at&limit=1`
  );

  if (!response.ok) {
    throw new Error("Could not load student progress.");
  }

  const rows = await response.json();
  return rows[0] || null;
}

/**
 * GET /api/smart-upsc/progress
 * Returns the currently published plan and this student's progress.
 */
export async function GET() {
  try {
    if (!AUTH_SESSION_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
      return respondError("Server configuration is incomplete.", 500);
    }

    const user = await getApprovedUser();

    if (!user) {
      return respondError("Please log in with an approved student account.", 401);
    }

    const plan = await getPublishedPlan();

    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        progress: null,
        message: "No Smart UPSC plan has been published yet.",
      });
    }

    const progress = await getProgress(user.id, plan.id);

    return NextResponse.json({
      success: true,
      plan,
      progress,
    });
  } catch (error) {
    console.error("Smart UPSC student GET error:", error);

    return respondError(
      "Unable to load Smart UPSC data.",
      500
    );
  }
}

/**
 * POST /api/smart-upsc/progress
 * Saves progress for the authenticated student only.
 *
 * Body:
 * {
 *   "plan_id": "published-plan-uuid",
 *   "current_day": 1,
 *   "completed_tasks": { "day_1_task_1": true },
 *   "notes": { "1": "Revise this topic" }
 * }
 */
export async function POST(request) {
  try {
    if (!AUTH_SESSION_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
      return respondError("Server configuration is incomplete.", 500);
    }

    const user = await getApprovedUser();

    if (!user) {
      return respondError("Please log in with an approved student account.", 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return respondError("Request body must be valid JSON.");
    }

    const planId =
      typeof body?.plan_id === "string" ? body.plan_id : "";

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(planId)) {
      return respondError("A valid plan_id is required.");
    }

    const planResponse = await supabaseFetch(
      `smart_upsc_plans?id=eq.${encodeURIComponent(
        planId
      )}&status=eq.published&select=id,duration_days`
    );

    if (!planResponse.ok) {
      throw new Error("Could not verify the published plan.");
    }

    const plans = await planResponse.json();
    const plan = plans[0];

    if (!plan) {
      return respondError(
        "This plan is not published or does not exist.",
        404
      );
    }

    const currentDay = Number(body.current_day);

    if (
      !Number.isInteger(currentDay) ||
      currentDay < 1 ||
      currentDay > plan.duration_days
    ) {
      return respondError(
        `current_day must be between 1 and ${plan.duration_days}.`
      );
    }

    const completedTasks = body.completed_tasks;
    const notes = body.notes;

    if (
      !completedTasks ||
      typeof completedTasks !== "object" ||
      Array.isArray(completedTasks)
    ) {
      return respondError(
        "completed_tasks must be a JSON object."
      );
    }

    if (
      !notes ||
      typeof notes !== "object" ||
      Array.isArray(notes)
    ) {
      return respondError("notes must be a JSON object.");
    }

    if (
      JSON.stringify(completedTasks).length > 100000 ||
      JSON.stringify(notes).length > 50000
    ) {
      return respondError("Progress data is too large.", 413);
    }

    for (const [key, value] of Object.entries(completedTasks)) {
      if (
        key.length > 150 ||
        typeof value !== "boolean"
      ) {
        return respondError(
          "Each completed_tasks entry must have a short key and a boolean value."
        );
      }
    }

    for (const [key, value] of Object.entries(notes)) {
      if (
        key.length > 50 ||
        typeof value !== "string" ||
        value.length > 2000
      ) {
        return respondError(
          "Each note must have a short key and a string of at most 2000 characters."
        );
      }
    }

    const now = new Date().toISOString();

    // user_id is always taken from the verified session,
    // never from the request body.
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
      const details = await response.text();
      console.error("Smart UPSC progress save failed:", details);

      return respondError("Failed to save your progress.", 500);
    }

    const rows = await response.json();

    return NextResponse.json({
      success: true,
      progress: rows[0] || null,
      message: "Progress saved successfully.",
    });
  } catch (error) {
    console.error("Smart UPSC student POST error:", error);

    return respondError(
      "Unable to save Smart UPSC progress.",
      500
    );
  }
}
