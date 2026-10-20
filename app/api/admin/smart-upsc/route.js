
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

function jsonError(error, status) {
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

    if (!data?.userId || !data?.exp || Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Smart UPSC session verification failed:", error);
    return null;
  }
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sambhav_session")?.value;
  const session = verifyEmailSession(token);

  if (!session?.userId) return null;

  const response = await supabaseFetch(
    `users?id=eq.${encodeURIComponent(session.userId)}&select=id,email,status`
  );

  if (!response.ok) {
    console.error(
      "Smart UPSC user lookup failed:",
      await response.text()
    );
    return null;
  }

  const users = await response.json();
  const user = users[0] || null;

  if (!user || (user.status && user.status !== "approved")) {
    return null;
  }

  return user;
}

async function authenticateAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;

  const response = await supabaseFetch(
    `admin_users?user_id=eq.${encodeURIComponent(
      user.id
    )}&is_active=eq.true&select=id,user_id`
  );

  if (!response.ok) {
    console.error(
      "Smart UPSC admin lookup failed:",
      await response.text()
    );
    return null;
  }

  const admins = await response.json();

  if (!admins.length) return null;

  return { user, admin: admins[0] };
}

function validISODate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}

function validateSchedule(schedule, durationDays) {
  if (!Array.isArray(schedule)) {
    return "schedule must be an array.";
  }

  if (schedule.length > 365) {
    return "schedule cannot contain more than 365 days.";
  }

  if (schedule.length !== durationDays) {
    return "schedule length must match duration_days.";
  }

  for (let index = 0; index < schedule.length; index += 1) {
    const day = schedule[index];

    if (!day || typeof day !== "object" || Array.isArray(day)) {
      return `Day ${index + 1} must be an object.`;
    }

    if (Number(day.day) !== index + 1) {
      return `Schedule day numbers must be sequential. Expected day ${
        index + 1
      }.`;
    }

    if (typeof day.title !== "string" || !day.title.trim()) {
      return `Day ${index + 1} requires a title.`;
    }

    if (day.title.length > 200) {
      return `Day ${index + 1} title cannot exceed 200 characters.`;
    }

    if (day.tasks !== undefined && !Array.isArray(day.tasks)) {
      return `Day ${index + 1} tasks must be an array if supplied.`;
    }
  }

  return null;
}

async function getLatestVersion() {
  const response = await supabaseFetch(
    "smart_upsc_plans?select=version&order=version.desc&limit=1"
  );

  if (!response.ok) {
    throw new Error(
      `Could not read plan versions: ${await response.text()}`
    );
  }

  const rows = await response.json();

  return Number(rows[0]?.version || 0);
}

/**
 * GET /api/admin/smart-upsc
 * Sirf authenticated active admin plans dekh sakta hai.
 */
export async function GET() {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY ||
      !AUTH_SESSION_SECRET
    ) {
      return jsonError(
        "Required server environment variables are missing.",
        500
      );
    }

    const auth = await authenticateAdmin();

    if (!auth) {
      return jsonError("Admin access denied.", 403);
    }

    const response = await supabaseFetch(
      "smart_upsc_plans?select=id,version,title,start_date,duration_days,status,schedule,created_by,created_at,updated_at,published_at&order=version.desc"
    );

    if (!response.ok) {
      console.error(
        "Smart UPSC plans fetch failed:",
        await response.text()
      );

      return jsonError("Failed to load Smart UPSC plans.", 500);
    }

    return NextResponse.json({
      success: true,
      plans: await response.json(),
    });
  } catch (error) {
    console.error("Smart UPSC admin GET failed:", error);

    return jsonError(
      "Server error while loading Smart UPSC plans.",
      500
    );
  }
}

/**
 * POST /api/admin/smart-upsc
 *
 * Supported actions:
 * create  - naya draft plan
 * update  - draft edit
 * publish - plan publish
 * archive - draft archive
 */
