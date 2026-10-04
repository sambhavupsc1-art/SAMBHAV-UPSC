import crypto from "crypto";
import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const AUTH_SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET;

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

/* -------------------------------------------------------
   EMAIL SESSION
------------------------------------------------------- */

function base64UrlDecode(value) {
  return Buffer.from(
    value,
    "base64url"
  ).toString("utf8");
}

function verifyEmailSession(token) {
  try {
    if (!token || !AUTH_SESSION_SECRET) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payloadPart, signaturePart] = parts;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        AUTH_SESSION_SECRET
      )
      .update(payloadPart)
      .digest("base64url");

    const a = Buffer.from(
      signaturePart,
      "utf8"
    );

    const b = Buffer.from(
      expectedSignature,
      "utf8"
    );

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return null;
    }

    const payload = JSON.parse(
      base64UrlDecode(payloadPart)
    );

    if (!payload?.userId) {
      return null;
    }

    if (
      payload.exp &&
      Number(payload.exp) <
        Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error(
      "Email session verification error:",
      error
    );

    return null;
  }
}

/* -------------------------------------------------------
   USER LOOKUPS
------------------------------------------------------- */

async function getUserById(userId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
      userId
    )}&select=id,email,telegram_id,first_name,username,status,plan`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error(
      "getUserById:",
      await response.text()
    );

    return null;
  }

  const rows = await response.json();

  return rows[0] || null;
}

async function getUserByTelegramId(telegramId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(
      telegramId
    )}&select=id,email,telegram_id,first_name,username,status,plan`,
    {
      headers: supabaseHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error(
      "getUserByTelegramId:",
      await response.text()
    );

    return null;
  }

  const rows = await response.json();

  return rows[0] || null;
}

/* -------------------------------------------------------
   AUTHENTICATION
   EMAIL SESSION FIRST
   TELEGRAM FALLBACK
------------------------------------------------------- */

async function getAuthenticatedUser(request) {
  /* ---------- EMAIL SESSION ---------- */

  const cookieHeader =
    request.headers.get("cookie") || "";

  const sessionMatch =
    cookieHeader.match(
      /(?:^|;\s*)sambhav_session=([^;]+)/
    );

  if (sessionMatch?.[1]) {
    const sessionToken =
      decodeURIComponent(sessionMatch[1]);

    const session =
      verifyEmailSession(sessionToken);

    if (session?.userId) {
      const user =
        await getUserById(session.userId);

      if (user) {
        return {
          user,
          authMethod: "email",
        };
      }
    }
  }

  /* ---------- TELEGRAM FALLBACK ---------- */

  const authorization =
    request.headers.get("authorization");

  if (
    authorization?.startsWith("tma ")
  ) {
    const initData =
      authorization.slice(4);

    try {
      const telegramUser =
        validateTelegramInitData(
          initData
        );

      if (telegramUser?.id) {
        const user =
          await getUserByTelegramId(
            telegramUser.id
          );

        if (user) {
          return {
            user,
            authMethod: "telegram",
          };
        }
      }
    } catch (error) {
      console.error(
        "Telegram validation error:",
        error
      );
    }
  }

  return null;
}

/* -------------------------------------------------------
   GET PROGRESS
------------------------------------------------------- */

export async function GET(request) {
  try {
    const authenticated =
      await getAuthenticatedUser(request);

    if (!authenticated?.user?.id) {
      return jsonError(
        "Authentication required",
        401
      );
    }

    const userId =
      authenticated.user.id;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/pyq_user_progress?user_id=eq.${encodeURIComponent(
        userId
      )}&select=*`,
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
      progress:
        await response.json(),
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

/* -------------------------------------------------------
   POST / SAVE PROGRESS
------------------------------------------------------- */

export async function POST(request) {
  try {
    const authenticated =
      await getAuthenticatedUser(request);

    if (!authenticated?.user?.id) {
      return jsonError(
        "Authentication required",
        401
      );
    }

    const user =
      authenticated.user;

    const body =
      await request.json();

    const pyqId =
      String(
        body.pyq_id || ""
      ).trim();

    const pyqType =
      String(
        body.pyq_type || ""
      ).trim();

    const status =
      String(
        body.status || "new"
      ).trim();

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
      user_id:
        user.id,

      /*
       * Telegram ID preserve kar rahe hain
       * taaki existing Telegram data compatible rahe.
       */
      telegram_id:
        user.telegram_id || null,

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
          Number(
            body.attempt_count
          ) || 0
        ),

      correct_count:
        Math.max(
          0,
          Number(
            body.correct_count
          ) || 0
        ),

      wrong_count:
        Math.max(
          0,
          Number(
            body.wrong_count
          ) || 0
        ),

      last_attempted_at:
        attempted
          ? new Date().toISOString()
          : null,

      revision_due_at:
        body.revision_due_at ||
        null,

      updated_at:
        new Date().toISOString(),
    };

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/pyq_user_progress?on_conflict=user_id,pyq_id,pyq_type`,
        {
          method: "POST",

          headers:
            supabaseHeaders({
              "Content-Type":
                "application/json",

              Prefer:
                "resolution=merge-duplicates,return=representation",
            }),

          body:
            JSON.stringify(payload),
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

/* -------------------------------------------------------
   DELETE PROGRESS
------------------------------------------------------- */

export async function DELETE(request) {
  try {
    const authenticated =
      await getAuthenticatedUser(request);

    if (!authenticated?.user?.id) {
      return jsonError(
        "Authentication required",
        401
      );
    }

    const user =
      authenticated.user;

    const { searchParams } =
      new URL(request.url);

    const pyqId =
      searchParams.get(
        "pyq_id"
      );

    const pyqType =
      searchParams.get(
        "pyq_type"
      );

    if (
      !pyqId ||
      ![
        "prelims",
        "mains",
      ].includes(pyqType)
    ) {
      return jsonError(
        "Invalid PYQ parameters",
        400
      );
    }

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/pyq_user_progress?user_id=eq.${encodeURIComponent(
          user.id
        )}&pyq_id=eq.${encodeURIComponent(
          pyqId
        )}&pyq_type=eq.${encodeURIComponent(
          pyqType
        )}`,
        {
          method: "DELETE",

          headers:
            supabaseHeaders({
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
