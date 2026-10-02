import crypto from "crypto";
import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;

const CASHFREE_SECRET_KEY =
  process.env.CASHFREE_SECRET_KEY;

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
 * Cashfree webhook signature verification.
 *
 * IMPORTANT:
 * Cashfree signature is generated from:
 *
 * timestamp + rawBody
 *
 * using HMAC-SHA256.
 */
function verifyCashfreeSignature({
  timestamp,
  rawBody,
  signature,
}) {
  if (
    !timestamp ||
    !rawBody ||
    !signature ||
    !CASHFREE_SECRET_KEY
  ) {
    return false;
  }

  const signedPayload =
    `${timestamp}${rawBody}`;

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        CASHFREE_SECRET_KEY
      )
      .update(signedPayload)
      .digest("base64");

  /*
   * Timing-safe comparison.
   */
  try {
    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        signature,
        "utf8"
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    /*
     * ----------------------------------------
     * BASIC CONFIG CHECK
     * ----------------------------------------
     */

    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY ||
      !CASHFREE_SECRET_KEY
    ) {
      console.error(
        "Payment webhook configuration missing."
      );

      return NextResponse.json(
        {
          error:
            "Webhook configuration missing.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * READ RAW BODY
     * ----------------------------------------
     *
     * DO NOT use request.json()
     * before signature verification.
     */

    const rawBody =
      await request.text();

    /*
     * ----------------------------------------
     * CASHFREE HEADERS
     * ----------------------------------------
     */

    const signature =
      request.headers.get(
        "x-webhook-signature"
      );

    const timestamp =
      request.headers.get(
        "x-webhook-timestamp"
      );

    const webhookVersion =
      request.headers.get(
        "x-webhook-version"
      );

    console.log(
      "Cashfree webhook received:",
      {
        webhookVersion,
        hasSignature:
          Boolean(signature),
        hasTimestamp:
          Boolean(timestamp),
      }
    );

    /*
     * ----------------------------------------
     * VERIFY SIGNATURE
     * ----------------------------------------
     */

    const validSignature =
      verifyCashfreeSignature({
        timestamp,
        rawBody,
        signature,
      });

    if (!validSignature) {
      console.error(
        "Invalid Cashfree webhook signature."
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        { status: 401 }
      );
    }

    /*
     * ----------------------------------------
     * PARSE BODY
     * ----------------------------------------
     */

    let payload;

    try {
      payload =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid webhook JSON.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * EXTRACT PAYMENT DATA
     * ----------------------------------------
     */

    const type =
      payload?.type || "";

    const data =
      payload?.data || {};

    const order =
      data?.order || {};

    const payment =
      data?.payment || {};

    const orderId =
      order?.order_id ||
      data?.order_id ||
      null;

    const paymentStatus =
      payment?.payment_status ||
      null;

    const paymentId =
      payment?.cf_payment_id
        ? String(
            payment.cf_payment_id
          )
        : null;

    const paymentAmount =
      Number(
        payment?.payment_amount
      );

    /*
     * ----------------------------------------
     * LOG EVENT
     * ----------------------------------------
     */

    console.log(
      "Cashfree webhook event:",
      {
        type,
        orderId,
        paymentId,
        paymentStatus,
        paymentAmount,
      }
    );

    /*
     * ----------------------------------------
     * IGNORE EVENTS WITHOUT ORDER
     * ----------------------------------------
     */

    if (!orderId) {
      return NextResponse.json({
        success: true,
        message:
          "Webhook received without order ID.",
      });
    }

    /*
     * ----------------------------------------
     * ONLY SUCCESS PAYMENT
     * ----------------------------------------
     *
     * Do not activate Premium for:
     *
     * FAILED
     * PENDING
     * USER_DROPPED
     * CANCELLED
     * etc.
     */

    if (
      paymentStatus !==
      "SUCCESS"
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Non-success payment webhook received.",
        status:
          paymentStatus,
      });
    }

    /*
     * ----------------------------------------
     * PAYMENT ID REQUIRED
     * ----------------------------------------
     */

    if (!paymentId) {
      console.error(
        "Successful payment has no payment ID.",
        {
          orderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment ID missing.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * FIND SUBSCRIPTION
     * ----------------------------------------
     */

    const subscriptionResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?order_id=eq.${encodeURIComponent(
          orderId
        )}&select=id,user_id,plan,status,payment_id,order_id,amount,started_at,expires_at&limit=1`,
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
      !subscriptionResponse.ok
    ) {
      console.error(
        "Subscription lookup failed:",
        await subscriptionResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Subscription lookup failed.",
        },
        { status: 500 }
      );
    }

    const subscriptions =
      await subscriptionResponse.json();

    if (!subscriptions?.length) {
      console.error(
        "Subscription not found for order:",
        orderId
      );

      /*
       * Return success so Cashfree
       * doesn't endlessly retry a
       * malformed/unknown order.
       */
      return NextResponse.json({
        success: true,
        message:
          "Order received but subscription was not found.",
      });
    }

    const subscription =
      subscriptions[0];

    /*
     * ----------------------------------------
     * IDEMPOTENCY
     * ----------------------------------------
     *
     * If already active with the same
     * payment ID, do nothing.
     */

    if (
      subscription.status ===
        "active" &&
      subscription.payment_id ===
        paymentId
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Payment already processed.",
        order_id:
          orderId,
        payment_id:
          paymentId,
      });
    }

    /*
     * ----------------------------------------
     * ONLY PENDING ORDER CAN BE ACTIVATED
     * ----------------------------------------
     */

    if (
      subscription.status !==
      "pending"
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Subscription is not pending.",
        status:
          subscription.status,
      });
    }

    /*
     * ----------------------------------------
     * VALIDATE PLAN
     * ----------------------------------------
     */

    const selectedPlan =
      PLANS[subscription.plan];

    if (!selectedPlan) {
      console.error(
        "Invalid subscription plan:",
        subscription.plan
      );

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
     * VALIDATE PAYMENT AMOUNT
     * ----------------------------------------
     */

    if (
      !Number.isFinite(
        paymentAmount
      ) ||
      paymentAmount !==
        Number(selectedPlan.amount)
    ) {
      console.error(
        "Webhook payment amount mismatch:",
        {
          orderId,
          paymentAmount,
          expected:
            selectedPlan.amount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount mismatch.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------
     * VERIFY ORDER OWNER
     * ----------------------------------------
     *
     * We already have the user_id
     * from our own pending order.
     */

    const userId =
      subscription.user_id;

    /*
     * ----------------------------------------
     * ACTIVATE PAYMENT
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
     * First deactivate active demo.
     */

    const demoResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}&plan=eq.demo&status=eq.active`,
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

    if (!demoResponse.ok) {
      console.error(
        "Demo deactivation failed:",
        await demoResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Could not deactivate previous demo.",
        },
        { status: 500 }
      );
    }

    /*
     * Activate exact pending
     * paid subscription.
     */

    const activateResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${subscription.id}&user_id=eq.${userId}&status=eq.pending`,
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
            "Subscription activation failed.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * UPDATE USER PREMIUM PLAN
     * ----------------------------------------
     */

    const userResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
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
      !userResponse.ok
    ) {
      console.error(
        "User Premium update failed:",
        await userResponse.text()
      );

      return NextResponse.json(
        {
          error:
            "Subscription activated but user plan update failed.",
        },
        { status: 500 }
      );
    }

    /*
     * ----------------------------------------
     * SUCCESS
     * ----------------------------------------
     */

    console.log(
      "Premium activated successfully:",
      {
        orderId,
        paymentId,
        userId,
        plan:
          subscription.plan,
        amount:
          selectedPlan.amount,
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "Premium subscription activated.",

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
    });
  } catch (error) {
    console.error(
      "Cashfree webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal webhook processing error.",
      },
      { status: 500 }
    );
  }
}
