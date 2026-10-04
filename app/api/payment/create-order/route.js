import { NextResponse } from "next/server";
import crypto from "crypto";

/* =====================================================
   ENV
===================================================== */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const CASHFREE_APP_ID =
  process.env.CASHFREE_APP_ID;

const CASHFREE_SECRET_KEY =
  process.env.CASHFREE_SECRET_KEY;

const CASHFREE_ENV =
  process.env.CASHFREE_ENV === "production"
    ? "production"
    : "sandbox";

const CASHFREE_BASE_URL =
  CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

/* =====================================================
   PLANS
===================================================== */

const PLANS = {
  monthly: {
    name: "Monthly",
    amount: 99,
    days: 30,
  },

  quarterly: {
    name: "Quarterly",
    amount: 399,
    days: 90,
  },

  annual: {
    name: "Annual",
    amount: 999,
    days: 365,
  },
};

/* =====================================================
   SESSION VERIFICATION
===================================================== */

function base64urlDecode(value) {
  try {
    return Buffer.from(
      value,
      "base64url"
    ).toString("utf8");
  } catch {
    return null;
  }
}

function verifyEmailSession(token) {
  try {
    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [
      encodedPayload,
      encodedSignature,
    ] = parts;

    const secret =
      process.env.AUTH_SESSION_SECRET;

    if (!secret) {
      console.error(
        "AUTH_SESSION_SECRET is missing"
      );

      return null;
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(encodedPayload)
        .digest();

    const actualSignature =
      Buffer.from(
        encodedSignature,
        "base64url"
      );

    if (
      actualSignature.length !==
      expectedSignature.length
    ) {
      return null;
    }

    if (
      !crypto.timingSafeEqual(
        actualSignature,
        expectedSignature
      )
    ) {
      return null;
    }

    const payloadText =
      base64urlDecode(
        encodedPayload
      );

    if (!payloadText) {
      return null;
    }

    const payload =
      JSON.parse(payloadText);

    if (!payload?.userId) {
      return null;
    }

    if (payload.exp) {
      const now =
        Math.floor(
          Date.now() / 1000
        );

      if (
        now >=
        Number(payload.exp)
      ) {
        return null;
      }
    }

    return payload;
  } catch (error) {
    console.error(
      "Session verification error:",
      error
    );

    return null;
  }
}

/* =====================================================
   COOKIE
===================================================== */

function getSessionTokenFromCookieHeader(
  cookieHeader
) {
  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  for (const item of cookies) {
    const separator =
      item.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name =
      item
        .slice(0, separator)
        .trim();

    if (
      name !==
      "sambhav_session"
    ) {
      continue;
    }

    return item
      .slice(separator + 1)
      .trim();
  }

  return null;
}

/* =====================================================
   GET USER
===================================================== */

async function getUserById(userId) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error(
      "Supabase environment variables missing"
    );

    return null;
  }

  try {
    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
          userId
        )}&select=*`,
        {
          method: "GET",

          headers: {
            apikey:
              SUPABASE_SERVICE_ROLE_KEY,

            Authorization:
              `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

            "Content-Type":
              "application/json",
          },

          cache: "no-store",
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Supabase user lookup failed:",
        response.status,
        errorText
      );

      return null;
    }

    const users =
      await response.json();

    return users?.[0] || null;
  } catch (error) {
    console.error(
      "getUserById error:",
      error
    );

    return null;
  }
}

/* =====================================================
   AUTH
===================================================== */

async function getAuthenticatedUser(
  request
) {
  try {
    const cookieHeader =
      request.headers.get(
        "cookie"
      );

    if (!cookieHeader) {
      return {
        user: null,
        reason:
          "Cookie header missing",
      };
    }

    const sessionToken =
      getSessionTokenFromCookieHeader(
        cookieHeader
      );

    if (!sessionToken) {
      return {
        user: null,
        reason:
          "sambhav_session cookie missing",
      };
    }

    const session =
      verifyEmailSession(
        sessionToken
      );

    if (!session?.userId) {
      return {
        user: null,
        reason:
          "Invalid or expired session",
      };
    }

    const user =
      await getUserById(
        session.userId
      );

    if (!user) {
      return {
        user: null,
        reason:
          "User not found",
      };
    }

    return {
      user,
      reason: null,
    };
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return {
      user: null,
      reason:
        "Authentication exception",
    };
  }
}

/* =====================================================
   ORDER ID
===================================================== */

function createOrderId() {
  return (
    "SAMBHAV_" +
    Date.now() +
    "_" +
    crypto
      .randomBytes(5)
      .toString("hex")
  );
}

/* =====================================================
   POST - CREATE CASHFREE ORDER
===================================================== */

