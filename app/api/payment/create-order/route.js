import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const CASHFREE_APP_ID =
  process.env.CASHFREE_APP_ID;

const CASHFREE_SECRET_KEY =
  process.env.CASHFREE_SECRET_KEY;

const CASHFREE_ENV =
  process.env.CASHFREE_ENV || "sandbox";

const PLANS = {
  monthly: {
    amount: 99,
    durationDays: 30,
  },

  quarterly: {
    amount: 399,
    durationDays: 90,
  },

  annual: {
    amount: 999,
    durationDays: 365,
  },
};

/*
 * ========================================================
 * VERIFY EMAIL SESSION
 * Same session format as /api/auth/me
 * ========================================================
 */

function verifyEmailSession(token) {
  try {
    const secret =
      process.env.AUTH_SESSION_SECRET;

    if (!secret || !token) {
      return null;
    }

    const parts =
      token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] =
      parts;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(payload)
        .digest("base64url");

    if (
      signature.length !==
      expectedSignature.length
    ) {
      return null;
    }

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(
          expectedSignature
        )
      )
    ) {
      return null;
    }

    const data =
      JSON.parse(
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

    if (!data.userId) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(
      "Payment session verification error:",
      error
    );

    return null;
  }
}

/*
 * ========================================================
 * GET USER BY ID
 * ========================================================
 */

async function getUserById(userId) {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY ||
      !userId
    ) {
      return null;
    }

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
          userId
        )}&select=id,email,telegram_id,first_name,last_name,username,status,plan`,
        {
          method: "GET",

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
        "Payment user lookup failed:",
        await response.text()
      );

      return null;
    }

    const users =
      await response.json();

    return users?.length
      ? users[0]
      : null;
  } catch (error) {
    console.error(
      "Payment user lookup exception:",
      error
    );

    return null;
  }
}

/*
 * ========================================================
 * GET SESSION COOKIE
 *
 * Priority:
 * 1. request.cookies
 * 2. next/headers cookies()
 *
 * This makes the payment route robust across
 * Next.js Route Handler environments.
 * ========================================================
 */

async function getSessionToken(request) {
  /*
   * ----------------------------------------------
   * 1. DIRECT REQUEST COOKIE
   * ----------------------------------------------
   */

  try {
    const directCookie =
      request?.cookies?.get(
        "sambhav_session"
      );

    if (directCookie?.value) {
      return directCookie.value;
    }
  } catch (error) {
    console.error(
      "Direct request cookie read failed:",
      error
    );
  }

  /*
   * ----------------------------------------------
   * 2. NEXT.JS COOKIE STORE FALLBACK
   * ----------------------------------------------
   */

  try {
    const cookieStore =
      await cookies();

    const sessionCookie =
      cookieStore.get(
        "sambhav_session"
      );

    if (sessionCookie?.value) {
      return sessionCookie.value;
    }
  } catch (error) {
    console.error(
      "Next cookies() read failed:",
      error
    );
  }

  return null;
}

/*
 * ========================================================
 * AUTHENTICATED USER
 * ========================================================
 */

async function getAuthenticatedUser(request) {
  /*
   * ======================================================
   * WEBSITE / EMAIL SESSION
   * ======================================================
   */

  try {
    const sessionToken =
      await getSessionToken(
        request
      );

    if (sessionToken) {
      const session =
        verifyEmailSession(
          sessionToken
        );

      if (session?.userId) {
        const user =
          await getUserById(
            session.userId
          );

        if (user) {
          return {
            user,
            authMethod: "email",
          };
        }
      }
    }
  } catch (error) {
    console.error(
      "Website authentication error:",
      error
    );
  }

  /*
   * ======================================================
   * TELEGRAM FALLBACK
   * ======================================================
   */

  try {
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

      if (telegramUser?.id) {
        const response =
          await fetch(
            `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(
              telegramUser.id
            )}&select=id,email,telegram_id,first_name,last_name,username,status,plan&limit=1`,
            {
              method: "GET",

              headers: {
                apikey:
                  SUPABASE_SECRET_KEY,

                Authorization:
                  `Bearer ${SUPABASE_SECRET_KEY}`,
              },

              cache: "no-store",
            }
          );

        if (response.ok) {
          const users =
            await response.json();

          if (users?.length) {
            return {
              user: users[0],
              authMethod:
                "telegram",
            };
          }
        }
      }
    }
  } catch (error) {
    console.error(
      "Telegram authentication error:",
      error
    );
  }

  return null;
}

/*
 * ========================================================
 * ACTIVE SUBSCRIPTION
 * ========================================================
 */

async function getActiveSubscription(
  userId
) {
  try {
    const now =
      new Date().toISOString();

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
          userId
        )}&status=eq.active&expires_at=gt.${encodeURIComponent(
          now
        )}&select=id,plan,status,expires_at,amount&order=expires_at.desc&limit=1`,
        {
          method: "GET",

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
        "Active subscription lookup failed:",
        await response.text()
      );

      return null;
    }

    const subscriptions =
      await response.json();

    return subscriptions?.length
      ? subscriptions[0]
      : null;
  } catch (error) {
    console.error(
      "Active subscription lookup exception:",
      error
    );

    return null;
  }
}

