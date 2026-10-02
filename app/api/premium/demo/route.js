import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../../lib/telegram/validateInitData";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("tma ")) {
      return NextResponse.json(
        { error: "Telegram authentication required" },
        { status: 401 }
      );
    }

    const initData = authorization.slice(4);

    const telegramUser =
      validateTelegramInitData(initData);

    if (!telegramUser?.id) {
      return NextResponse.json(
        { error: "Invalid Telegram authentication" },
        { status: 401 }
      );
    }

    /*
     * Find the existing SAMBHAV user.
     */
    const userResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUser.id}&select=id,telegram_id,first_name,username,status,plan`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();

      console.error(
        "Premium demo user lookup error:",
        errorText
      );

      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    const users = await userResponse.json();

    if (!users.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = users[0];

    /*
     * Only approved users can activate Premium Demo.
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
     * Check whether this user already has
     * an active subscription/demo.
     */
    const existingResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&status=eq.active&expires_at=gt.${encodeURIComponent(
        new Date().toISOString()
      )}&select=id,plan,status,expires_at&order=expires_at.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
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
        { error: "Subscription check failed" },
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
     * Prevent a user from taking the FREE 2-day
     * demo more than once.
     */
    const demoHistoryResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&plan=eq.demo&select=id,plan,status,started_at,expires_at&order=created_at.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
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
        { error: "Demo verification failed" },
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
     * Create exactly 2 days of Premium Demo.
     */
    const startedAt = new Date();

    const expiresAt = new Date(
      startedAt.getTime() +
        2 * 24 * 60 * 60 * 1000
    );

    const subscription = {
      user_id: user.id,
      plan: "demo",
      status: "active",
      payment_id: null,
      order_id: null,
      amount: 0,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(subscription),
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
        { error: "Demo activation failed" },
        { status: 500 }
      );
    }

    const created =
      await insertResponse.json();

    /*
     * Keep users.plan synchronized for the
     * existing application.
     */
    const userUpdateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
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
       * Subscription was created successfully.
       * We don't delete it just because the legacy
       * users.plan update failed.
       */
    }

    return NextResponse.json({
      success: true,
      message: "PREMIUM DEMO ACTIVATED",
      subscription: created[0] || subscription,
    });
  } catch (error) {
    console.error(
      "Premium demo activation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Premium demo activation failed",
      },
      { status: 500 }
    );
  }
}
