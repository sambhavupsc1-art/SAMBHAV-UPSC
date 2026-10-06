import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = "nodejs";

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

const TELEGRAM_WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SAMBHAV_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://sambhav-upsc.vercel.app";

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function escapeSupabase(value) {
  return encodeURIComponent(
    String(value || "")
  );
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/* =========================================================
   SUPABASE
========================================================= */

async function supabaseRequest(
  path,
  options = {}
) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase environment variables are missing"
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}${path}`,
    {
      ...options,

      headers: {
        apikey:
          SUPABASE_ANON_KEY,

        Authorization:
          `Bearer ${SUPABASE_ANON_KEY}`,

        "Content-Type":
          "application/json",

        ...(options.headers || {}),
      },
    }
  );

  const text =
    await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${
        typeof data === "string"
          ? data
          : JSON.stringify(data)
      }`
    );
  }

  return data;
}

/* =========================================================
   TELEGRAM API
========================================================= */

async function telegramApi(
  method,
  body = null
) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing"
    );
  }

  const response =
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: body
          ? "POST"
          : "GET",

        headers: body
          ? {
              "Content-Type":
                "application/json",
            }
          : undefined,

        body: body
          ? JSON.stringify(body)
          : undefined,
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data?.ok
  ) {
    throw new Error(
      `Telegram ${method} failed: ${JSON.stringify(
        data
      )}`
    );
  }

  return data.result;
}

/* =========================================================
   TELEGRAM COMPLETION MESSAGE
========================================================= */

async function sendTelegramMessage(
  chatId,
  text
) {
  if (!chatId) {
    console.log(
      "No Telegram chat ID available for completion message"
    );

    return;
  }

  try {
    await telegramApi(
      "sendMessage",
      {
        chat_id: chatId,

        text,

        parse_mode: "HTML",

        disable_web_page_preview: true,
      }
    );
  } catch (error) {
    /*
      Telegram notification failure must
      NOT make the whole PDF pipeline fail.
    */

    console.error(
      "TELEGRAM COMPLETION MESSAGE ERROR:",
      error
    );
  }
}

/* =========================================================
   DOWNLOAD TELEGRAM PDF
========================================================= */

async function downloadTelegramPdf(
  fileId
) {
  const file =
    await telegramApi(
      "getFile",
      {
        file_id: fileId,
      }
    );

  if (!file?.file_path) {
    throw new Error(
      "Telegram file_path not returned"
    );
  }

  const fileUrl =
    `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  const response =
    await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(
      `Telegram PDF download failed: ${response.status}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return {
    buffer:
      Buffer.from(arrayBuffer),

    filePath:
      file.file_path,
  };
}

/* =========================================================
   PDF TEXT EXTRACTION
   pdf-parse v2 + DOMMatrix FIX
========================================================= */

async function extractPdfText(
  buffer
) {
  let parser = null;

  try {
    /*
      Load native canvas BEFORE pdf-parse.
    */

    const canvas =
      await import(
        "@napi-rs/canvas"
      );

    /*
      PDF.js expects these browser
      globals in some environments.
    */

    if (
      canvas.DOMMatrix &&
      !globalThis.DOMMatrix
    ) {
      globalThis.DOMMatrix =
        canvas.DOMMatrix;
    }

    if (
      canvas.ImageData &&
      !globalThis.ImageData
    ) {
      globalThis.ImageData =
        canvas.ImageData;
    }

    if (
      canvas.Path2D &&
      !globalThis.Path2D
    ) {
      globalThis.Path2D =
        canvas.Path2D;
    }

    /*
      Load CanvasFactory.
    */

    const {
      CanvasFactory,
    } = await import(
      "pdf-parse/worker"
    );

    /*
      pdf-parse v2 API.
    */

    const {
      PDFParse,
    } = await import(
      "pdf-parse"
    );

    if (!PDFParse) {
      throw new Error(
        "PDFParse is not available from pdf-parse"
      );
    }

    parser =
      new PDFParse({
        data: buffer,

        CanvasFactory,
      });

    const result =
      await parser.getText();

    const text =
      normalizeWhitespace(
        result?.text || ""
      );

    if (
      !text ||
      text.length < 500
    ) {
      throw new Error(
        "PDF text extraction returned insufficient text"
      );
    }

    console.log(
      "PDF TEXT EXTRACTION SUCCESS:",
      text.length
    );

    return text;
  } catch (error) {
    console.error(
      "PDF PARSE ERROR:",
      error
    );

    throw new Error(
      `PDF parsing failed: ${
        error?.message ||
        "Unknown PDF parsing error"
      }`
    );
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.error(
          "PDF PARSER DESTROY ERROR:",
          destroyError
        );
      }
    }
  }
}

