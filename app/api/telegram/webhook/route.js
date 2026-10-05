import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

const TELEGRAM_WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET;

// =========================================================
// SAMBHAV UPSC OFFICIAL CHANNEL
// =========================================================

const TELEGRAM_CHANNEL =
  "@SAMBHAVUPSC1";

const TELEGRAM_CHANNEL_URL =
  "https://t.me/SAMBHAVUPSC1";

// =========================================================
// SAMBHAV UPSC APP
// =========================================================

const SAMBHAV_APP_URL =
  "https://sambhav-upsc.vercel.app/";

// =========================================================
// WELCOME IMAGE
// =========================================================

const WELCOME_IMAGE_URL =
  "https://sambhav-upsc.vercel.app/sambhav-welcome.png";

/* =========================================================
   TELEGRAM API
========================================================= */

async function telegramApi(
  method,
  body
) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error(
      "TELEGRAM_BOT_TOKEN is missing"
    );

    return null;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(body),

        cache: "no-store",
      }
    );

    const data =
      await response.json();

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
  return telegramApi(
    "sendMessage",
    {
      chat_id: chatId,

      text,

      ...(replyMarkup
        ? {
            reply_markup:
              replyMarkup,
          }
        : {}),
    }
  );
}

/* =========================================================
   WELCOME MESSAGE
========================================================= */

