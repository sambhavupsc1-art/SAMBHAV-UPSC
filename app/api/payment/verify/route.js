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

export async function POST(request) {
  try {
    /*
     * ----------------------------------------
     * AUTHENTICATION
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
      validateTelegramInitData(initData);

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
     * CASHFREE CONFIG
     * ----------------------------------------
     */

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
     * REQUEST
     * ----------------------------------------
     */

    const body =
      await request.json();

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
     * FIND USER
     * ----------------------------------------
     */

    const userResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUser.id}&select=id,telegram_id,first_name,username,status,plan&limit=1`,
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

    if (!userResponse.ok) {
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

    if (!users?.length) {
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
     * FIND OUR PENDING SUBSCRIPTION
     * ----------------------------------------
     */

    const subscriptionResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&order_id=eq.${encodeURIComponent(orderId)}&select=id,user_id,plan,status,payment_id,order_id,amount,started_at,expires_at&limit=1`,
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

    if (!subscriptions?.length) {
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
     * Already activated.
     */

    if (
      subscription.status ===
      "active"
    ) {
      return NextResponse.json({
        success: true,
        status: "active",
        message:
          "Premium subscription already active.",
        subscription,
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
     * Verify amount from our database,
     * never trust frontend amount.
     */

    if (
      Number(subscription.amount) !==
      Number(selectedPlan.amount)
    ) {
      return NextResponse.json(
        {
          error:
            "Payment amount does not match the selected plan.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * CASHFREE PAYMENT STATUS
     * ----------------------------------------
     *
     * Cashfree:
     * GET /pg/orders/{order_id}/payments
     *
     * ----------------------------------------
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

            Accept:
              "application/json",

            "x-api-version":
              "2025-01-01",
          },

          cache: "no-store",
        }
      );

    const payments =
      await paymentsResponse.json();

    if (
      !paymentsResponse.ok
    ) {
      console.error(
        "Cashfree payment status error:",
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
     * FIND SUCCESSFUL PAYMENT
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
          status: "pending",
          message:
            "Payment is still pending.",
        });
      }

      /*
       * If Cashfree has no SUCCESS
       * payment, do NOT activate Premium.
       */

      return NextResponse.json({
        success: false,
        status: "failed",
        message:
          "Payment was not successful.",
      });
    }

    /*
     * ----------------------------------------
     * VERIFY PAYMENT AMOUNT
     * ----------------------------------------
     */

    const paidAmount =
      Number(
        successfulPayment.payment_amount
      );

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount !==
        Number(selectedPlan.amount)
    ) {
      console.error(
        "Payment amount mismatch:",
        {
          orderId,
          paidAmount,
          expected:
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
     * EXPIRY
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
     * First:
     * deactivate previous DEMO.
     */

    const demoDeactivateResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&plan=eq.demo&status=eq.active`,
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
      console.error(
        "Demo deactivation failed:",
        await demoDeactivateResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Payment verified but previous demo could not be updated.",
        },
        { status: 500 }
      );
    }

    /*
     * Activate the exact pending
     * paid subscription.
     */

    const activateResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${subscription.id}&user_id=eq.${user.id}&status=eq.pending`,
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
      await activateResponse.json();

    /*
     * ----------------------------------------
     * UPDATE USER PLAN
     * ----------------------------------------
     */

    const userPlanResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
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
      console.error(
        "User Premium plan update failed:",
        await userPlanResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Subscription activated but user Premium status update failed.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * FINAL RESPONSE
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
          "Internal payment verification error.",
      },
      { status: 500 }
    );
  }
}