/* =========================================================
   DATE EXTRACTION
========================================================= */

const MONTHS = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function parseDateCandidate(
  day,
  month,
  year
) {
  const monthNumber =
    MONTHS[
      String(month).toLowerCase()
    ];

  if (!monthNumber) {
    return null;
  }

  const d =
    String(day).padStart(
      2,
      "0"
    );

  return `${year}-${monthNumber}-${d}`;
}

function extractNewspaperDate(
  text
) {
  const source =
    String(text || "");

  /*
    6 October 2026
    06 October 2026
  */

  let match =
    source.match(
      /\b(0?[1-9]|[12][0-9]|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i
    );

  if (match) {
    return parseDateCandidate(
      match[1],
      match[2],
      match[3]
    );
  }

  /*
    October 6, 2026
  */

  match =
    source.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12][0-9]|3[01]),?\s+(20\d{2})\b/i
    );

  if (match) {
    return parseDateCandidate(
      match[2],
      match[1],
      match[3]
    );
  }

  /*
    06/10/2026
    06-10-2026
  */

  match =
    source.match(
      /\b(0?[1-9]|[12][0-9]|3[01])[\/-](0?[1-9]|1[0-2])[\/-](20\d{2})\b/
    );

  if (match) {
    return `${match[3]}-${String(
      match[2]
    ).padStart(
      2,
      "0"
    )}-${String(
      match[1]
    ).padStart(
      2,
      "0"
    )}`;
  }

  return null;
}

/* =========================================================
   DATE VERIFICATION
========================================================= */

function verifyPdfDate(
  pdfText
) {
  const detectedDate =
    extractNewspaperDate(
      pdfText
    );

  if (!detectedDate) {
    return {
      valid: false,

      reason:
        "newspaper-date-not-found",

      detectedDate:
        null,

      currentDate:
        todayIST(),
    };
  }

  const currentDate =
    todayIST();

  if (
    detectedDate !==
    currentDate
  ) {
    return {
      valid: false,

      reason:
        "pdf-date-does-not-match-today",

      detectedDate,

      currentDate,
    };
  }

  return {
    valid: true,

    detectedDate,

    currentDate,
  };
}

/* =========================================================
   UPSC RELEVANCE
========================================================= */

const UPSC_KEYWORDS = [
  "government",
  "supreme court",
  "high court",
  "parliament",
  "constitution",
  "ministry",
  "policy",
  "bill",
  "act",
  "ordinance",
  "election",
  "international",
  "united nations",
  "india",
  "diplomacy",
  "bilateral",
  "multilateral",
  "economy",
  "inflation",
  "gdp",
  "fiscal",
  "monetary",
  "rbi",
  "banking",
  "agriculture",
  "farmer",
  "environment",
  "climate",
  "biodiversity",
  "forest",
  "wildlife",
  "pollution",
  "technology",
  "science",
  "space",
  "isro",
  "defence",
  "security",
  "cyber",
  "health",
  "education",
  "social justice",
  "tribal",
  "women",
  "child",
  "report",
  "index",
  "scheme",
  "mission",
  "committee",
  "commission",
  "court",
  "judiciary",
  "federal",
  "governance",
  "disaster",
];

const LOW_VALUE_KEYWORDS = [
  "cricket",
  "football",
  "match",
  "celebrity",
  "movie",
  "film review",
  "horoscope",
  "entertainment",
  "fashion",
  "recipe",
  "lifestyle",
  "obituary",
  "stock market tips",
  "classified",
];

function relevanceScore(
  text
) {
  const lower =
    String(text || "")
      .toLowerCase();

  let score = 0;

  for (
    const keyword
    of UPSC_KEYWORDS
  ) {
    if (
      lower.includes(keyword)
    ) {
      score += 1;
    }
  }

  for (
    const keyword
    of LOW_VALUE_KEYWORDS
  ) {
    if (
      lower.includes(keyword)
    ) {
      score -= 3;
    }
  }

  return score;
}