export async function POST(request) {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY ||
      !AUTH_SESSION_SECRET
    ) {
      return jsonError(
        "Required server environment variables are missing.",
        500
      );
    }

    const auth = await authenticateAdmin();

    if (!auth) {
      return jsonError("Admin access denied.", 403);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Request body must be valid JSON.", 400);
    }

    const action = body?.action;

    // CREATE A NEW DRAFT PLAN
    if (action === "create") {
      const title =
        typeof body.title === "string"
          ? body.title.trim()
          : "Smart UPSC Learning Plan";

      const startDate = body.start_date;
      const durationDays = Number(body.duration_days);
      const schedule = body.schedule;

      if (!title || title.length > 160) {
        return jsonError(
          "title is required and must be at most 160 characters.",
          400
        );
      }

      if (!validISODate(startDate)) {
        return jsonError(
          "start_date must be a valid YYYY-MM-DD date.",
          400
        );
      }

      if (
        !Number.isInteger(durationDays) ||
        durationDays < 1 ||
        durationDays > 365
      ) {
        return jsonError(
          "duration_days must be an integer between 1 and 365.",
          400
        );
      }

      const scheduleError = validateSchedule(
        schedule,
        durationDays
      );

      if (scheduleError) {
        return jsonError(scheduleError, 400);
      }

      const latestVersion = await getLatestVersion();

      const row = {
        version: latestVersion + 1,
        title,
        start_date: startDate,
        duration_days: durationDays,
        status: "draft",
        schedule,
        created_by: auth.user.id,
        updated_at: new Date().toISOString(),
      };

      const response = await supabaseFetch(
        "smart_upsc_plans",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(row),
        }
      );

      if (!response.ok) {
        console.error(
          "Smart UPSC plan create failed:",
          await response.text()
        );

        return jsonError("Failed to create draft plan.", 500);
      }

      const rows = await response.json();

      return NextResponse.json(
        {
          success: true,
          plan: rows[0] || null,
        },
        { status: 201 }
      );
    }

    // ACTIONS THAT REQUIRE AN EXISTING PLAN
    if (
      action === "update" ||
      action === "publish" ||
      action === "archive"
    ) {
      const planId =
        typeof body.plan_id === "string" ? body.plan_id : "";

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(planId)) {
        return jsonError("A valid plan_id is required.", 400);
      }

      const lookup = await supabaseFetch(
        `smart_upsc_plans?id=eq.${encodeURIComponent(
          planId
        )}&select=id,version,title,start_date,duration_days,status,schedule`
      );

      if (!lookup.ok) {
        console.error(
          "Smart UPSC plan lookup failed:",
          await lookup.text()
        );

        return jsonError("Failed to find plan.", 500);
      }

      const plans = await lookup.json();
      const plan = plans[0];

      if (!plan) {
        return jsonError("Plan not found.", 404);
      }

      // ARCHIVE A DRAFT
      if (action === "archive") {
        if (plan.status === "published") {
          return jsonError(
            "A published plan cannot be archived by this endpoint. Publish a replacement plan first.",
            409
          );
        }

        const response = await supabaseFetch(
          `smart_upsc_plans?id=eq.${encodeURIComponent(planId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              status: "archived",
              updated_at: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          console.error(
            "Smart UPSC plan archive failed:",
            await response.text()
          );

          return jsonError("Failed to archive plan.", 500);
        }

        const rows = await response.json();

        return NextResponse.json({
          success: true,
          plan: rows[0] || null,
        });
      }

      // PUBLISH A PLAN
      if (action === "publish") {
        if (plan.status === "archived") {
          return jsonError(
            "Archived plans cannot be published.",
            409
          );
        }

        // Archive any other currently published plan first.
        const currentPublished = await supabaseFetch(
          "smart_upsc_plans?status=eq.published&select=id"
        );

        if (!currentPublished.ok) {
          console.error(
            "Published plan lookup failed:",
            await currentPublished.text()
          );

          return jsonError(
            "Could not check the current published plan.",
            500
          );
        }

        const publishedRows = await currentPublished.json();

        for (const current of publishedRows) {
          if (current.id === planId) continue;

          const archiveResponse = await supabaseFetch(
            `smart_upsc_plans?id=eq.${encodeURIComponent(
              current.id
            )}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "archived",
                updated_at: new Date().toISOString(),
              }),
            }
          );

          if (!archiveResponse.ok) {
            console.error(
              "Could not archive prior published plan:",
              await archiveResponse.text()
            );

            return jsonError(
              "Could not replace the previously published plan; no new plan was published.",
              500
            );
          }
        }

        const now = new Date().toISOString();

        const response = await supabaseFetch(
          `smart_upsc_plans?id=eq.${encodeURIComponent(planId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              status: "published",
              published_at: now,
              updated_at: now,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            "Smart UPSC publish failed:",
            await response.text()
          );

          return jsonError("Failed to publish plan.", 500);
        }

        const rows = await response.json();

        return NextResponse.json({
          success: true,
          plan: rows[0] || null,
        });
      }

      // UPDATE A DRAFT ONLY
      if (plan.status !== "draft") {
        return jsonError(
          "Only draft plans can be edited. Create a new version to change a published plan.",
          409
        );
      }

      const update = {};

      if (body.title !== undefined) {
        if (
          typeof body.title !== "string" ||
          !body.title.trim() ||
          body.title.trim().length > 160
        ) {
          return jsonError(
            "title must be a non-empty string of at most 160 characters.",
            400
          );
        }

        update.title = body.title.trim();
      }

      if (body.start_date !== undefined) {
        if (!validISODate(body.start_date)) {
          return jsonError(
            "start_date must be a valid YYYY-MM-DD date.",
            400
          );
        }

        update.start_date = body.start_date;
      }

      if (body.duration_days !== undefined) {
        const durationDays = Number(body.duration_days);

        if (
          !Number.isInteger(durationDays) ||
          durationDays < 1 ||
          durationDays > 365
        ) {
          return jsonError(
            "duration_days must be an integer between 1 and 365.",
            400
          );
        }

        update.duration_days = durationDays;
      }

      if (body.schedule !== undefined) {
        const duration =
          update.duration_days ?? plan.duration_days;

        const scheduleError = validateSchedule(
          body.schedule,
          duration
        );

        if (scheduleError) {
          return jsonError(scheduleError, 400);
        }

        update.schedule = body.schedule;
      } else if (
        update.duration_days !== undefined &&
        update.duration_days !== plan.duration_days
      ) {
        return jsonError(
          "Send a schedule array matching the new duration_days.",
          400
        );
      }

      if (Object.keys(update).length === 0) {
        return jsonError(
          "No editable fields were supplied.",
          400
        );
      }

      update.updated_at = new Date().toISOString();

      const response = await supabaseFetch(
        `smart_upsc_plans?id=eq.${encodeURIComponent(planId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(update),
        }
      );

      if (!response.ok) {
        console.error(
          "Smart UPSC plan update failed:",
          await response.text()
        );

        return jsonError("Failed to update draft plan.", 500);
      }

      const rows = await response.json();

      return NextResponse.json({
        success: true,
        plan: rows[0] || null,
      });
    }

    return jsonError(
      "Unsupported action. Use create, update, publish, or archive.",
      400
    );
  } catch (error) {
    console.error("Smart UPSC admin POST failed:", error);

    return jsonError(
      "Server error while saving Smart UPSC plan.",
      500
    );
  }
}
