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

export async function POST(request) {
  try {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");

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

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name || "",
        username: telegramUser.username || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase error:", errorText);

      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC me request process karne me problem aa gayi. Please thodi der baad /start dobara bheje."
      );

      return NextResponse.json(
        { ok: false, error: "Database error" },
        { status: 500 }
      );
    }

    await sendTelegramMessage(
      chatId,
      "SAMBHAV UPSC\n\nAapki access request successfully submit ho gayi hai.\n\nStatus: Pending\n\nAdmin approval ke baad aapko access diya jayega."
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
