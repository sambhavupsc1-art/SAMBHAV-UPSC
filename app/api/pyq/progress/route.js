import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

function getInitData(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("tma ")) {
    return null;
  }

  return authorization.slice(4);
}

async function getTelegramUser(request) {
  const initData = getInitData(request);

  if (!initData) return null;

  try {
    return validateTelegramInitData(initData);
  } catch (error) {
    console.error("Telegram validation error:", error);
    return null;
  }
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    ...extra,
  };
}

function jsonError(message, status) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

export async function GET(request) {
  try {
    const telegramUser =
      await getTelegramUser(request);

    if (!telegramUser?.id) {
      return jsonError(
        "Invalid Telegram authentication",
        401
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/pyq_user_progress?telegram_id=eq.${telegramUser.id}&select=*`,
      {
        headers: supabaseHeaders(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "PYQ progress GET:",
        await response.text()
      );

      return jsonError(
        "Failed to load PYQ progress",
        500
      );
    }

    return NextResponse.json({
      progress: await response.json(),
    });
  } catch (error) {
    console.error(
      "PYQ progress GET error:",
      error
    );

    return jsonError(
      "Server error",
      500
    );
  }
}

export async function POST(request) {
  try {
    const telegramUser =
      await getTelegramUser(request);

    if (!telegramUser?.id) {
      return jsonError(
        "Invalid Telegram authentication",
        401
      );
    }

    const body = await request.json();

    const pyqId =
      String(body.pyq_id || "").trim();

    const pyqType =
      String(body.pyq_type || "").trim();

    const status =
      String(body.status || "new").trim();

    if (!pyqId) {
      return jsonError(
        "pyq_id is required",
        400
      );
    }

    if (
      !["prelims", "mains"].includes(
        pyqType
      )
    ) {
      return jsonError(
        "Invalid pyq_type",
        400
      );
    }

    if (
      ![
        "new",
        "important",
        "weak",
        "revise",
        "mastered",
      ].includes(status)
    ) {
      return jsonError(
        "Invalid status",
        400
      );
    }

    const attempted =
      Boolean(body.attempted);

    const payload = {
      telegram_id:
        telegramUser.id,

      pyq_id:
        pyqId,

      pyq_type:
        pyqType,

      status,

      bookmarked:
        Boolean(body.bookmarked),

      attempted,

      attempt_count:
        Math.max(
          0,
          Number(body.attempt_count) || 0
        ),

      correct_count:
        Math.max(
          0,
          Number(body.correct_count) || 0
        ),

      wrong_count:
        Math.max(
          0,
          Number(body.wrong_count) || 0
        ),

      last_attempted_at:
        attempted
          ? new Date().toISOString()
          : null,

      revision_due_at:
        body.revision_due_at || null,

      updated_at:
        new Date().toISOString(),
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/pyq_user_progress?on_conflict=telegram_id,pyq_id,pyq_type`,
      {
        method: "POST",

        headers: supabaseHeaders({
          "Content-Type":
            "application/json",

          Prefer:
            "resolution=merge-duplicates,return=representation",
        }),

        body: JSON.stringify(
          payload
        ),
      }
    );

    if (!response.ok) {
      console.error(
        "PYQ progress POST:",
        await response.text()
      );

      return jsonError(
        "Failed to save PYQ progress",
        500
      );
    }

    const rows =
      await response.json();

    return NextResponse.json({
      success: true,
      progress:
        rows[0] || null,
    });
  } catch (error) {
    console.error(
      "PYQ progress POST error:",
      error
    );

    return jsonError(
      "Server error",
      500
    );
  }
}

export async function DELETE(request) {
  try {
    const telegramUser =
      await getTelegramUser(request);

    if (!telegramUser?.id) {
      return jsonError(
        "Invalid Telegram authentication",
        401
      );
    }

    const { searchParams } =
      new URL(request.url);

    const pyqId =
      searchParams.get("pyq_id");

    const pyqType =
      searchParams.get("pyq_type");

    if (
      !pyqId ||
      !["prelims", "mains"].includes(
        pyqType
      )
    ) {
      return jsonError(
        "Invalid PYQ parameters",
        400
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/pyq_user_progress?telegram_id=eq.${telegramUser.id}&pyq_id=eq.${encodeURIComponent(pyqId)}&pyq_type=eq.${encodeURIComponent(pyqType)}`,
      {
        method: "DELETE",

        headers: supabaseHeaders({
          Prefer:
            "return=minimal",
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "PYQ progress DELETE:",
        await response.text()
      );

      return jsonError(
        "Failed to delete PYQ progress",
        500
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "PYQ progress DELETE error:",
      error
    );

    return jsonError(
      "Server error",
      500
    );
  }
}
