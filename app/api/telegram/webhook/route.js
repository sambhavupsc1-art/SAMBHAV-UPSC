import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const TELEGRAM_CHANNEL = "@SAMBHAVUPSC1";
const TELEGRAM_CHANNEL_URL = "https://t.me/SAMBHAVUPSC1";

const SAMBHAV_APP_URL = "https://sambhav-upsc.vercel.app/";

const WELCOME_IMAGE_URL =
  "https://sambhav-upsc.vercel.app/sambhav-welcome.png";

async function telegramApi(method, body) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error(`Telegram ${method} error:`, data);
    }

    return data;
  } catch (error) {
    console.error(`Telegram ${method} request error:`, error);
    return null;
  }
}

async function sendTelegramMessage(
  chatId,
  text,
  replyMarkup = undefined
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

async function sendWelcomeMessage(chatId) {
  return telegramApi("sendPhoto", {
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
  });
}

async function checkChannelMembership(telegramId) {
  const result = await telegramApi("getChatMember", {
    chat_id: TELEGRAM_CHANNEL,
    user_id: telegramId,
  });

  if (!result?.ok) {
    console.error(
      "Channel membership check failed:",
      result
    );

    return null;
  }

  const status = result.result?.status;

  return [
    "creator",
    "administrator",
    "member",
  ].includes(status);
}

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

    // -----------------------------------------
    // BUTTON CALLBACK
    // -----------------------------------------

    const callbackQuery =
      update?.callback_query;

    if (callbackQuery) {
      const callbackData =
        callbackQuery.data;

      const chatId =
        callbackQuery.message?.chat?.id;

      const telegramUser =
        callbackQuery.from;

      // ---------------------------------------
      // VERIFY CHANNEL
      // ---------------------------------------

      if (
        callbackData === "verify_channel" &&
        chatId &&
        telegramUser?.id
      ) {
        // Remove button loading state
        await telegramApi(
          "answerCallbackQuery",
          {
            callback_query_id:
              callbackQuery.id,
          }
        );

        const isMember =
          await checkChannelMembership(
            telegramUser.id
          );

        // -------------------------------------
        // VERIFICATION ERROR
        // -------------------------------------

        if (isMember === null) {
          await sendTelegramMessage(
            chatId,
            "SAMBHAV UPSC\n\n" +
              "Channel membership verify nahi ho pa rahi.\n\n" +
              "Please thodi der baad dobara try karein."
          );

          return NextResponse.json({
            ok: true,
          });
        }

        // -------------------------------------
        // NOT JOINED
        // -------------------------------------

        if (!isMember) {
          await sendTelegramMessage(
            chatId,
            "SAMBHAV UPSC\n\n" +
              "Aapne abhi official channel join nahi kiya hai.\n\n" +
              "Pehle channel join karein, phir " +
              "“I Have Joined / Continue” dabayein.",
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
                    text:
                      "I Have Joined / Continue",
                    callback_data:
                      "verify_channel",
                  },
                ],
              ],
            }
          );

          return NextResponse.json({
            ok: true,
          });
        }

        // -------------------------------------
        // JOINED
        // -------------------------------------

        await sendVerifiedMessage(chatId);

        return NextResponse.json({
          ok: true,
        });
      }

      return NextResponse.json({
        ok: true,
      });
    }

    // -----------------------------------------
    // NORMAL MESSAGE
    // -----------------------------------------

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
    // WELCOME FLOW
    // -----------------------------------------

    await sendWelcomeMessage(chatId);

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
