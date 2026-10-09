
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const TELEGRAM_CHANNEL = "@SAMBHAVUPSC1";
const TELEGRAM_CHANNEL_URL = "https://t.me/SAMBHAVUPSC1";
const SAMBHAV_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://sambhav-upsc.vercel.app";
const WELCOME_IMAGE_URL =
  "https://sambhav-upsc.vercel.app/sambhav-welcome.png";

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function log(...args) {
  console.log("[SAMBHAV TELEGRAM]", ...args);
}

/* =========================================================
   TELEGRAM API
========================================================= */

async function telegramApi(method, body) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }
  );

  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(
      `Telegram ${method}: ${JSON.stringify(data)}`
    );
  }

  return data.result;
}

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function answerCallback(callbackQueryId, text = "") {
  try {
    await telegramApi("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      ...(text ? { text } : {}),
    });
  } catch (error) {
    log("CALLBACK ANSWER ERROR", error.message);
  }
}

/* =========================================================
   WELCOME
========================================================= */

async function sendWelcomeMessage(chatId) {
  const caption = `
<b>Welcome to SAMBHAV UPSC</b>

Your focused UPSC preparation platform.

📚 <b>Daily Current Affairs</b>
📝 <b>PYQ-Oriented Practice</b>
🤖 <b>AI-Powered Mains Evaluation</b>
📖 <b>Structured Study Material</b>
📊 <b>Performance Tracking</b>

First, join our official Telegram channel.
`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📚 Current Affairs", callback_data: "info_current_affairs" },
        { text: "📝 PYQ Practice", callback_data: "info_pyq" },
      ],
      [
        { text: "🤖 AI Evaluation", callback_data: "info_ai" },
        { text: "📖 Study Material", callback_data: "info_material" },
      ],
      [
        { text: "📊 Performance", callback_data: "info_performance" },
      ],
      [
        { text: "📢 Join Official Channel", url: TELEGRAM_CHANNEL_URL },
      ],
      [
        { text: "✓ I Have Joined / Continue", callback_data: "verify_channel" },
      ],
    ],
  };

  try {
    const imageResponse = await fetch(WELCOME_IMAGE_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!imageResponse.ok) {
      throw new Error(`Welcome image HTTP ${imageResponse.status}`);
    }

    const blob = await imageResponse.blob();
    const form = new FormData();

    form.append("chat_id", String(chatId));
    form.append("photo", blob, "sambhav-welcome.png");
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    form.append("reply_markup", JSON.stringify(keyboard));

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: form,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const result = await response.json();

    if (!response.ok || !result?.ok) {
      throw new Error(JSON.stringify(result));
    }
  } catch (error) {
    log("WELCOME PHOTO FAILED; SENDING TEXT", error.message);
    await sendTelegramMessage(chatId, caption, keyboard);
  }
}

/* =========================================================
   CHANNEL MEMBERSHIP
========================================================= */

async function checkChannelMembership(userId) {
  const member = await telegramApi("getChatMember", {
    chat_id: TELEGRAM_CHANNEL,
    user_id: userId,
  });

  const status = member?.status;

  if (["creator", "administrator", "member"].includes(status)) {
    return true;
  }

  if (status === "restricted" && member?.is_member === true) {
    return true;
  }

  return false;
}

async function sendVerifiedMessage(chatId) {
  return sendTelegramMessage(
    chatId,
    `<b>SAMBHAV UPSC</b>

✅ Channel verification successful.

Ab aap app open karke signup kar sakte hain.`,
    {
      inline_keyboard: [
        [{ text: "🚀 Open SAMBHAV UPSC", url: SAMBHAV_APP_URL }],
      ],
    }
  );
}

async function sendNotJoinedMessage(chatId) {
  return sendTelegramMessage(
    chatId,
    `<b>SAMBHAV UPSC</b>

🔒 Official channel abhi join nahi hua hai.

Channel join karne ke baad dobara verify karein.`,
    {
      inline_keyboard: [
        [{ text: "📢 Join Official Channel", url: TELEGRAM_CHANNEL_URL }],
        [{ text: "✓ Verify Again", callback_data: "verify_channel" }],
      ],
    }
  );
}

