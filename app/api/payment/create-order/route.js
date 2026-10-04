import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "sandbox";

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

async function getAuthenticatedUser(request) {
  /*
   * PRIMARY AUTHENTICATION
   *
   * /api/auth/me handles:
   * - sambhav_session
   * - Telegram tma
   */

  try {
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://sambhavupsc.vercel.app";

    const headers = {};

    const cookie = request.headers.get("cookie");
    const authorization =
      request.headers.get("authorization");

    if (cookie) {
      headers.cookie = cookie;
    }

    if (authorization) {
      headers.authorization = authorization;
    }

    const response = await fetch(
      `${origin}/api/auth/me`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    if (response.ok) {
      const data =
        await response.json();

      if (data?.user?.id) {
        return {
          user: data.user,
          authMethod:
            data.authMethod || null,
        };
      }
    }
  } catch (error) {
    console.error(
      "Central auth lookup failed:",
      error
    );
  }

  /*
   * TELEGRAM FALLBACK
   */

  try {
    const authorization =
      request.headers.get("authorization");

    if (
      authorization &&
      authorization.startsWith("tma ")
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
            )}&select=id,telegram_id,email,first_name,last_name,username,status,plan`,
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
      "Telegram auth fallback failed:",
      error
    );
  }

  return null;
}

async function getActiveSubscription(
  userId
) {
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
    return null;
  }

  const subscriptions =
    await response.json();

  return subscriptions?.length
    ? subscriptions[0]
    : null;
}

export async function POST(
  request
) {
  try {
    /*
     * CONFIGURATION
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
     * AUTHENTICATION
     */

    const auth =
      await getAuthenticatedUser(
        request
      );

    if (!auth?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Authentication required. Please login to SAMBHAV and try again.",
        },
        { status: 401 }
      );
    }

    const user = auth.user;

    /*
     * PLAN
     */

    const body =
      await request
        .json()
        .catch(() => ({}));

    const plan = body?.plan;

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
     * APPROVAL
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
     * ACTIVE SUBSCRIPTION
     */

    const activeSubscription =
      await getActiveSubscription(
        user.id
      );

    /*
     * DEMO → PAID UPGRADE
     *
     * Demo users ARE allowed to
     * purchase a paid Premium plan.
     *
     * Paid Premium users cannot
     * purchase another paid plan
     * while their current plan is active.
     */

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
     * ORDER ID
     */

    const orderId =
      `sambhav_${plan}_${String(
        user.id
      ).slice(0, 8)}_${Date.now()}`;

    /*
     * RETURN URL
     */

    const baseUrl =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      request.headers.get(
        "origin"
      ) ||
      "https://sambhavupsc.vercel.app";

    const returnUrl =
      `${baseUrl}/premium/payment/success?order_id={order_id}`;

    /*
     * CASHFREE ENDPOINT
     */

    const cashfreeUrl =
      CASHFREE_ENV ===
      "production"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    /*
     * CUSTOMER
     */

    const customerId =
      user.telegram_id
        ? `tg_${user.telegram_id}`
        : `sambhav_${user.id}`;

    const customerName =
      user.first_name ||
      user.name ||
      user.username ||
      user.email ||
      "SAMBHAV User";

    /*
     * CURRENT SIGNUP DOES NOT
     * COLLECT PHONE NUMBER
     */

    const customerPhone =
      String(
        user.phone || ""
      ).replace(/\D/g, "") ||
      "9999999999";

    /*
     * CREATE CASHFREE ORDER
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
     * CASHFREE ERROR
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
     * PAYMENT SESSION CHECK
     */

    if (
      !cashfreeData?.payment_session_id
    ) {
      console.error(
        "Missing Cashfree payment session:",
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
     * PENDING SUBSCRIPTION
     *
     * The subscription stays pending
     * until payment/webhook verification.
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
     * SUCCESS
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