/*
 * ========================================================
 * POST
 * ========================================================
 */

export async function POST(request) {
  try {
    /*
     * ====================================================
     * CONFIGURATION
     * ====================================================
     */

    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase payment configuration missing.",
        },
        { status: 500 }
      );
    }

    if (
      !CASHFREE_APP_ID ||
      !CASHFREE_SECRET_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "Cashfree payment configuration missing.",
        },
        { status: 500 }
      );
    }

    /*
     * ====================================================
     * AUTHENTICATION
     * ====================================================
     */

    const auth =
      await getAuthenticatedUser(
        request
      );

    if (!auth?.user?.id) {
      console.error(
        "CREATE ORDER AUTH FAILED",
        {
          hasRequestCookies:
            Boolean(
              request?.cookies
            ),

          hasSessionCookie:
            Boolean(
              request?.cookies?.get(
                "sambhav_session"
              )?.value
            ),

          authHeader:
            request.headers.get(
              "authorization"
            )
              ? "present"
              : "missing",
        }
      );

      return NextResponse.json(
        {
          error:
            "Authentication required. Please login to SAMBHAV and try again.",
        },
        { status: 401 }
      );
    }

    const user =
      auth.user;

    /*
     * ====================================================
     * PLAN
     * ====================================================
     */

    const body =
      await request
        .json()
        .catch(() => ({}));

    const plan =
      body?.plan;

    if (
      !plan ||
      !PLANS[plan]
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Premium plan.",
        },
        { status: 400 }
      );
    }

    const selectedPlan =
      PLANS[plan];

    /*
     * ====================================================
     * APPROVAL
     * ====================================================
     */

    if (
      user.status !==
      "approved"
    ) {
      return NextResponse.json(
        {
          error:
            "Your SAMBHAV UPSC account is not approved yet.",
        },
        { status: 403 }
      );
    }

    /*
     * ====================================================
     * ACTIVE SUBSCRIPTION
     * ====================================================
     *
     * IMPORTANT:
     *
     * Active DEMO is allowed to upgrade.
     *
     * Active PAID subscription is blocked.
     * ====================================================
     */

    const activeSubscription =
      await getActiveSubscription(
        user.id
      );

    const activePlan =
      String(
        activeSubscription?.plan ||
          ""
      ).toLowerCase();

    if (
      activeSubscription &&
      activePlan !== "demo"
    ) {
      return NextResponse.json(
        {
          error:
            "You already have an active Premium subscription.",

          subscription:
            activeSubscription,
        },
        { status: 409 }
      );
    }

    /*
     * ====================================================
     * CASHFREE ORDER ID
     * ====================================================
     */

    const orderId =
      `sambhav_${plan}_${String(
        user.id
      ).slice(0, 8)}_${Date.now()}`;

    /*
     * ====================================================
     * BASE URL
     * ====================================================
     */

    const baseUrl =
      (
        process.env
          .NEXT_PUBLIC_APP_URL ||
        "https://sambhavupsc.vercel.app"
      ).replace(
        /\/$/,
        ""
      );

    const returnUrl =
      `${baseUrl}/premium/payment/success?order_id={order_id}`;

    /*
     * ====================================================
     * CASHFREE ENVIRONMENT
     * ====================================================
     */

    const cashfreeUrl =
      String(
        CASHFREE_ENV
      ).toLowerCase() ===
      "production"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    /*
     * ====================================================
     * CUSTOMER
     * ====================================================
     */

    const customerId =
      user.telegram_id
        ? `tg_${user.telegram_id}`
        : `sambhav_${user.id}`;

    const customerName =
      user.first_name ||
      user.username ||
      user.email ||
      "SAMBHAV User";

    const customerPhone =
      String(
        user.phone || ""
      ).replace(/\D/g, "") ||
      "9999999999";

    /*
     * ====================================================
     * CREATE CASHFREE ORDER
     * ====================================================
     */

    const cashfreeResponse =
      await fetch(
        cashfreeUrl,
        {
          method: "POST",

          headers: {
            "x-client-id":
              CASHFREE_APP_ID,

            "x-client-secret":
              CASHFREE_SECRET_KEY,

            "x-api-version":
              "2025-01-01",

            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            order_id:
              orderId,

            order_amount:
              selectedPlan.amount,

            order_currency:
              "INR",

            customer_details: {
              customer_id:
                customerId,

              customer_name:
                customerName,

              customer_email:
                user.email ||
                undefined,

              customer_phone:
                customerPhone,
            },

            order_meta: {
              return_url:
                returnUrl,

              notify_url:
                `${baseUrl}/api/payment/webhook`,
            },

            order_note:
              `SAMBHAV UPSC ${plan} Premium`,
          }),
        }
      );

    const cashfreeData =
      await cashfreeResponse
        .json()
        .catch(() => ({}));

    /*
     * ====================================================
     * CASHFREE ERROR
     * ====================================================
     */

    if (
      !cashfreeResponse.ok
    ) {
      console.error(
        "Cashfree create order error:",
        cashfreeData
      );

      return NextResponse.json(
        {
          error:
            cashfreeData?.message ||
            cashfreeData?.type ||
            "Cashfree order creation failed.",
        },
        { status: 502 }
      );
    }

    /*
     * ====================================================
     * PAYMENT SESSION CHECK
     * ====================================================
     */

    if (
      !cashfreeData?.payment_session_id
    ) {
      console.error(
        "Cashfree payment session missing:",
        cashfreeData
      );

      return NextResponse.json(
        {
          error:
            "Cashfree payment session was not returned.",
        },
        { status: 502 }
      );
    }

    /*
     * ====================================================
     * PENDING SUBSCRIPTION
     * ====================================================
     */

    const now =
      new Date();

    const expiresAt =
      new Date(
        now.getTime() +
          selectedPlan.durationDays *
            24 *
            60 *
            60 *
            1000
      ).toISOString();

    const subscriptionResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions`,
        {
          method: "POST",

          headers: {
            apikey:
              SUPABASE_SECRET_KEY,

            Authorization:
              `Bearer ${SUPABASE_SECRET_KEY}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=representation",
          },

          body: JSON.stringify({
            user_id:
              user.id,

            plan,

            status:
              "pending",

            payment_id:
              null,

            order_id:
              orderId,

            amount:
              selectedPlan.amount,

            started_at:
              now.toISOString(),

            expires_at:
              expiresAt,
          }),
        }
      );

    /*
     * ====================================================
     * SUBSCRIPTION INSERT ERROR
     * ====================================================
     */

    if (
      !subscriptionResponse.ok
    ) {
      console.error(
        "Subscription insert failed:",
        await subscriptionResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Payment order created but subscription record could not be created.",

          order_id:
            orderId,
        },
        { status: 500 }
      );
    }

    /*
     * ====================================================
     * SUCCESS
     * ====================================================
     */

    return NextResponse.json({
      success: true,

      order_id:
        orderId,

      plan,

      amount:
        selectedPlan.amount,

      payment_session_id:
        cashfreeData.payment_session_id,

      environment:
        CASHFREE_ENV,
    });
  } catch (error) {
    console.error(
      "Create payment order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Internal payment order creation error.",
      },
      { status: 500 }
    );
  }
}