/* =========================================================
   ARTICLE BLOCK EXTRACTION
========================================================= */

function splitIntoCandidateBlocks(
  text
) {
  const cleaned =
    normalizeWhitespace(text);

  const lines =
    cleaned
      .split("\n")
      .map((line) =>
        cleanText(line)
      )
      .filter(Boolean);

  const blocks = [];

  let current = [];

  for (
    const line of lines
  ) {
    current.push(line);

    if (
      current.join(" ")
        .length >= 900
    ) {
      blocks.push(
        current.join("\n")
      );

      current = [];
    }
  }

  if (current.length) {
    blocks.push(
      current.join("\n")
    );
  }

  return blocks;
}

/* =========================================================
   ARTICLE CANDIDATE CREATION
========================================================= */

function createArticleCandidates(
  pdfText
) {
  const blocks =
    splitIntoCandidateBlocks(
      pdfText
    );

  const candidates = [];

  for (
    const block of blocks
  ) {
    const text =
      normalizeWhitespace(
        block
      );

    if (
      text.length < 350
    ) {
      continue;
    }

    const score =
      relevanceScore(text);

    if (score < 2) {
      continue;
    }

    const lines =
      text
        .split("\n")
        .map(cleanText)
        .filter(Boolean);

    if (!lines.length) {
      continue;
    }

    let title =
      lines
        .slice(0, 3)
        .find(
          (line) =>
            line.length >= 25 &&
            line.length <= 220
        ) || "";

    if (!title) {
      title = lines[0];
    }

    title =
      cleanText(title);

    if (
      title.length < 20 ||
      title.length > 250
    ) {
      continue;
    }

    candidates.push({
      title,

      content:
        text.slice(
          0,
          14000
        ),

      relevanceScore:
        score,
    });
  }

  return candidates;
}

/* =========================================================
   DUPLICATE NORMALIZATION
========================================================= */

const STOPWORDS =
  new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "from",
    "by",
    "is",
    "are",
    "as",
    "at",
    "after",
    "over",
    "new",
    "india",
  ]);

function duplicateTokens(
  text
) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        " "
      )
      .split(/\s+/)
      .filter(
        (token) =>
          token.length > 2 &&
          !STOPWORDS.has(token)
      )
  );
}

function titleSimilarity(
  a,
  b
) {
  const left =
    duplicateTokens(a);

  const right =
    duplicateTokens(b);

  if (
    !left.size ||
    !right.size
  ) {
    return 0;
  }

  let intersection = 0;

  for (
    const token of left
  ) {
    if (
      right.has(token)
    ) {
      intersection += 1;
    }
  }

  const union =
    new Set([
      ...left,
      ...right,
    ]).size;

  return union
    ? intersection / union
    : 0;
}

/* =========================================================
   EXISTING DB DUPLICATE CHECK
========================================================= */

async function findExistingDuplicate(
  title,
  date
) {
  const encodedDate =
    escapeSupabase(date);

  const rows =
    await supabaseRequest(
      `/rest/v1/current_affairs?select=id,title,source_name,source_url,date&date=eq.${encodedDate}&limit=200`
    );

  if (
    !Array.isArray(rows)
  ) {
    return null;
  }

  for (
    const row of rows
  ) {
    const similarity =
      titleSimilarity(
        title,
        row.title
      );

    if (
      similarity >= 0.78
    ) {
      return {
        ...row,

        similarity,
      };
    }
  }

  return null;
}

/* =========================================================
   SOURCE URL DUPLICATE
========================================================= */

async function sourceUrlExists(
  sourceUrl,
  date
) {
  const url =
    escapeSupabase(
      sourceUrl
    );

  const encodedDate =
    escapeSupabase(date);

  const rows =
    await supabaseRequest(
      `/rest/v1/current_affairs?select=id,title,source_name,source_url,date&source_url=eq.${url}&date=eq.${encodedDate}&limit=5`
    );

  return (
    Array.isArray(rows) &&
    rows.length > 0
  );
}

/* =========================================================
   SEND ARTICLE TO EXISTING AI ROUTE
========================================================= */