async function sendVerificationError(chatId) {
  return sendTelegramMessage(
    chatId,
    "⚠️ Channel membership verify nahi ho pa rahi. Thodi der baad try karein. Channel ka bot-admin setup bhi check karein."
  );
}

/* =========================================================
   INFO BUTTONS
========================================================= */

async function sendInfoMessage(chatId, type) {
  const messages = {
    info_current_affairs:
      "<b>📚 Current Affairs</b>\n\nUPSC-oriented current affairs aur important developments.",
    info_pyq:
      "<b>📝 PYQ Practice</b>\n\nPrevious Year Questions se exam pattern aur concepts ki practice.",
    info_ai:
      "<b>🤖 AI Answer Evaluation</b>\n\nMains answers ka structured evaluation aur improvement feedback.",
    info_material:
      "<b>📖 Study Material</b>\n\nUPSC ke liye focused subject-wise learning resources.",
    info_performance:
      "<b>📊 Performance</b>\n\nPreparation aur practice progress ko track karne ka system.",
  };

  return sendTelegramMessage(
    chatId,
    messages[type] || "<b>SAMBHAV UPSC</b>",
    {
      inline_keyboard: [
        [{ text: "📢 Official Channel", url: TELEGRAM_CHANNEL_URL }],
        [{ text: "← Back", callback_data: "back_to_welcome" }],
      ],
    }
  );
}

/* =========================================================
   THE HINDU PDF PROCESSOR
========================================================= */