export async function POST(request) {
  try {
    /* ---------------------------------------------
       AUTHENTICATION
    --------------------------------------------- */

    const auth =
      await getAuthenticatedUser(
        request
      );

    if (!auth?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",

          reason:
            auth?.reason ||
            "Unknown authentication error",
        },
        {
          status: 401,
        }
      );
    }

    const user = auth.user;

    /* ---------------------------------------------
       BODY
    --------------------------------------------- */

    let body;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const planKey =
      body?.plan;

    const selectedPlan =
      PLANS[planKey];

    if (!selectedPlan) {
      return NextResponse.json(
        {
          error:
            "Invalid plan.",
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------------------------------------
       CASHFREE CONFIG CHECK
    --------------------------------------------- */

    if (
      !CASHFREE_APP_ID ||
      !CASHFREE_SECRET_KEY
    ) {
      console.error(
        "Cashfree credentials missing"
      );

      return NextResponse.json(
        {
          error:
            "Cashfree configuration missing.",

          cashfreeEnvironment:
            CASHFREE_ENV,

          appIdPresent:
            !!CASHFREE_APP_ID,

          secretPresent:
            !!CASHFREE_SECRET_KEY,
        },
        {
          status: 500,
        }
      );
    }

    /* ---------------------------------------------
       ORDER
    --------------------------------------------- */

    const orderId =
      createOrderId();

    const customerId =
      `user_${String(
        user.id
      ).replace(
        /[^a-zA-Z0-9_-]/g,
        ""
      )}`;

    const customerName =
      user.first_name ||
      user.username ||
      "SAMBHAV UPSC User";

    const customerEmail =
      user.email;

    /*
      Cashfree requires a customer phone.
      If users table has no phone field,
      this fallback keeps the request valid.
    */

    const customerPhone =
      user.phone ||
      "9999999999";

    /* ---------------------------------------------
       CASHFREE PAYLOAD
    --------------------------------------------- */

    const cashfreePayload = {
      order_id:
        orderId,

      order_amount:
        Number(
          selectedPlan.amount
        ),

      order_currency:
        "INR",

      customer_details: {
        customer_id:
          customerId,

        customer_name:
          customerName,

        customer_email:
          customerEmail,

        customer_phone:
          customerPhone,
      },

      order_meta: {
        return_url:
          `${APP_URL}/premium/payment/success?order_id=${encodeURIComponent(
            orderId
          )}`,

        notify_url:
          `${APP_URL}/api/payment/webhook`,
      },

      order_note:
        `SAMBHAV UPSC ${selectedPlan.name} Premium`,
    };

    console.log(
      "CASHFREE ORDER REQUEST:",
      {
        environment:
          CASHFREE_ENV,

        orderId,

        amount:
          selectedPlan.amount,

        plan:
          planKey,

        appUrl:
          APP_URL,
      }
    );

    /* ---------------------------------------------
       CASHFREE API
    --------------------------------------------- */

    const cashfreeResponse =
      await fetch(
        `${CASHFREE_BASE_URL}/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-client-id":
              CASHFREE_APP_ID,

            "x-client-secret":
              CASHFREE_SECRET_KEY,

            "x-api-version":
              "2025-01-01",
          },

          body:
            JSON.stringify(
              cashfreePayload
            ),

          cache: "no-store",
        }
      );

    const cashfreeText =
      await cashfreeResponse.text();

    let cashfreeData;

    try {
      cashfreeData =
        JSON.parse(
          cashfreeText
        );
    } catch {
      cashfreeData = {
        raw:
          cashfreeText,
      };
    }

    /* ---------------------------------------------
       CASHFREE ERROR
    --------------------------------------------- */

    if (
      !cashfreeResponse.ok
    ) {
      console.error(
        "CASHFREE ERROR:",
        cashfreeResponse.status,
        cashfreeData
      );

      return NextResponse.json(
        {
          error:
            "Unable to create order.",

          cashfreeStatus:
            cashfreeResponse.status,

          cashfreeResponse:
            cashfreeData,

          environment:
            CASHFREE_ENV,
        },
        {
          status: 502,
        }
      );
    }

    /* ---------------------------------------------
       SAVE PENDING SUBSCRIPTION
    --------------------------------------------- */

    if (
      SUPABASE_URL &&
      SUPABASE_SERVICE_ROLE_KEY
    ) {
      try {
        const now =
          new Date();

        const expiresAt =
          new Date(
            now.getTime() +
              selectedPlan.days *
                24 *
                60 *
                60 *
                1000
          );

        const subscriptionPayload = {
          user_id:
            user.id,

          plan:
            planKey,

          status:
            "pending",

          amount:
            selectedPlan.amount,

          started_at:
            now.toISOString(),

          expires_at:
            expiresAt.toISOString(),

          order_id:
            orderId,

          payment_id:
            null,
        };

        const subscriptionResponse =
          await fetch(
            `${SUPABASE_URL}/rest/v1/subscriptions`,
            {
              method: "POST",

              headers: {
                apikey:
                  SUPABASE_SERVICE_ROLE_KEY,

                Authorization:
                  `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

                "Content-Type":
                  "application/json",

                Prefer:
                  "return=minimal",
              },

              body:
                JSON.stringify(
                  subscriptionPayload
                ),

              cache: "no-store",
            }
          );

        if (
          !subscriptionResponse.ok
        ) {
          console.error(
            "Subscription insert failed:",
            subscriptionResponse.status,
            await subscriptionResponse.text()
          );
        }
      } catch (error) {
        console.error(
          "Subscription insert error:",
          error
        );
      }
    }

    /* ---------------------------------------------
       SUCCESS
    --------------------------------------------- */

    return NextResponse.json(
      {
        success:
          true,

        orderId:
          orderId,

        paymentSessionId:
          cashfreeData?.payment_session_id ||
          null,

        plan: {
          key:
            planKey,

          name:
            selectedPlan.name,

          amount:
            selectedPlan.amount,

          days:
            selectedPlan.days,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the payment order.",

        message:
          error?.message ||
          null,
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   TEMPORARY GET DIAGNOSTIC
===================================================== */

export async function GET(request) {
  const auth =
    await getAuthenticatedUser(
      request
    );

  return NextResponse.json({
    route:
      "payment/create-order",

    cookiePresent:
      !!request.headers
        .get("cookie")
        ?.includes(
          "sambhav_session="
        ),

    authenticated:
      !!auth?.user?.id,

    reason:
      auth?.reason || null,
  });
}
