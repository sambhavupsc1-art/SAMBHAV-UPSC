import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

/*
 * ------------------------------------------------
 * VERIFY EMAIL SESSION
 * ------------------------------------------------
 */
function verifyEmailSession(token) {
  try {
    const secret =
      process.env.AUTH_SESSION_SECRET;

    if (!secret || !token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    if (
      signature.length !==
        expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(
        payload,
        "base64url"
      ).toString("utf8")
    );

    if (
      !data.exp ||
      Date.now() > data.exp
    ) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(
      "Session verification error:",
      error
    );

    return null;
  }
}

/*
 * ------------------------------------------------
 * GET USER BY ID
 * ------------------------------------------------
 */
async function getUserById(userId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
      userId
    )}&select=id,email,telegram_id,first_name,username,status,plan,created_at`,
    {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization:
          `Bearer ${SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error(
      "User lookup error:",
      await response.text()
    );

    return null;
  }

  const users =
    await response.json();

  return users.length
    ? users[0]
    : null;
}

/*
 * ------------------------------------------------
 * GET ACTIVE SUBSCRIPTION
 * ------------------------------------------------
 */
async function getActiveSubscription(userId) {
  const now =
    new Date().toISOString();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
      userId
    )}&status=eq.active&expires_at=gt.${encodeURIComponent(
      now
    )}&select=id,plan,status,amount,started_at,expires_at,order_id,payment_id&order=expires_at.desc&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization:
          `Bearer ${SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error(
      "Subscription lookup error:",
      await response.text()
    );

    return null;
  }

  const subscriptions =
    await response.json();

  return subscriptions.length
    ? subscriptions[0]
    : null;
}

/*
 * ------------------------------------------------
 * GET ADMIN STATUS
 * ------------------------------------------------
 */
async function getAdminStatus({
  userId = null,
  telegramId = null,
}) {
  /*
   * WEBSITE / EMAIL ADMIN
   */
  if (userId) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(
        userId
      )}&is_active=eq.true&select=id,user_id,telegram_id`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization:
            `Bearer ${SUPABASE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Admin user_id lookup error:",
        await response.text()
      );

      return false;
    }

    const admins =
      await response.json();

    if (admins.length > 0) {
      return true;
    }
  }

  /*
   * LEGACY TELEGRAM ADMIN
   */
  if (telegramId) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_users?telegram_id=eq.${encodeURIComponent(
        telegramId
      )}&is_active=eq.true&select=id,user_id,telegram_id`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization:
            `Bearer ${SUPABASE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Admin telegram_id lookup error:",
        await response.text()
      );

      return false;
    }

    const admins =
      await response.json();

    return admins.length > 0;
  }

  return false;
}

/*
 * ========================================================
 * GET
 * ========================================================
 */
export async function GET(request) {
  try {
    /*
     * ------------------------------------------------
     * ENVIRONMENT CHECK
     * ------------------------------------------------
     */
    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing",
        },
        { status: 500 }
      );
    }

    /*
     * ========================================================
     * 1. EMAIL SESSION — PRIMARY AUTHENTICATION
     * ========================================================
     *
     * IMPORTANT:
     *
     * Website login/payment always uses
     * sambhav_session.
     *
     * We intentionally check this BEFORE
     * Telegram authentication.
     *
     * Therefore, even if a Telegram tma header
     * is present or invalid, a valid email
     * session will still authenticate correctly.
     * ========================================================
     */

    const cookieStore =
      await cookies();

    const sessionCookie =
      cookieStore.get(
        "sambhav_session"
      );

    if (sessionCookie?.value) {
      /*
       * Verify session cookie.
       */
      const session =
        verifyEmailSession(
          sessionCookie.value
        );

      if (session?.userId) {
        /*
         * Get authenticated user.
         */
        const user =
          await getUserById(
            session.userId
          );

        if (user) {
          /*
           * Get active Premium subscription.
           */
          const subscription =
            await getActiveSubscription(
              user.id
            );

          /*
           * Check admin.
           */
          const isAdmin =
            await getAdminStatus({
              userId: user.id,
              telegramId:
                user.telegram_id,
            });

          return NextResponse.json({
            user,
            subscription,
            isAdmin,
            authMethod: "email",
          });
        }

        return NextResponse.json(
          {
            error:
              "User not found",
          },
          { status: 404 }
        );
      }

      /*
       * If cookie exists but is invalid,
       * continue to Telegram fallback.
       */
    }

    /*
     * ========================================================
     * 2. TELEGRAM LOGIN — FALLBACK ONLY
     * ========================================================
     */

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      authorization?.startsWith(
        "tma "
      )
    ) {
      const initData =
        authorization.slice(4);

      const telegramUser =
        validateTelegramInitData(
          initData
        );

      if (!telegramUser?.id) {
        return NextResponse.json(
          {
            error:
              "Invalid Telegram authentication",
          },
          { status: 401 }
        );
      }

      const response =
        await fetch(
          `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(
            telegramUser.id
          )}&select=id,email,telegram_id,first_name,username,status,plan,created_at`,
          {
            headers: {
              apikey:
                SUPABASE_SECRET_KEY,

              Authorization:
                `Bearer ${SUPABASE_SECRET_KEY}`,
            },

            cache: "no-store",
          }
        );

      if (!response.ok) {
        console.error(
          "Telegram user lookup error:",
          await response.text()
        );

        return NextResponse.json(
          {
            error:
              "Database error",
          },
          { status: 500 }
        );
      }

      const users =
        await response.json();

      if (users.length === 0) {
        return NextResponse.json(
          {
            error:
              "User not found",
          },
          { status: 404 }
        );
      }

      const user = users[0];

      /*
       * Get active Premium subscription.
       */
      const subscription =
        await getActiveSubscription(
          user.id
        );

      /*
       * Check admin.
       */
      const isAdmin =
        await getAdminStatus({
          userId: user.id,
          telegramId:
            telegramUser.id,
        });

      return NextResponse.json({
        user,
        subscription,
        isAdmin,
        authMethod: "telegram",
      });
    }

    /*
     * ========================================================
     * 3. NO AUTHENTICATION
     * ========================================================
     */

    return NextResponse.json(
      {
        error:
          "Authentication required",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error(
      "Auth error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Server error",
      },
      { status: 500 }
    );
  }
}
