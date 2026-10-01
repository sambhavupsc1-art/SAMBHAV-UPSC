import { NextResponse } from "next/server";
import { validateTelegramInitData } from "../../../../lib/telegram/validateInitData";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function getAdmin(initData) {
  const telegramUser = validateTelegramInitData(initData);

  if (!telegramUser?.id) {
    return null;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?telegram_id=eq.${telegramUser.id}&is_active=eq.true&select=id,telegram_id,first_name,username`,
    {
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error("Admin check failed:", await response.text());
    return null;
  }

  const admins = await response.json();

  if (admins.length === 0) {
    return null;
  }

  return {
    telegramUser,
    admin: admins[0],
  };
}

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
    const auth = await getAdmin(initData);

    if (!auth) {
      return NextResponse.json(
        { error: "Admin access denied" },
        { status: 403 }
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=telegram_id,first_name,username,status,plan,created_at,approved_at,approved_by&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Users fetch error:", errorText);

      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const users = await response.json();

    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error("Admin GET error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

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
    const auth = await getAdmin(initData);

    if (!auth) {
      return NextResponse.json(
        { error: "Admin access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const telegramId = Number(body.telegram_id);
    const status = body.status;

    if (!Number.isSafeInteger(telegramId)) {
      return NextResponse.json(
        { error: "Invalid telegram_id" },
        { status: 400 }
      );
    }

    // Allowed admin actions
    if (
      !["approved", "rejected", "banned"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updateData = {
      status,
      approved_at:
        status === "approved"
          ? new Date().toISOString()
          : null,
      approved_by:
        status === "approved"
          ? auth.admin.id
          : null,
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("User update error:", errorText);

      return NextResponse.json(
        { error: "User update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status,
      telegram_id: telegramId,
    });
  } catch (error) {
    console.error("Admin POST error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
