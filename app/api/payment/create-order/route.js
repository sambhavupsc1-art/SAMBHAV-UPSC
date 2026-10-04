import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

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
 * ========================================================
 */

function verifyEmailSession(token) {
  try {
    const secret =
      process.env.AUTH_SESSION_SECRET;

    if (!secret) {
      return {
        valid: false,
        reason: "AUTH_SESSION_SECRET missing",
      };
    }

    if (!token) {
      return {
        valid: false,
        reason: "Session token missing",
      };
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return {
        valid: false,
        reason: "Invalid session token format",
      };
    }

    const [payload, signature] = parts;

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64url");

    if (
      signature.length !==
      expectedSignature.length
    ) {
      return {
        valid: false,
        reason: "Signature length mismatch",
      };
    }

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return {
        valid: false,
        reason: "Signature mismatch",
      };
    }

    let data;

    try {
      data = JSON.parse(
        Buffer.from(
          payload,
          "base64url"
        ).toString("utf8")
      );
    } catch {
      return {
        valid: false,
        reason: "Invalid session payload",
      };
    }

    if (!data?.userId) {
      return {
        valid: false,
        reason: "userId missing from session",
      };
    }

    if (!data?.exp) {
      return {
        valid: false,
        reason: "Session expiry missing",
      };
    }

    if (Date.now() > data.exp) {
      return {
        valid: false,
        reason: "Session expired",
      };
    }

    return {
      valid: true,
      userId: data.userId,
    };
  } catch (error) {
    console.error(
      "Session verification error:",
      error
    );

    return {
      valid: false,
      reason:
        error?.message ||
        "Session verification failed",
    };
  }
}

/*
 * ========================================================
 * GET USER BY ID
 * ========================================================
 */

async function getUserById(userId) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY ||
    !userId
  ) {
    return {
      user: null,
      reason:
        "Supabase configuration or userId missing",
    };
  }

  try {
    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
          userId
        )}&select=id,email,telegram_id,first_name,last_name,username,status,plan,created_at`,
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
      const errorText =
        await response.text();

      console.error(
        "Payment user lookup failed:",
        errorText
      );

      return {
        user: null,
        reason:
          "Supabase user lookup failed",
      };
    }

    const users =
      await response.json();

    if (!Array.isArray(users)) {
      return {
        user: null,
        reason:
          "Invalid Supabase user response",
      };
    }

    if (users.length === 0) {
      return {
        user: null,
        reason:
          "User not found in Supabase",
      };
    }

    return {
      user: users[0],
      reason: "User found",
    };
  } catch (error) {
    console.error(
      "Payment user lookup exception:",
      error
    );

    return {
      user: null,
      reason:
        error?.message ||
        "User lookup exception",
    };
  }
}

/*
 * ========================================================
 * EMAIL SESSION AUTHENTICATION ONLY
 * ========================================================
 */

async function getAuthenticatedUser() {
  const diagnostic = {
    cookiePresent: false,
    sessionValid: false,
    userFound: false,
    authMethod: null,
    reason: null,
  };

  try {
    /*
     * ----------------------------------------------------
     * READ SESSION COOKIE
     * ----------------------------------------------------
     */

    let sessionToken = null;

    try {
      const cookieStore =
        await cookies();

      sessionToken =
        cookieStore.get(
          "sambhav_session"
        )?.value || null;
    } catch (error) {
      console.error(
        "Payment cookies() error:",
        error
      );

      diagnostic.reason =
        "Unable to read cookies";

      return {
        user: null,
        diagnostic,
      };
    }

    /*
     * ----------------------------------------------------
     * COOKIE CHECK
     * ----------------------------------------------------
     */

    if (!sessionToken) {
      diagnostic.reason =
        "sambhav_session cookie not received";

      console.error(
        "Payment authentication:",
        diagnostic
      );

      return {
        user: null,
        diagnostic,
      };
    }

    diagnostic.cookiePresent = true;

    /*
     * ----------------------------------------------------
     * VERIFY SESSION
     * ----------------------------------------------------
     */

    const session =
      verifyEmailSession(
        sessionToken
      );

    if (!session.valid) {
      diagnostic.reason =
        session.reason;

      console.error(
        "Payment authentication:",
        diagnostic
      );

      return {
        user: null,
        diagnostic,
      };
    }

    diagnostic.sessionValid = true;

    /*
     * ----------------------------------------------------
     * GET USER
     * ----------------------------------------------------
     */

    const userResult =
      await getUserById(
        session.userId
      );

    if (!userResult.user) {
      diagnostic.reason =
        userResult.reason;

      console.error(
        "Payment authentication:",
        diagnostic
      );

      return {
        user: null,
        diagnostic,
      };
    }

    diagnostic.userFound = true;
    diagnostic.authMethod =
      "email";
    diagnostic.reason =
      "Authentication successful";

    return {
      user:
        userResult.user,

      diagnostic,
    };
  } catch (error) {
    console.error(
      "Payment authentication exception:",
      error
    );

    diagnostic.reason =
      error?.message ||
      "Authentication exception";

    return {
      user: null,
      diagnostic,
    };
  }
}

/*
 * ========================================================
 * GET ACTIVE SUBSCRIPTION
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
        {
          status: 500,
        }
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
        {
          status: 500,
        }
      );
    }

    if (
      !process.env.AUTH_SESSION_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication configuration missing.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ====================================================
     * AUTHENTICATION
     * ====================================================
     */

    const auth =
      await getAuthenticatedUser();

    if (!auth?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",

          debug:
            auth?.diagnostic || {
              cookiePresent: false,
              sessionValid: false,
              userFound: false,
              authMethod: null,
              reason:
                "Authentication function returned no result",
            },
        },
        {
          status: 401,
        }
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
        {
          status: 400,
        }
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
        {
          status: 403,
        }
      );
    }

    /*
     * ====================================================
     * ACTIVE SUBSCRIPTION
     *
     * DEMO CAN UPGRADE.
     * PAID ACTIVE SUBSCRIPTION CANNOT BUY AGAIN.
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
        {
          status: 409,
        }
      );
    }

    /*
     * ====================================================
     * ORDER ID
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
        "https://sambhav-upsc.vercel.app"
      ).replace(
        /\/$/,
        ""
      );

    const returnUrl =
      `${baseUrl}/premium/payment/success?order_id={order_id}`;

    /*
     * ====================================================
     * CASHFREE URL
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
      `sambhav_${user.id}`;

    const customerName =
      user.first_name ||
      user.username ||
      user.email ||
      "SAMBHAV User";

    const customerPhone =
      String(
        user.phone || ""
      ).replace(
        /\D/g,
        ""
      ) ||
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
        {
          status: 502,
        }
      );
    }

    /*
     * ====================================================
     * PAYMENT SESSION
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
        {
          status: 502,
        }
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
        {
          status: 500,
        }
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
      {
        status: 500,
      }
    );
  }
}
