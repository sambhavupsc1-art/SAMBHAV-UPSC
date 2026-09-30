import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function sendTelegramMessage(chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  );
}

async function getUser(telegramId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users?telegram_id=eq.${telegramId}&select=telegram_id,first_name,username,status,plan`,
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
    console.error("Supabase GET error:", errorText);
    return null;
  }

  const users = await response.json();

  return users.length > 0 ? users[0] : null;
}

async function createUser(telegramUser) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name || "",
        username: telegramUser.username || null,
        status: "pending",
        plan: "free",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase INSERT error:", errorText);
    return null;
  }

  const users = await response.json();

  return users.length > 0 ? users[0] : null;
}

export async function POST(request) {
  try {
    const secret = request.headers.get(
      "x-telegram-bot-api-secret-token"
    );

    if (
      !TELEGRAM_WEBHOOK_SECRET ||
      secret !== TELEGRAM_WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const update = await request.json();
    const message = update?.message;

    if (!message?.from || !message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const telegramUser = message.from;
    const chatId = message.chat.id;
    const text = message.text || "";

    if (!text.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    // Existing user check
    let user = await getUser(telegramUser.id);

    // New user registration
    if (!user) {
      user = await createUser(telegramUser);

      if (!user) {
        await sendTelegramMessage(
          chatId,
          "SAMBHAV UPSC me request process karne me problem aa gayi.\n\nPlease thodi der baad /start dobara bheje."
        );

        return NextResponse.json(
          { ok: false, error: "Database error" },
          { status: 500 }
        );
      }
    }

    // Existing approved user
    if (user.status === "approved") {
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\nAapka access approved hai.\n\nMini App button se SAMBHAV UPSC open karein."
      );

      return NextResponse.json({ ok: true });
    }

    // Pending user
    if (user.status === "pending") {
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\nAapki access request pending hai.\n\nAdmin approval ke baad aapko access diya jayega."
      );

      return NextResponse.json({ ok: true });
    }

    // Rejected user
    if (user.status === "rejected") {
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\nAapki access request reject kar di gayi hai."
      );

      return NextResponse.json({ ok: true });
    }

    // Banned user
    if (user.status === "banned") {
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\nAapka account blocked hai."
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