async function processThroughExistingAI(
  candidate,
  date,
  sourceUrl
) {
  const response =
    await fetch(
      `${SAMBHAV_APP_URL.replace(
        /\/$/,
        ""
      )}/api/current-affairs/ai`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            items: [
              {
                title:
                  candidate.title,

                date,

                source_name:
                  "The Hindu",

                source_url:
                  sourceUrl,

                content:
                  candidate.content,

                report_type:
                  "the_hindu_pdf",
              },
            ],
          }),
      }
    );

  const text =
    await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      `AI route failed: ${response.status} ${text.slice(
        0,
        2000
      )}`
    );
  }

  return data;
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request
) {
  let telegramChatId = null;

  try {
    /* -----------------------------------------
       SECURITY
    ----------------------------------------- */

    const internalSecret =
      request.headers.get(
        "x-sambhav-internal-secret"
      );

    if (
      !TELEGRAM_WEBHOOK_SECRET ||
      internalSecret !==
        TELEGRAM_WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    /* -----------------------------------------
       TELEGRAM INFORMATION
    ----------------------------------------- */

    telegramChatId =
      body?.telegram_chat_id ||
      null;

    const fileId =
      body?.file_id;

    const fileUniqueId =
      body?.file_unique_id ||
      fileId;

    const fileName =
      body?.file_name ||
      "the-hindu.pdf";

    if (!fileId) {
      return NextResponse.json(
        {
          error:
            "file_id is required",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "THE HINDU PIPELINE STARTED:",
      {
        fileName,
        fileUniqueId,
        telegramChatId,
      }
    );

    /* -----------------------------------------
       1. DOWNLOAD PDF
    ----------------------------------------- */

    const downloaded =
      await downloadTelegramPdf(
        fileId
      );

    /* -----------------------------------------
       2. EXTRACT PDF TEXT
    ----------------------------------------- */

    const pdfText =
      await extractPdfText(
        downloaded.buffer
      );

    console.log(
      "THE HINDU PDF TEXT LENGTH:",
      pdfText.length
    );

    /* -----------------------------------------
       3. VERIFY NEWSPAPER DATE
    ----------------------------------------- */

    const dateCheck =
      verifyPdfDate(
        pdfText
      );

    if (
      !dateCheck.valid
    ) {
      console.error(
        "THE HINDU DATE VERIFICATION FAILED:",
        dateCheck
      );

      /*
        Notify Telegram immediately
        if old/invalid PDF.
      */

      await sendTelegramMessage(
        telegramChatId,
        [
          "❌ <b>The Hindu PDF Rejected</b>",
          "",
          `📄 PDF date: <b>${
            dateCheck.detectedDate ||
            "Not found"
          }</b>`,
          `📅 Today: <b>${
            dateCheck.currentDate ||
            todayIST()
          }</b>`,
          "",
          "Old/invalid newspaper PDF ko Current Affairs me save nahi kiya gaya.",
        ].join("\n")
      );

      return NextResponse.json({
        ok: false,

        processed: false,

        reason:
          dateCheck.reason,

        detectedDate:
          dateCheck.detectedDate,

        currentDate:
          dateCheck.currentDate,
      });
    }

    const verifiedDate =
      dateCheck.detectedDate;

    /* -----------------------------------------
       4. EXTRACT ARTICLE CANDIDATES
    ----------------------------------------- */

    const candidates =
      createArticleCandidates(
        pdfText
      );

    console.log(
      "THE HINDU CANDIDATES:",
      candidates.length
    );

    /* -----------------------------------------
       5. REMOVE SAME-PDF DUPLICATES
    ----------------------------------------- */

    const uniqueCandidates =
      [];

    for (
      const candidate
      of candidates
    ) {
      const duplicate =
        uniqueCandidates.some(
          (existing) =>
            titleSimilarity(
              candidate.title,
              existing.title
            ) >= 0.78
        );

      if (!duplicate) {
        uniqueCandidates.push(
          candidate
        );
      }
    }

    /* -----------------------------------------
       6. SELECT TOP UPSC ARTICLES
    ----------------------------------------- */

    const selected =
      uniqueCandidates
        .sort(
          (a, b) =>
            b.relevanceScore -
            a.relevanceScore
        )
        .slice(
          0,
          20
        );

    const results = [];

    /* -----------------------------------------
       7. PROCESS ARTICLES
    ----------------------------------------- */

    for (
      let index = 0;
      index < selected.length;
      index++
    ) {
      const candidate =
        selected[index];

      try {
        /*
          Unique source URL per article.
        */

        const articleSlug =
          slugify(
            candidate.title
          ) ||
          `article-${index + 1}`;

        const sourceUrl =
          `https://t.me/SAMBHAVUPSC1/the-hindu/${fileUniqueId}#${articleSlug}`;

        /* ---------------------------------------
           EXACT SOURCE URL DUPLICATE
        --------------------------------------- */

        if (
          await sourceUrlExists(
            sourceUrl,
            verifiedDate
          )
        ) {
          results.push({
            title:
              candidate.title,

            status:
              "skipped",

            reason:
              "source-url-duplicate",
          });

          continue;
        }

        /* ---------------------------------------
           SAME EVENT DUPLICATE
        --------------------------------------- */

        const existing =
          await findExistingDuplicate(
            candidate.title,
            verifiedDate
          );

        if (existing) {
          results.push({
            title:
              candidate.title,

            status:
              "skipped",

            reason:
              "same-event-already-exists",

            existingTitle:
              existing.title,

            existingSource:
              existing.source_name,

            similarity:
              existing.similarity,
          });

          continue;
        }

        /* ---------------------------------------
           EXISTING AI PIPELINE
        --------------------------------------- */

        const aiResult =
          await processThroughExistingAI(
            candidate,
            verifiedDate,
            sourceUrl
          );

        results.push({
          title:
            candidate.title,

          status:
            "processed",

          ai:
            aiResult,
        });
      } catch (
        articleError
      ) {
        console.error(
          "THE HINDU ARTICLE ERROR:",
          candidate.title,
          articleError
        );

        results.push({
          title:
            candidate.title,

          status:
            "failed",

          error:
            articleError?.message ||
            "Unknown article error",
        });
      }
    }

    /* -----------------------------------------
       8. FINAL COUNTS
    ----------------------------------------- */

    const processed =
      results.filter(
        (item) =>
          item.status ===
          "processed"
      ).length;

    const skipped =
      results.filter(
        (item) =>
          item.status ===
          "skipped"
      ).length;

    const failed =
      results.filter(
        (item) =>
          item.status ===
          "failed"
      ).length;

    console.log(
      "THE HINDU PIPELINE COMPLETE:",
      {
        verifiedDate,

        candidates:
          candidates.length,

        selected:
          selected.length,

        processed,

        skipped,

        failed,
      }
    );

    /* -----------------------------------------
       9. TELEGRAM COMPLETION NOTIFICATION
    ----------------------------------------- */

    await sendTelegramMessage(
      telegramChatId,
      [
        "✅ <b>The Hindu Processing Complete</b>",
        "",
        `📅 Date: <b>${verifiedDate}</b>`,
        "",
        `📰 Articles found: <b>${candidates.length}</b>`,
        `📌 Selected: <b>${selected.length}</b>`,
        `✅ Processed: <b>${processed}</b>`,
        `♻️ Duplicates skipped: <b>${skipped}</b>`,
        `❌ Failed: <b>${failed}</b>`,
        "",
        "📚 Supabase/App update complete.",
      ].join("\n")
    );

    /* -----------------------------------------
       10. RESPONSE
    ----------------------------------------- */

    return NextResponse.json({
      ok: true,

      processed: true,

      source:
        "The Hindu",

      date:
        verifiedDate,

      candidates:
        candidates.length,

      selected:
        selected.length,

      processed,

      skipped,

      failed,

      results,
    });
  } catch (error) {
    console.error(
      "THE HINDU PIPELINE FATAL ERROR:",
      error
    );

    /*
      Fatal error notification.
    */

    await sendTelegramMessage(
      telegramChatId,
      [
        "❌ <b>The Hindu Processing Failed</b>",
        "",
        `Error: <code>${
          error?.message ||
          "Unknown error"
        }</code>`,
        "",
        "PDF process complete nahi ho paya.",
      ].join("\n")
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ||
          "The Hindu pipeline failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   GET HEALTH CHECK
========================================================= */

export async function GET() {
  return NextResponse.json({
    ok: true,

    service:
      "SAMBHAV UPSC The Hindu PDF Pipeline",

    date:
      todayIST(),
  });
}