async function processTheHinduPdf(chatId, message) {
  const document = message?.document;
  if (!document) return false;

  const fileName = String(document.file_name || "");
  const mimeType = String(document.mime_type || "");

  const isPdf =
    mimeType === "application/pdf" ||
    fileName.toLowerCase().endsWith(".pdf");

  if (!isPdf) return false;

  log("PDF RECEIVED", {
    fileName,
    fileIdPresent: Boolean(document.file_id),
    chatId,
    messageId: message.message_id,
  });

  if (!TELEGRAM_WEBHOOK_SECRET) {
    await sendTelegramMessage(
      chatId,
      "❌ Processor secret missing hai. Vercel environment variables check karein."
    );
    return true;
  }

  try {
    await sendTelegramMessage(
      chatId,
      "📄 <b>The Hindu PDF received</b>\n\nProcessing request bheji ja rahi hai. Complete result ke liye neeche diye gaye status ko dekhein."
    );

    const processorUrl =
      `${SAMBHAV_APP_URL.replace(/\/$/, "")}/api/current-affairs/the-hindu`;

    const response = await fetch(processorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sambhav-internal-secret": TELEGRAM_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        file_id: document.file_id,
        file_unique_id: document.file_unique_id,
        file_name: fileName,
        mime_type: mimeType,
        telegram_chat_id: chatId,
        telegram_message_id: message.message_id,
        telegram_date: message.date || null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(240000),
    });

    const raw = await response.text();

    let result;
    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      result = { error: raw };
    }

    log("PROCESSOR RESPONSE", {
      status: response.status,
      result,
    });

    if (!response.ok || result?.ok === false) {
      await sendTelegramMessage(
        chatId,
        `❌ <b>The Hindu processing failed</b>\n\nHTTP: ${response.status}\n<code>${escapeHtml(
          String(result?.error || result?.reason || raw || "Unknown error").slice(0, 700)
        )}</code>`
      );
      return true;
    }

    if (result?.duplicatePdf) {
      await sendTelegramMessage(
        chatId,
        `ℹ️ <b>PDF already processed</b>\n\nDate: ${escapeHtml(result.date || "N/A")}\nExisting articles: ${Number(result.existingArticles || 0)}`
      );
      return true;
    }

    const selected = Number(result?.selected || 0);
    const processed = Number(result?.processed || 0);
    const skipped = Number(result?.skipped || 0);
    const failed = Number(result?.failed || 0);

    if (selected === 0) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>PDF processing finished, but no articles were selected.</b>\n\nDate: ${escapeHtml(result.date || "N/A")}\nCandidates: ${Number(result.candidates || 0)}\n\nHeadline extraction logs check karein.`
      );
      return true;
    }

    await sendTelegramMessage(
      chatId,
      `📚 <b>The Hindu processing report</b>\n\n` +
        `📅 Date: ${escapeHtml(result.date || "N/A")}\n` +
        `🔎 Selected: ${selected}\n` +
        `⚙️ AI processed: ${processed}\n` +
        `⏭️ Skipped: ${skipped}\n` +
        `❌ Failed: ${failed}\n\n` +
        (failed
          ? "Failed articles ke liye Vercel Runtime Logs check karein."
          : "Processor ne processing complete report return ki hai.")
    );

    return true;
  } catch (error) {
    log("PDF PROCESSING ERROR", error.message);

    await sendTelegramMessage(
      chatId,
      `❌ <b>The Hindu request failed or timed out</b>\n\n<code>${escapeHtml(
        String(error?.message || "Unknown error").slice(0, 700)
      )}</code>\n\nVercel Runtime Logs check karein. Timeout hone par zaroori nahi ki processor ne kaam rok diya ho.`
    );

    return true;
  }
}

/* =========================================================
   POST — TELEGRAM WEBHOOK
========================================================= */

export async function POST(request) {
  try {
    const suppliedSecret = request.headers.get(
      "x-telegram-bot-api-secret-token"
    );

    if (
      !TELEGRAM_WEBHOOK_SECRET ||
      suppliedSecret !== TELEGRAM_WEBHOOK_SECRET
    ) {
      log("UNAUTHORIZED WEBHOOK REQUEST");

      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const update = await request.json();

    /* Callback buttons */

    const callback = update?.callback_query;

    if (callback) {
      const chatId = callback.message?.chat?.id;
      const userId = callback.from?.id;
      const action = callback.data;

      await answerCallback(callback.id);

      if (action === "verify_channel" && chatId && userId) {
        try {
          const isMember = await checkChannelMembership(userId);

          if (isMember) {
            await sendVerifiedMessage(chatId);
          } else {
            await sendNotJoinedMessage(chatId);
          }
        } catch (error) {
          log("MEMBERSHIP CHECK FAILED", error.message);
          await sendVerificationError(chatId);
        }

        return NextResponse.json({ ok: true });
      }

      if (
        [
          "info_current_affairs",
          "info_pyq",
          "info_ai",
          "info_material",
          "info_performance",
        ].includes(action) &&
        chatId
      ) {
        await sendInfoMessage(chatId, action);
        return NextResponse.json({ ok: true });
      }

      if (action === "back_to_welcome" && chatId) {
        await sendWelcomeMessage(chatId);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    /* Normal messages */

    const message = update?.message;

    if (!message?.chat?.id || !message?.from) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;

    /* The Hindu PDF */

    if (message.document) {
      const handled = await processTheHinduPdf(chatId, message);

      if (handled) {
        return NextResponse.json({
          ok: true,
          type: "the_hindu_pdf",
        });
      }

      await sendTelegramMessage(
        chatId,
        "⚠️ PDF document receive hua, lekin file PDF ke roop mein identify nahi hui. Please original PDF file bhejein."
      );

      return NextResponse.json({ ok: true });
    }

    /* /start */

    const text = String(message.text || "");

    if (text.startsWith("/start")) {
      await sendWelcomeMessage(chatId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log("WEBHOOK FATAL ERROR", error.message);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET — HEALTH CHECK
========================================================= */

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "SAMBHAV UPSC Telegram Webhook",
    channel: TELEGRAM_CHANNEL,
    app: SAMBHAV_APP_URL,
    processor:
      `${SAMBHAV_APP_URL.replace(/\/$/, "")}/api/current-affairs/the-hindu`,
    status: "ready",
  });
}
