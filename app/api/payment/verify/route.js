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

const CASHFREE_BASE_URL =
  CASHFREE_ENV === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

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
 * ----------------------------------------
 * AUTHENTICATION
 * ----------------------------------------
 *
 * Priority:
 *
 * 1. Website:
 *    sambhav_session cookie
 *
 * 2. Telegram:
 *    Authorization: tma <initData>
 *
 * ----------------------------------------
 */

async function getAuthenticatedUser(request) {
  /*
   * First try central SAMBHAV auth.
   *
   * This supports:
   * - sambhav_session
   * - Telegram fallback
   */

  try {
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://sambhavupsc.vercel.app";

    const forwardedHeaders = {};

    const cookie =
      request.headers.get("cookie");

    const authorization =
      request.headers.get("authorization");

    if (cookie) {
      forwardedHeaders.cookie = cookie;
    }

    if (authorization) {
      forwardedHeaders.authorization =
        authorization;
    }

    const authResponse =
      await fetch(
        `${origin}/api/auth/me`,
        {
          method: "GET",

          headers:
            forwardedHeaders,

          cache: "no-store",
        }
      );

    if (authResponse.ok) {
      const authData =
        await authResponse.json();

      if (authData?.user?.id) {
        return {
          user: authData.user,

          authMethod:
            authData.authMethod ||
            null,
        };
      }
    }
  } catch (error) {
    console.error(
      "Central authentication lookup failed:",
      error
    );
  }

  /*
   * ----------------------------------------
   * Direct Telegram fallback
   * ----------------------------------------
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
        const userResponse =
          await fetch(
            `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${encodeURIComponent(
              telegramUser.id
            )}&select=id,telegram_id,email,first_name,last_name,username,status,plan&limit=1`,
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

        if (userResponse.ok) {
          const users =
            await userResponse.json();

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
      "Telegram authentication fallback failed:",
      error
    );
  }

  return null;
}

/*
 * ----------------------------------------
 * POST
 * ----------------------------------------
 */

export async function POST(request) {
  try {
    /*
     * ----------------------------------------
     * CONFIG CHECK
     * ----------------------------------------
     */

    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase configuration missing.",
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
            "Cashfree configuration missing.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * AUTHENTICATION
     * ----------------------------------------
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

    const user =
      auth.user;

    /*
     * ----------------------------------------
     * USER STATUS
     * ----------------------------------------
     */

    if (
      user.status !== "approved"
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
     * REQUEST
     * ----------------------------------------
     */

    const body =
      await request
        .json()
        .catch(() => ({}));

    const orderId =
      body?.order_id;

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * FIND EXACT USER'S SUBSCRIPTION
     * ----------------------------------------
     *
     * Important:
     * Frontend cannot verify someone else's
     * order because order is matched with
     * authenticated user ID.
     */

    const subscriptionResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
          user.id
        )}&order_id=eq.${encodeURIComponent(
          orderId
        )}&select=id,user_id,plan,status,payment_id,order_id,amount,started_at,expires_at&limit=1`,
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

    if (
      !subscriptionResponse.ok
    ) {
      console.error(
        "Subscription lookup failed:",
        await subscriptionResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Unable to find payment subscription.",
        },
        { status: 500 }
      );
    }

    const subscriptions =
      await subscriptionResponse.json();

    if (
      !subscriptions?.length
    ) {
      return NextResponse.json(
        {
          error:
            "Payment order not found in SAMBHAV.",
        },
        { status: 404 }
      );
    }

    const subscription =
      subscriptions[0];

    /*
     * ----------------------------------------
     * ALREADY ACTIVE
     * ----------------------------------------
     */

    if (
      subscription.status ===
      "active"
    ) {
      return NextResponse.json({
        success: true,

        status:
          "active",

        message:
          "Premium subscription already active.",

        subscription,
      });
    }

    /*
     * Only pending payment can be activated.
     */

    if (
      subscription.status !==
      "pending"
    ) {
      return NextResponse.json({
        success: false,

        status:
          subscription.status ||
          "failed",

        message:
          "This payment order is no longer pending.",
      });
    }

    /*
     * ----------------------------------------
     * PLAN VALIDATION
     * ----------------------------------------
     */

    const selectedPlan =
      PLANS[subscription.plan];

    if (!selectedPlan) {
      return NextResponse.json(
        {
          error:
            "Invalid subscription plan.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * DATABASE AMOUNT VALIDATION
     * ----------------------------------------
     *
     * Never trust frontend amount.
     */

    if (
      Number(subscription.amount) !==
      Number(selectedPlan.amount)
    ) {
      console.error(
        "Subscription amount mismatch:",
        {
          orderId,
          databaseAmount:
            subscription.amount,
          expectedAmount:
            selectedPlan.amount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount does not match the selected Premium plan.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * CASHFREE VERIFICATION
     * ----------------------------------------
     *
     * Directly ask Cashfree for all payments
     * belonging to this exact order.
     */

    const paymentsResponse =
      await fetch(
        `${CASHFREE_BASE_URL}/pg/orders/${encodeURIComponent(
          orderId
        )}/payments`,
        {
          method: "GET",

          headers: {
            "x-client-id":
              CASHFREE_APP_ID,

            "x-client-secret":
              CASHFREE_SECRET_KEY,

            "x-api-version":
              "2025-01-01",

            Accept:
              "application/json",
          },

          cache: "no-store",
        }
      );

    const payments =
      await paymentsResponse
        .json()
        .catch(() => null);

    if (
      !paymentsResponse.ok
    ) {
      console.error(
        "Cashfree payment verification error:",
        payments
      );

      return NextResponse.json(
        {
          error:
            payments?.message ||
            "Unable to verify payment with Cashfree.",
        },
        { status: 502 }
      );
    }

    if (
      !Array.isArray(payments)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Cashfree payment response.",
        },
        { status: 502 }
      );
    }

    /*
     * ----------------------------------------
     * SUCCESS PAYMENT
     * ----------------------------------------
     */

    const successfulPayment =
      payments.find(
        (payment) =>
          payment?.payment_status ===
          "SUCCESS"
      );

    /*
     * ----------------------------------------
     * PAYMENT NOT SUCCESSFUL
     * ----------------------------------------
     */

    if (!successfulPayment) {
      const pendingPayment =
        payments.find(
          (payment) =>
            payment?.payment_status ===
            "PENDING"
        );

      if (pendingPayment) {
        return NextResponse.json({
          success: false,

          status:
            "pending",

          message:
            "Payment is still pending.",
        });
      }

      return NextResponse.json({
        success: false,

        status:
          "failed",

        message:
          "Payment was not successful.",
      });
    }

    /*
     * ----------------------------------------
     * CASHFREE AMOUNT VALIDATION
     * ----------------------------------------
     */

    const paidAmount =
      Number(
        successfulPayment.payment_amount
      );

    if (
      !Number.isFinite(
        paidAmount
      ) ||
      paidAmount !==
        Number(selectedPlan.amount)
    ) {
      console.error(
        "Cashfree payment amount mismatch:",
        {
          orderId,

          paidAmount,

          expectedAmount:
            selectedPlan.amount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Verified payment amount does not match the Premium plan.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * PAYMENT ID
     * ----------------------------------------
     */

    const paymentId =
      successfulPayment.cf_payment_id
        ? String(
            successfulPayment.cf_payment_id
          )
        : null;

    if (!paymentId) {
      return NextResponse.json(
        {
          error:
            "Cashfree payment ID missing.",
        },
        { status: 502 }
      );
    }

    /*
     * ----------------------------------------
     * PREMIUM DURATION
     * ----------------------------------------
     */

    const startedAt =
      new Date();

    const expiresAt =
      new Date(
        startedAt.getTime() +
          selectedPlan.durationDays *
            24 *
            60 *
            60 *
            1000
      );

    /*
     * ----------------------------------------
     * ACTIVATE PAID SUBSCRIPTION
     * ----------------------------------------
     *
     * First activate the exact verified
     * payment order.
     */

    const activateResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${encodeURIComponent(
          subscription.id
        )}&user_id=eq.${encodeURIComponent(
          user.id
        )}&status=eq.pending`,
        {
          method: "PATCH",

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
            status:
              "active",

            payment_id:
              paymentId,

            started_at:
              startedAt.toISOString(),

            expires_at:
              expiresAt.toISOString(),
          }),
        }
      );

    if (
      !activateResponse.ok
    ) {
      console.error(
        "Subscription activation failed:",
        await activateResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Payment verified but subscription activation failed.",
        },
        { status: 500 }
      );
    }

    const activatedSubscriptions =
      await activateResponse
        .json()
        .catch(() => []);

    /*
     * ----------------------------------------
     * DEACTIVATE DEMO
     * ----------------------------------------
     */

    const demoDeactivateResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
          user.id
        )}&plan=eq.demo&status=eq.active`,
        {
          method: "PATCH",

          headers: {
            apikey:
              SUPABASE_SECRET_KEY,

            Authorization:
              `Bearer ${SUPABASE_SECRET_KEY}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=minimal",
          },

          body: JSON.stringify({
            status:
              "expired",

            expires_at:
              startedAt.toISOString(),
          }),
        }
      );

    if (
      !demoDeactivateResponse.ok
    ) {
      /*
       * Paid subscription is already active,
       * so don't tell the user payment failed.
       *
       * Just log the cleanup issue.
       */

      console.error(
        "Previous demo deactivation failed:",
        await demoDeactivateResponse.text()
      );
    }

    /*
     * ----------------------------------------
     * UPDATE USER PLAN
     * ----------------------------------------
     */

    const userPlanResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PATCH",

          headers: {
            apikey:
              SUPABASE_SECRET_KEY,

            Authorization:
              `Bearer ${SUPABASE_SECRET_KEY}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=minimal",
          },

          body: JSON.stringify({
            plan:
              "premium",
          }),
        }
      );

    if (
      !userPlanResponse.ok
    ) {
      /*
       * Subscription is already active.
       * Log this separately rather than
       * pretending payment verification failed.
       */

      console.error(
        "User Premium plan update failed:",
        await userPlanResponse.text()
      );
    }

    /*
     * ----------------------------------------
     * FINAL SUCCESS
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      status:
        "active",

      message:
        "Payment verified and Premium activated.",

      order_id:
        orderId,

      payment_id:
        paymentId,

      plan:
        subscription.plan,

      amount:
        selectedPlan.amount,

      expires_at:
        expiresAt.toISOString(),

      subscription:
        activatedSubscriptions?.[0] ||
        null,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Internal payment verification error.",
      },
      { status: 500 }
    );
  }
}