async function sendWelcomeMessage(
  chatId
) {
  const caption =
    "🇮🇳 Welcome to SAMBHAV UPSC\n\n" +
    "Your preparation. Your SAMBHAV.\n\n" +
    "SAMBHAV UPSC is built for serious UPSC aspirants — " +
    "learn, practice and improve with a focused preparation ecosystem.\n\n" +
    "📚 Current Affairs\n" +
    "📝 PYQ Oriented Practice\n" +
    "🤖 AI Answer Evaluation\n" +
    "📖 Study Material\n" +
    "📊 Performance & Progress\n\n" +
    "पहले हमारे official Telegram channel से जुड़ें। " +
    "Channel verification के बाद ही SAMBHAV UPSC app access मिलेगा.";

  // =======================================================
  // PROFESSIONAL 2-COLUMN GRID
  // =======================================================

  const replyMarkup = {
    inline_keyboard: [

      // Row 1
      [
        {
          text:
            "📚 Current Affairs",
          callback_data:
            "info_current_affairs",
        },

        {
          text:
            "📝 PYQ Practice",
          callback_data:
            "info_pyq",
        },
      ],

      // Row 2
      [
        {
          text:
            "🤖 AI Evaluation",
          callback_data:
            "info_ai",
        },

        {
          text:
            "📖 Study Material",
          callback_data:
            "info_material",
        },
      ],

      // Row 3
      [
        {
          text:
            "📊 Performance",
          callback_data:
            "info_performance",
        },

        {
          text:
            "💬 SAMBHAV UPSC Helpline",
          url:
            TELEGRAM_CHANNEL_URL,
        },
      ],

      // Official Channel
      [
        {
          text:
            "📢 Join Official Channel",
          url:
            TELEGRAM_CHANNEL_URL,
        },
      ],

      // Verification
      [
        {
          text:
            "✓ I Have Joined / Continue",
          callback_data:
            "verify_channel",
        },
      ],
    ],
  };

  try {
    /*
      Telegram Vercel image URL ko directly fetch
      karne me problem aa rahi thi.

      Isliye pehle server image ko fetch karega
      aur phir Telegram ko upload karega.
    */

    const imageResponse =
      await fetch(
        WELCOME_IMAGE_URL,
        {
          cache: "no-store",
        }
      );

    if (!imageResponse.ok) {
      throw new Error(
        `Welcome image fetch failed: ${imageResponse.status}`
      );
    }

    const imageBlob =
      await imageResponse.blob();

    const formData =
      new FormData();

    formData.append(
      "chat_id",
      String(chatId)
    );

    formData.append(
      "photo",
      imageBlob,
      "sambhav-welcome.png"
    );

    formData.append(
      "caption",
      caption
    );

    formData.append(
      "reply_markup",
      JSON.stringify(
        replyMarkup
      )
    );

    const response =
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
        {
          method: "POST",

          body: formData,

          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!data.ok) {
      console.error(
        "Telegram sendPhoto upload error:",
        data
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Telegram welcome image upload error:",
      error
    );

    // Image fail hone par text flow continue rahega
    return sendTelegramMessage(
      chatId,
      caption,
      replyMarkup
    );
  }
}

/* =========================================================
   CHECK CHANNEL MEMBERSHIP
========================================================= */

async function checkChannelMembership(
  telegramUserId
) {
  const result =
    await telegramApi(
      "getChatMember",
      {
        chat_id:
          TELEGRAM_CHANNEL,

        user_id:
          telegramUserId,
      }
    );

  if (!result?.ok) {
    console.error(
      "Membership verification failed:",
      result
    );

    return null;
  }

  const member =
    result.result;

  const status =
    member?.status;

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

async function sendVerifiedMessage(
  chatId
) {
  return sendTelegramMessage(
    chatId,

    "🇮🇳 Welcome to SAMBHAV UPSC\n\n" +
      "✅ Channel verification successful.\n\n" +
      "Ab aap SAMBHAV UPSC app open karke signup kar sakte hain.\n\n" +
      "📚 Learn • Practice • Progress",

    {
      inline_keyboard: [
        [
          {
            text:
              "🚀 Open SAMBHAV UPSC",
            url:
              SAMBHAV_APP_URL,
          },
        ],
      ],
    }
  );
}

/* =========================================================
   NOT JOINED MESSAGE
========================================================= */

async function sendNotJoinedMessage(
  chatId
) {
  return sendTelegramMessage(
    chatId,

    "🔒 SAMBHAV UPSC\n\n" +
      "Aapne abhi official channel join nahi kiya hai.\n\n" +
      "Access continue karne ke liye pehle official channel join karein.\n\n" +
      "Channel join karne ke baad नीचे दिए गए button par click karein.",

    {
      inline_keyboard: [

        [
          {
            text:
              "📢 Join Official Channel",
            url:
              TELEGRAM_CHANNEL_URL,
          },
        ],

        [
          {
            text:
              "✓ I Have Joined / Continue",
            callback_data:
              "verify_channel",
          },
        ],

      ],
    }
  );
}

/* =========================================================
   VERIFICATION ERROR
========================================================= */

async function sendVerificationError(
  chatId
) {
  return sendTelegramMessage(
    chatId,

    "⚠️ SAMBHAV UPSC\n\n" +
      "Channel membership verify nahi ho pa rahi.\n\n" +
      "Please thodi der baad dobara try karein."
  );
}

/* =========================================================
   INFO BUTTON RESPONSES
========================================================= */

async function sendInfoMessage(
  chatId,
  type
) {
  const messages = {

    info_current_affairs:
      "📚 Current Affairs\n\n" +
      "UPSC-oriented current affairs aur important developments ko focused preparation ke liye organize kiya gaya hai.",

    info_pyq:
      "📝 PYQ Oriented Practice\n\n" +
      "Previous Year Questions ke through exam pattern, concepts aur question demand ko samajhne ke liye practice.",

    info_ai:
      "🤖 AI Answer Evaluation\n\n" +
      "Mains answers ko structured evaluation ke through analyse karke improvement areas identify karne ka system.",

    info_material:
      "📖 Study Material\n\n" +
      "UPSC preparation ke liye focused study resources aur subject-wise learning ecosystem.",

    info_performance:
      "📊 Performance\n\n" +
      "Aapki preparation, practice aur progress ko ek focused dashboard ke through track karne ka ecosystem.",
  };

  const message =
    messages[type];

  if (!message) {
    return sendTelegramMessage(
      chatId,
      "SAMBHAV UPSC"
    );
  }

  return sendTelegramMessage(
    chatId,
    message,

    {
      inline_keyboard: [
        [
          {
            text:
              "📢 Official Channel",
            url:
              TELEGRAM_CHANNEL_URL,
          },
        ],

        [
          {
            text:
              "← Back",
            callback_data:
              "back_to_welcome",
          },
        ],
      ],
    }
  );
}

/* =========================================================
   POST — TELEGRAM WEBHOOK
========================================================= */

export async function POST(
  request
) {
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
      secret !==
        TELEGRAM_WEBHOOK_SECRET
    ) {
      console.error(
        "Telegram webhook unauthorized request"
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* -----------------------------------------------------
       READ TELEGRAM UPDATE
    ----------------------------------------------------- */

    const update =
      await request.json();

    /* =====================================================
       CALLBACK QUERY
    ===================================================== */

    const callbackQuery =
      update?.callback_query;

    if (callbackQuery) {

      const callbackData =
        callbackQuery.data;

      const chatId =
        callbackQuery.message
          ?.chat?.id;

      const telegramUser =
        callbackQuery.from;

      /* ---------------------------------------------------
         VERIFY CHANNEL
      --------------------------------------------------- */

      if (
        callbackData ===
          "verify_channel" &&
        chatId &&
        telegramUser?.id
      ) {

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

        /* -----------------------------------------------
           VERIFICATION ERROR
        ----------------------------------------------- */

        if (
          isMember === null
        ) {

          await sendVerificationError(
            chatId
          );

          return NextResponse.json({
            ok: true,
          });
        }

        /* -----------------------------------------------
           NOT JOINED
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
           JOINED
        ----------------------------------------------- */

        await sendVerifiedMessage(
          chatId
        );

        return NextResponse.json({
          ok: true,
        });
      }

      /* ---------------------------------------------------
         INFORMATION BUTTONS
      --------------------------------------------------- */

      if (
        [
          "info_current_affairs",
          "info_pyq",
          "info_ai",
          "info_material",
          "info_performance",
        ].includes(
          callbackData
        ) &&
        chatId
      ) {

        await telegramApi(
          "answerCallbackQuery",
          {
            callback_query_id:
              callbackQuery.id,
          }
        );

        await sendInfoMessage(
          chatId,
          callbackData
        );

        return NextResponse.json({
          ok: true,
        });
      }

      /* ---------------------------------------------------
         BACK TO WELCOME
      --------------------------------------------------- */

      if (
        callbackData ===
          "back_to_welcome" &&
        chatId
      ) {

        await telegramApi(
          "answerCallbackQuery",
          {
            callback_query_id:
              callbackQuery.id,
          }
        );

        await sendWelcomeMessage(
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

    const message =
      update?.message;

    if (
      !message?.from ||
      !message?.chat?.id
    ) {
      return NextResponse.json({
        ok: true,
      });
    }

    const chatId =
      message.chat.id;

    const text =
      message.text || "";

    /* =====================================================
       /START
    ===================================================== */

    if (
      text.startsWith("/start")
    ) {

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
        error:
          "Internal server error",
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

    service:
      "SAMBHAV UPSC Telegram Webhook",

    channel:
      TELEGRAM_CHANNEL,

    app:
      SAMBHAV_APP_URL,
  });
}
