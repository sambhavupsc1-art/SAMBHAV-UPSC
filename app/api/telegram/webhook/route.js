import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET;

// Official SAMBHAV UPSC Telegram Channel
const TELEGRAM_CHANNEL = "@SAMBHAVUPSC1";
const TELEGRAM_CHANNEL_URL = "https://t.me/SAMBHAVUPSC1";

// SAMBHAV UPSC App
const SAMBHAV_APP_URL =
  "https://sambhav-upsc.vercel.app/";

// Welcome image inside /public
const WELCOME_IMAGE_URL =
  "https://sambhav-upsc.vercel.app/sambhav-welcome.png";

/* =========================================================
   TELEGRAM API
========================================================= */

async function telegramApi(method, body) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is missing");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error(
        `Telegram ${method} error:`,
        data
      );
    }

    return data;
  } catch (error) {
    console.error(
      `Telegram ${method} request error:`,
      error
    );

    return null;
  }
}

/* =========================================================
   SEND TEXT MESSAGE
========================================================= */

async function sendTelegramMessage(
  chatId,
  text,
  replyMarkup = null
) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    ...(replyMarkup
      ? {
          reply_markup: replyMarkup,
        }
      : {}),
  });
}

/* =========================================================
   WELCOME MESSAGE
========================================================= */

async function sendWelcomeMessage(chatId) {
  const result = await telegramApi(
    "sendPhoto",
    {
      chat_id: chatId,

      photo: WELCOME_IMAGE_URL,

      caption:
        "Welcome to SAMBHAV UPSC\n\n" +
        "SAMBHAV UPSC se judne ke liye pehle hamara official channel join karein.",

      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Join Channel",
              url: TELEGRAM_CHANNEL_URL,
            },
          ],
          [
            {
              text: "I Have Joined / Continue",
              callback_data: "verify_channel",
            },
          ],
        ],
      },
    }
  );

  return result;
}

/* =========================================================
   CHECK CHANNEL MEMBERSHIP
========================================================= */

async function checkChannelMembership(
  telegramUserId
) {
  const result = await telegramApi(
    "getChatMember",
    {
      chat_id: TELEGRAM_CHANNEL,
      user_id: telegramUserId,
    }
  );

  if (!result?.ok) {
    console.error(
      "Membership verification failed:",
      result
    );

    return null;
  }

  const member = result.result;

  const status = member?.status;

  /*
   Telegram statuses:
   creator
   administrator
   member
   restricted
   left
   kicked
  */

  if (
    status === "creator" ||
    status === "administrator" ||
    status === "member"
  ) {
    return true;
  }

  // Restricted users can still be channel members
  if (
    status === "restricted" &&
    member?.is_member === true
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   VERIFIED USER MESSAGE
========================================================= */

async function sendVerifiedMessage(chatId) {
  return sendTelegramMessage(
    chatId,

    "Welcome to SAMBHAV UPSC\n\n" +
      "Channel verification successful.\n\n" +
      "Ab SAMBHAV UPSC app open karke signup karein.",

    {
      inline_keyboard: [
        [
          {
            text: "Open SAMBHAV UPSC",
            url: SAMBHAV_APP_URL,
          },
        ],
      ],
    }
  );
}

/* =========================================================
   NOT JOINED MESSAGE
========================================================= */

async function sendNotJoinedMessage(chatId) {
  return sendTelegramMessage(
    chatId,

    "SAMBHAV UPSC\n\n" +
      "Aapne abhi official channel join nahi kiya hai.\n\n" +
      "Pehle channel join karein, phir “I Have Joined / Continue” dabayein.",

    {
      inline_keyboard: [
        [
          {
            text: "Join Channel",
            url: TELEGRAM_CHANNEL_URL,
          },
        ],
        [
          {
            text: "I Have Joined / Continue",
            callback_data: "verify_channel",
          },
        ],
      ],
    }
  );
}

/* =========================================================
   VERIFICATION ERROR MESSAGE
========================================================= */

async function sendVerificationError(chatId) {
  return sendTelegramMessage(
    chatId,

    "SAMBHAV UPSC\n\n" +
      "Channel membership verify nahi ho pa rahi.\n\n" +
      "Please thodi der baad dobara try karein."
  );
}

/* =========================================================
   POST — TELEGRAM WEBHOOK
========================================================= */

export async function POST(request) {
  try {
    /* -----------------------------------------------------
       WEBHOOK SECURITY
    ----------------------------------------------------- */

    const secret =
      request.headers.get(
        "x-telegram-bot-api-secret-token"
      );

    if (
      !TELEGRAM_WEBHOOK_SECRET ||
      secret !== TELEGRAM_WEBHOOK_SECRET
    ) {
      console.error(
        "Telegram webhook unauthorized request"
      );

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

    /* -----------------------------------------------------
       READ TELEGRAM UPDATE
    ----------------------------------------------------- */

    const update = await request.json();

    /* =====================================================
       BUTTON CALLBACK
    ===================================================== */

    const callbackQuery =
      update?.callback_query;

    if (callbackQuery) {
      const callbackData =
        callbackQuery.data;

      const chatId =
        callbackQuery.message?.chat?.id;

      const telegramUser =
        callbackQuery.from;

      /* ---------------------------------------------------
         VERIFY CHANNEL BUTTON
      --------------------------------------------------- */

      if (
        callbackData === "verify_channel" &&
        chatId &&
        telegramUser?.id
      ) {
        // Remove Telegram button loading state
        await telegramApi(
          "answerCallbackQuery",
          {
            callback_query_id:
              callbackQuery.id,
          }
        );

        /* -----------------------------------------------
           CHECK MEMBERSHIP
        ----------------------------------------------- */

        const isMember =
          await checkChannelMembership(
            telegramUser.id
          );

        /* -----------------------------------------------
           VERIFICATION FAILED
        ----------------------------------------------- */

        if (isMember === null) {
          await sendVerificationError(
            chatId
          );

          return NextResponse.json({
            ok: true,
          });
        }

        /* -----------------------------------------------
           USER HAS NOT JOINED
        ----------------------------------------------- */

        if (!isMember) {
          await sendNotJoinedMessage(
            chatId
          );

          return NextResponse.json({
            ok: true,
          });
        }

        /* -----------------------------------------------
           USER HAS JOINED
        ----------------------------------------------- */

        await sendVerifiedMessage(
          chatId
        );

        return NextResponse.json({
          ok: true,
        });
      }

      return NextResponse.json({
        ok: true,
      });
    }

    /* =====================================================
       NORMAL TELEGRAM MESSAGE
    ===================================================== */

    const message = update?.message;

    if (
      !message?.from ||
      !message?.chat?.id
    ) {
      return NextResponse.json({
        ok: true,
      });
    }

    const chatId = message.chat.id;

    const text =
      message.text || "";

    /* =====================================================
       /START
    ===================================================== */

    if (text.startsWith("/start")) {
      await sendWelcomeMessage(
        chatId
      );

      return NextResponse.json({
        ok: true,
      });
    }

    /* =====================================================
       IGNORE OTHER MESSAGES
    ===================================================== */

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Telegram webhook error:",
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

/* =========================================================
   GET — WEBHOOK HEALTH CHECK
========================================================= */

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "SAMBHAV UPSC Telegram Webhook",
    channel: TELEGRAM_CHANNEL,
    app: SAMBHAV_APP_URL,
  });
}
