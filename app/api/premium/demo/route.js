import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;

export async function POST(request) {
  try {
    /*
     * =========================================================
     * 1. AUTHENTICATE USER USING SAMBHAV EMAIL SESSION
     * =========================================================
     *
     * The browser sends the HTTP-only sambhav_session cookie.
     * We forward that cookie to the existing /api/auth/me
     * endpoint so session validation remains centralized.
     */
    const sessionCookie =
      request.cookies.get("sambhav_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        {
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const authMeUrl = new URL(
      "/api/auth/me",
      request.url
    );

    const authResponse = await fetch(
      authMeUrl.toString(),
      {
        method: "GET",
        headers: {
          Cookie: `sambhav_session=${sessionCookie}`,
        },
        cache: "no-store",
      }
    );

    const authData =
      await authResponse.json().catch(
        () => ({})
      );

    if (!authResponse.ok || !authData?.user?.id) {
      return NextResponse.json(
        {
          error:
            "User authentication failed.",
        },
        { status: 401 }
      );
    }

    const authenticatedUser =
      authData.user;

    /*
     * =========================================================
     * 2. DATABASE CONFIGURATION
     * =========================================================
     */
    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY
    ) {
      console.error(
        "Supabase environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "Server configuration error.",
        },
        { status: 500 }
      );
    }

    /*
     * =========================================================
     * 3. FIND THE AUTHENTICATED SAMBHAV USER
     * =========================================================
     *
     * IMPORTANT:
     * We use the ID returned by the verified session.
     * We do NOT trust a user_id sent by the frontend.
     */
    const userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(
        authenticatedUser.id
      )}&select=id,telegram_id,first_name,username,status,plan`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization:
            `Bearer ${SUPABASE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      const errorText =
        await userResponse.text();

      console.error(
        "Premium demo user lookup error:",
        errorText
      );

      return NextResponse.json(
        {
          error: "Database error",
        },
        { status: 500 }
      );
    }

    const users =
      await userResponse.json();

    if (!users.length) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    /*
     * =========================================================
     * 4. APPROVAL CHECK
     * =========================================================
     */
    if (user.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "Your SAMBHAV account is not approved yet.",
        },
        { status: 403 }
      );
    }

    /*
     * =========================================================
     * 5. CHECK EXISTING ACTIVE PREMIUM
     * =========================================================
     */
    const now =
      new Date().toISOString();

    const existingResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
          user.id
        )}&status=eq.active&expires_at=gt.${encodeURIComponent(
          now
        )}&select=id,plan,status,expires_at&order=expires_at.desc&limit=1`,
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

    if (!existingResponse.ok) {
      const errorText =
        await existingResponse.text();

      console.error(
        "Existing subscription lookup error:",
        errorText
      );

      return NextResponse.json(
        {
          error:
            "Subscription check failed",
        },
        { status: 500 }
      );
    }

    const existing =
      await existingResponse.json();

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "You already have an active Premium subscription.",
          subscription: existing[0],
        },
        { status: 409 }
      );
    }

    /*
     * =========================================================
     * 6. CHECK DEMO HISTORY
     * =========================================================
     *
     * A user can use the free demo only once.
     */
    const demoHistoryResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
          user.id
        )}&plan=eq.demo&select=id,plan,status,started_at,expires_at&order=created_at.desc&limit=1`,
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

    if (!demoHistoryResponse.ok) {
      const errorText =
        await demoHistoryResponse.text();

      console.error(
        "Demo history lookup error:",
        errorText
      );

      return NextResponse.json(
        {
          error:
            "Demo verification failed",
        },
        { status: 500 }
      );
    }

    const demoHistory =
      await demoHistoryResponse.json();

    if (demoHistory.length > 0) {
      return NextResponse.json(
        {
          error:
            "Your 2-Day Premium Demo has already been used.",
        },
        { status: 409 }
      );
    }

    /*
     * =========================================================
     * 7. CREATE EXACTLY 2 DAYS OF PREMIUM DEMO
     * =========================================================
     */
    const startedAt =
      new Date();

    const expiresAt =
      new Date(
        startedAt.getTime() +
          2 *
            24 *
            60 *
            60 *
            1000
      );

    const subscription = {
      user_id: user.id,
      plan: "demo",
      status: "active",
      payment_id: null,
      order_id: null,
      amount: 0,
      started_at:
        startedAt.toISOString(),
      expires_at:
        expiresAt.toISOString(),
    };

    const insertResponse =
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
          body: JSON.stringify(
            subscription
          ),
          cache: "no-store",
        }
      );

    if (!insertResponse.ok) {
      const errorText =
        await insertResponse.text();

      console.error(
        "Demo subscription insert error:",
        errorText
      );

      return NextResponse.json(
        {
          error:
            "Demo activation failed",
        },
        { status: 500 }
      );
    }

    const created =
      await insertResponse.json();

    /*
     * =========================================================
     * 8. KEEP USERS.PLAN SYNCHRONIZED
     * =========================================================
     */
    const userUpdateResponse =
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
            plan: "premium",
          }),
          cache: "no-store",
        }
      );

    if (!userUpdateResponse.ok) {
      const errorText =
        await userUpdateResponse.text();

      console.error(
        "User premium update error:",
        errorText
      );

      /*
       * Subscription was already created successfully.
       * Do not delete it because of this legacy sync failure.
       */
    }

    /*
     * =========================================================
     * 9. SUCCESS
     * =========================================================
     */
    return NextResponse.json({
      success: true,
      message:
        "PREMIUM DEMO ACTIVATED",
      subscription:
        created[0] ||
        subscription,
    });
  } catch (error) {
    console.error(
      "Premium demo activation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Premium demo activation failed",
      },
      { status: 500 }
    );
  }
}
