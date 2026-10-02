import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
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

export async function POST(request) {
  try {
    /*
     * ----------------------------------------
     * CASHFREE CONFIG CHECK
     * ----------------------------------------
     */

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
     * ----------------------------------------
     * TELEGRAM AUTH
     * ----------------------------------------
     */

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("tma ")
    ) {
      return NextResponse.json(
        {
          error:
            "Telegram authentication required.",
        },
        { status: 401 }
      );
    }

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
            "Invalid Telegram authentication.",
        },
        { status: 401 }
      );
    }

    /*
     * ----------------------------------------
     * REQUEST BODY
     * ----------------------------------------
     */

    const body =
      await request.json();

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
     * ----------------------------------------
     * FIND USER
     * ----------------------------------------
     */

    const userResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUser.id}&select=id,telegram_id,first_name,username,status,plan`,
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

    if (!userResponse.ok) {
      console.error(
        "User lookup failed:",
        await userResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify user.",
        },
        { status: 500 }
      );
    }

    const users =
      await userResponse.json();

    if (
      !users ||
      !users.length
    ) {
      return NextResponse.json(
        {
          error:
            "User not found.",
        },
        { status: 404 }
      );
    }

    const user =
      users[0];

    /*
     * ----------------------------------------
     * APPROVAL CHECK
     * ----------------------------------------
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
     * ----------------------------------------
     * ACTIVE SUBSCRIPTION CHECK
     * ----------------------------------------
     *
     * IMPORTANT:
     *
     * Active DEMO
     *     -> Paid purchase ALLOWED
     *
     * Active PAID subscription
     *     -> New purchase BLOCKED
     *
     * ----------------------------------------
     */

    const activeSubscriptionResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&status=eq.active&expires_at=gt.${encodeURIComponent(
          new Date().toISOString()
        )}&select=id,plan,status,expires_at,amount&limit=1`,
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

    if (
      activeSubscriptionResponse.ok
    ) {
      const activeSubscriptions =
        await activeSubscriptionResponse.json();

      if (
        activeSubscriptions?.length
      ) {
        const activeSubscription =
          activeSubscriptions[0];

        /*
         * Active DEMO:
         *
         * Allow user to upgrade
         * to a paid Premium plan.
         */
        if (
          activeSubscription.plan ===
          "demo"
        ) {
          // Continue to Cashfree order creation.
        } else {
          /*
           * Active PAID subscription:
           *
           * Block duplicate purchase.
           */
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
      }
    }

    /*
     * ----------------------------------------
     * CREATE UNIQUE ORDER ID
     * ----------------------------------------
     */

    const orderId =
      `sambhav_${plan}_${user.id.slice(
        0,
        8
      )}_${Date.now()}`;

    /*
     * ----------------------------------------
     * RETURN URL
     * ----------------------------------------
     */

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "https://sambhavupsc.vercel.app";

    const returnUrl =
      `${baseUrl}/premium/payment/success?order_id={order_id}`;

    /*
     * ----------------------------------------
     * CASHFREE ENDPOINT
     * ----------------------------------------
     */

    const cashfreeUrl =
      CASHFREE_ENV ===
      "production"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    /*
     * ----------------------------------------
     * CREATE CASHFREE ORDER
     * ----------------------------------------
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
                String(
                  user.telegram_id
                ),

              customer_name:
                user.first_name ||
                user.username ||
                "SAMBHAV User",

              /*
               * Cashfree requires
               * customer phone.
               *
               * This is only a placeholder
               * for Sandbox testing.
               */
              customer_phone:
                "9999999999",
            },

            order_meta: {
  return_url: returnUrl,
  notify_url: `${baseUrl}/api/payment/webhook`,
},

            order_note:
              `SAMBHAV UPSC ${plan} Premium`,
          }),
        }
      );

    const cashfreeData =
      await cashfreeResponse.json();

    /*
     * ----------------------------------------
     * CASHFREE ERROR
     * ----------------------------------------
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
     * ----------------------------------------
     * PENDING SUBSCRIPTION EXPIRY
     * ----------------------------------------
     */

    const expiresAt =
      new Date(
        Date.now() +
          selectedPlan.durationDays *
            24 *
            60 *
            60 *
            1000
      ).toISOString();

    /*
     * ----------------------------------------
     * CREATE PENDING SUBSCRIPTION
     * ----------------------------------------
     */

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

            plan:
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
              new Date().toISOString(),

            expires_at:
              expiresAt,
          }),
        }
      );

    /*
     * ----------------------------------------
     * SUBSCRIPTION INSERT ERROR
     * ----------------------------------------
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
     * ----------------------------------------
     * SUCCESS
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      order_id:
        orderId,

      plan:
        plan,

      amount:
        selectedPlan.amount,

      payment_session_id:
        cashfreeData.payment_session_id,

      environment:
        CASHFREE_ENV,
    });
  } catch (error) {
    /*
     * ----------------------------------------
     * INTERNAL ERROR
     * ----------------------------------------
     */

    console.error(
      "Create payment order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal payment order creation error.",
      },
      { status: 500 }
    );
  }
}
