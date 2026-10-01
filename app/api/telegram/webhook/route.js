import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function sendTelegramMessage(chatId, text) {
  try {
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
  } catch (error) {
    console.error("Telegram message error:", error);
  }
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
    console.error("Supabase GET error:", await response.text());
    return null;
  }

  const users = await response.json();

  return users.length > 0 ? users[0] : null;
}

async function createUser(telegramUser) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
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
  });

  if (!response.ok) {
    console.error("Supabase INSERT error:", await response.text());
    return null;
  }

  const users = await response.json();

  return users.length > 0 ? users[0] : null;
}

/*
 * Send new access request notification
 * to every active admin.
 */
async function notifyAdminsAboutAccessRequest(user) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_users?is_active=eq.true&select=telegram_id`,
      {
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Admin notification lookup failed:",
        await response.text()
      );
      return;
    }

    const admins = await response.json();

    if (!admins.length) {
      return;
    }

    const name = user?.first_name || "Unknown User";

    const username = user?.username
      ? `@${user.username}`
      : "No username";

    const telegramId = user?.telegram_id || "Unknown";

    const notificationText =
      "🔔 SAMBHAV UPSC\n\n" +
      "NEW ACCESS REQUEST\n\n" +
      `Name: ${name}\n` +
      `Username: ${username}\n` +
      `Telegram ID: ${telegramId}\n\n` +
      "Open Admin Panel to review the request.";

    await Promise.all(
      admins.map((admin) =>
        sendTelegramMessage(
          admin.telegram_id,
          notificationText
        )
      )
    );
  } catch (error) {
    console.error(
      "Admin notification error:",
      error
    );
  }
}

async function resetRejectedUser(telegramId) {
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
      body: JSON.stringify({
        status: "pending",
        approved_at: null,
        approved_by: null,
      }),
    }
  );

  if (!response.ok) {
    console.error(
      "Rejected user reset error:",
      await response.text()
    );

    return false;
  }

  return true;
}

export async function POST(request) {
  try {
    // -----------------------------------------
    // WEBHOOK SECURITY
    // -----------------------------------------

    const secret = request.headers.get(
      "x-telegram-bot-api-secret-token"
    );

    if (
      !TELEGRAM_WEBHOOK_SECRET ||
      secret !== TELEGRAM_WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // -----------------------------------------
    // TELEGRAM UPDATE
    // -----------------------------------------

    const update = await request.json();

    const message = update?.message;

    if (!message?.from || !message?.chat?.id) {
      return NextResponse.json({
        ok: true,
      });
    }

    const telegramUser = message.from;
    const chatId = message.chat.id;
    const text = message.text || "";

    // -----------------------------------------
    // ONLY /start
    // -----------------------------------------

    if (!text.startsWith("/start")) {
      return NextResponse.json({
        ok: true,
      });
    }

    // -----------------------------------------
    // FIND USER
    // -----------------------------------------

    let user = await getUser(telegramUser.id);

    // -----------------------------------------
    // NEW USER
    // -----------------------------------------

    if (!user) {
      user = await createUser(telegramUser);

      if (!user) {
        await sendTelegramMessage(
          chatId,
          "SAMBHAV UPSC\n\n" +
            "Request process karne me problem aa gayi.\n\n" +
            "Please thodi der baad /start dobara bheje."
        );

        return NextResponse.json(
          {
            ok: false,
            error: "Database error",
          },
          {
            status: 500,
          }
        );
      }

      // User ko confirmation
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\n" +
          "Aapki access request submit ho gayi hai.\n\n" +
          "Admin approval ke baad aapko access diya jayega."
      );

      // ADMIN KO NOTIFICATION
      await notifyAdminsAboutAccessRequest(user);

      return NextResponse.json({
        ok: true,
      });
    }

    // -----------------------------------------
    // APPROVED USER
    // -----------------------------------------

    if (user.status === "approved") {
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\n" +
          "Aapka access already approved hai.\n\n" +
          "Mini App button se SAMBHAV UPSC open karein."
      );

      return NextResponse.json({
        ok: true,
      });
    }

    // -----------------------------------------
    // PENDING USER
    // -----------------------------------------

    if (user.status === "pending") {
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\n" +
          "Aapki access request abhi pending hai.\n\n" +
          "Admin approval ka wait karein."
      );

      return NextResponse.json({
        ok: true,
      });
    }

    // -----------------------------------------
    // REJECTED USER
    // CAN REQUEST AGAIN
    // -----------------------------------------

    if (user.status === "rejected") {
      const resetSuccessful =
        await resetRejectedUser(
          telegramUser.id
        );

      if (!resetSuccessful) {
        await sendTelegramMessage(
          chatId,
          "SAMBHAV UPSC\n\n" +
            "Request dobara bhejne me problem aa gayi.\n\n" +
            "Please thodi der baad /start dobara bheje."
        );

        return NextResponse.json(
          {
            ok: false,
            error: "Re-request failed",
          },
          {
            status: 500,
          }
        );
      }

      const refreshedUser = {
        ...user,
        status: "pending",
      };

      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\n" +
          "Aapki purani request reject/cancel ho chuki thi.\n\n" +
          "Aapki nayi access request dobara submit ho gayi hai.\n\n" +
          "Admin approval ka wait karein."
      );

      // ADMIN KO DOBARA NOTIFICATION
      await notifyAdminsAboutAccessRequest(
        refreshedUser
      );

      return NextResponse.json({
        ok: true,
      });
    }

    // -----------------------------------------
    // BANNED USER
    // -----------------------------------------

    if (user.status === "banned") {
      await sendTelegramMessage(
        chatId,
        "SAMBHAV UPSC\n\n" +
          "Aapka account blocked hai.\n\n" +
          "Aap dobara access request submit nahi kar sakte."
      );

      return NextResponse.json({
        ok: true,
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Webhook error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
