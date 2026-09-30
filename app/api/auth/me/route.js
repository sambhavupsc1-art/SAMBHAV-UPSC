import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("tma ")) {
      return NextResponse.json(
        { error: "Telegram authentication required" },
        { status: 401 }
      );
    }

    const initData = authorization.slice(4);
    const telegramUser = validateTelegramInitData(initData);

    if (!telegramUser?.id) {
      return NextResponse.json(
        { error: "Invalid Telegram authentication" },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramUser.id}&select=telegram_id,first_name,username,status,plan`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    const users = await response.json();

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: users[0],
    });
  } catch (error) {
    console.error("Auth error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
