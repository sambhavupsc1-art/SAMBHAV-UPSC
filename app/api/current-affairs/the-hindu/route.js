import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = "nodejs";

/* =========================================================
   ENV
========================================================= */

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
   PERFORMANCE
========================================================= */

const MAX_ARTICLES = 8;
const AI_CONCURRENCY = 3;

/* =========================================================
   LOCK
========================================================= */

const THE_HINDU_LOCK =
  globalThis.__SAMBHAV_THE_HINDU_LOCK ||
  new Set();

globalThis.__SAMBHAV_THE_HINDU_LOCK =
  THE_HINDU_LOCK;

/* =========================================================
   BASIC HELPERS
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
   LOGGING
========================================================= */

function logStep(name, data = null) {
  if (data === null) {
    console.log(`[THE HINDU] ${name}`);
  } else {
    console.log(`[THE HINDU] ${name}`, data);
  }
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
    data =
      text
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
   TELEGRAM
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
        method:
          body
            ? "POST"
            : "GET",

        headers:
          body
            ? {
                "Content-Type":
                  "application/json",
              }
            : undefined,

        body:
          body
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

/*
 * Intentionally disabled.
 * Existing Telegram webhook can still call this route.
 */
async function sendTelegramMessage(
  chatId,
  text
) {
  return;
}

/* =========================================================
   DOWNLOAD TELEGRAM PDF
========================================================= */

async function downloadTelegramPdf(
  fileId
) {
  logStep(
    "PDF DOWNLOAD START"
  );

  const file =
    await telegramApi(
      "getFile",
      {
        file_id:
          fileId,
      }
    );

  if (
    !file?.file_path
  ) {
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

  const buffer =
    Buffer.from(
      arrayBuffer
    );

  logStep(
    "PDF DOWNLOAD COMPLETE",
    {
      bytes:
        buffer.length,
      filePath:
        file.file_path,
    }
  );

  return {
    buffer,
    filePath:
      file.file_path,
  };
}

/* =========================================================
   PDF TEXT EXTRACTION
========================================================= */

async function extractPdfText(
  buffer
) {
  logStep(
    "PDF TEXT EXTRACTION START"
  );

  let parser = null;

  try {
    const canvas =
      await import(
        "@napi-rs/canvas"
      );

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

    const {
      CanvasFactory,
    } =
      await import(
        "pdf-parse/worker"
      );

    const {
      PDFParse,
    } =
      await import(
        "pdf-parse"
      );

    parser =
      new PDFParse({
        data:
          buffer,

        CanvasFactory,
      });

    const result =
      await parser.getText();

    const text =
      normalizeWhitespace(
        result?.text ||
          ""
      );

    if (
      !text ||
      text.length < 500
    ) {
      throw new Error(
        "PDF text extraction returned insufficient text"
      );
    }

    logStep(
      "PDF TEXT EXTRACTION COMPLETE",
      {
        characters:
          text.length,
      }
    );

    return text;
  } catch (error) {
    console.error(
      "[THE HINDU] PDF PARSE ERROR:",
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
      } catch {}
    }
  }
}

/* =========================================================
   DATE
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
      String(
        month
      ).toLowerCase()
    ];

  if (!monthNumber) {
    return null;
  }

  return `${year}-${monthNumber}-${String(
    day
  ).padStart(2, "0")}`;
}

function extractNewspaperDate(
  text
) {
  const source =
    String(
      text || ""
    );

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

  match =
    source.match(
      /\b(0?[1-9]|[12][0-9]|3[01])[\/-](0?[1-9]|1[0-2])[\/-](20\d{2})\b/
    );

  if (match) {
    return `${match[3]}-${String(
      match[2]
    ).padStart(2, "0")}-${String(
      match[1]
    ).padStart(2, "0")}`;
  }

  return null;
}

function extractNewspaperDateFromFileName(
  fileName
) {
  const source =
    String(
      fileName || ""
    );

  let match =
    source.match(
      /\b(0?[1-9]|[12][0-9]|3[01])[\/_-](0?[1-9]|1[0-2])[\/_-](20\d{2})\b/
    );

  if (match) {
    return `${match[3]}-${String(
      match[2]
    ).padStart(2, "0")}-${String(
      match[1]
    ).padStart(2, "0")}`;
  }

  match =
    source.match(
      /\b(20\d{2})[\/_-](0?[1-9]|1[0-2])[\/_-](0?[1-9]|[12][0-9]|3[01])\b/
    );

  if (match) {
    return `${match[1]}-${String(
      match[2]
    ).padStart(2, "0")}-${String(
      match[3]
    ).padStart(2, "0")}`;
  }

  return null;
}

function verifyPdfDate(
  pdfText,
  fileName = ""
) {
  const filenameDate =
    extractNewspaperDateFromFileName(
      fileName
    );

  const detectedDate =
    filenameDate ||
    extractNewspaperDate(
      pdfText
    );

  const currentDate =
    todayIST();

  if (!detectedDate) {
    return {
      valid: false,

      reason:
        "newspaper-date-not-found",

      detectedDate:
        null,

      currentDate,
    };
  }

  return {
    valid: true,

    detectedDate,

    currentDate,

    historical:
      detectedDate !==
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
  "judiciary",
  "federal",
  "governance",
  "disaster",
  "monsoon",
  "river",
  "water",
  "energy",
  "renewable",
  "nuclear",
  "semiconductor",
  "artificial intelligence",
  "ai",
  "digital",
  "telecom",
  "defence",
  "missile",
  "border",
  "china",
  "pakistan",
  "russia",
  "usa",
  "european union",
];

const LOW_VALUE_KEYWORDS = [
  "cricket",
  "football",
  "celebrity",
  "movie review",
  "film review",
  "horoscope",
  "entertainment",
  "fashion",
  "recipe",
  "lifestyle",
  "stock market tips",
];

function relevanceScore(
  text
) {
  const lower =
    String(
      text || ""
    ).toLowerCase();

  let score = 0;

  for (
    const keyword of
    UPSC_KEYWORDS
  ) {
    if (
      lower.includes(
        keyword
      )
    ) {
      score++;
    }
  }

  for (
    const keyword of
    LOW_VALUE_KEYWORDS
  ) {
    if (
      lower.includes(
        keyword
      )
    ) {
      score -= 3;
    }
  }

  return score;
}

/* =========================================================
   HEADLINE DETECTION
========================================================= */

function looksLikeHeadline(
  value
) {
  const line =
    cleanText(
      value
    );

  if (
    line.length < 25 ||
    line.length > 220
  ) {
    return false;
  }

  const lower =
    line.toLowerCase();

  const noise = [
    "the hindu",
    "thursday",
    "wednesday",
    "tuesday",
    "monday",
    "sunday",
    "saturday",
    "october 2026",
    "september 2026",
    "page ",
    "contents",
    "index",
    "advertisement",
    "advertising",
  ];

  return !noise.some(
    word =>
      lower.includes(
        word
      )
  );
}

/* =========================================================
   CANDIDATE EXTRACTION
========================================================= */

function splitIntoBlocks(
  text
) {
  const lines =
    normalizeWhitespace(
      text
    )
      .split("\n")
      .map(
        cleanText
      )
      .filter(Boolean);

  const blocks = [];

  let current = [];

  for (
    const line of lines
  ) {
    current.push(
      line
    );

    /*
     * Keep blocks reasonably small.
     */
    if (
      current.join(
        " "
      ).length >=
      1200
    ) {
      blocks.push(
        current.join(
          "\n"
        )
      );

      current = [];
    }
  }

  if (
    current.length
  ) {
    blocks.push(
      current.join(
        "\n"
      )
    );
  }

  return blocks;
}

function extractHeadline(
  lines
) {
  /*
   * Find the first plausible headline.
   *
   * PDF text extraction order is not always perfect,
   * so we examine the first several lines.
   */

  for (
    let i = 0;
    i <
      Math.min(
        lines.length,
        10
      );
    i++
  ) {
    if (
      looksLikeHeadline(
        lines[i]
      )
    ) {
      return {
        headline:
          cleanText(
            lines[i]
          ),

        subheadline:
          cleanText(
            lines[i + 1] ||
              ""
          ),
      };
    }
  }

  return {
    headline: "",
    subheadline: "",
  };
}

function inferTheHinduArticleType(headline, blockText) {
  const title = String(headline || "").trim().toLowerCase();
  const text = String(blockText || "").slice(0, 1800).toLowerCase();
  const openingLines = text.split("\n").slice(0, 10).join(" ");

  // Prefer explicit section labels/headline markers; avoid classifying a
  // normal news story as an editorial merely because its body says "opinion".
  const explicitEditorial = /(^|\b)(editorial|opinion|op-ed|leader|the hindu view|our view)(\b|[:|—-])/i.test(openingLines);
  const titleEditorial = /^(editorial|opinion|op-ed|the hindu view|our view)\s*[:|—-]/i.test(String(headline || ""));
  const commentaryHeadline = /\b(editorial|op-ed|opinion column)\b/i.test(title);

  return explicitEditorial || titleEditorial || commentaryHeadline
    ? "editorial"
    : "important_article";
}

function createArticleCandidates(
  pdfText
) {
  logStep(
    "ARTICLE EXTRACTION START"
  );

  const blocks =
    splitIntoBlocks(
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
      text.length <
      500
    ) {
      continue;
    }

    const score =
      relevanceScore(
        text
      );

    if (
      score < 3
    ) {
      continue;
    }

    const lines =
      text
        .split("\n")
        .map(
          cleanText
        )
        .filter(Boolean);

    if (
      lines.length <
      2
    ) {
      continue;
    }

    const {
      headline,
      subheadline,
    } =
      extractHeadline(
        lines
      );

    if (
      !headline
    ) {
      continue;
    }

    /*
     * Avoid generic/non-article headings.
     */
    const lower =
      headline.toLowerCase();

    const generic =
      [
        "home",
        "about",
        "contact",
        "current affairs",
        "latest news",
        "news",
        "opinion",
        "editorial",
        "sports",
      ].includes(
        lower
      );

    if (generic) {
      continue;
    }

    candidates.push({
      title:
        headline,

      original_headline:
        headline,

      original_subheadline:
        subheadline.length <=
        700
          ? subheadline
          : "",

      article_type:
        inferTheHinduArticleType(headline, text),

      content:
        text.slice(
          0,
          14000
        ),

      relevanceScore:
        score,
    });
  }

  logStep(
    "ARTICLE EXTRACTION COMPLETE",
    {
      blocks:
        blocks.length,

      candidates:
        candidates.length,
    }
  );

  return candidates;
}

/* =========================================================
   DUPLICATE HELPERS
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
    String(
      text || ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        " "
      )
      .split(
        /\s+/
      )
      .filter(
        token =>
          token.length > 2 &&
          !STOPWORDS.has(
            token
          )
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

  let common = 0;

  for (
    const token of left
  ) {
    if (
      right.has(token)
    ) {
      common++;
    }
  }

  const union =
    new Set([
      ...left,
      ...right,
    ]).size;

  return union
    ? common / union
    : 0;
}

function findDuplicateLocal(
  title,
  rows
) {
  for (
    const row of rows
  ) {
    const similarity =
      titleSimilarity(
        title,
        row.title
      );

    if (
      similarity >=
      0.78
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
   EXISTING ROWS
========================================================= */

async function getExistingRows(
  date
) {
  logStep(
    "SUPABASE EXISTING ROW CHECK START"
  );

  const rows =
    await supabaseRequest(
      `/rest/v1/current_affairs?select=id,title,source_name,source_url,date&date=eq.${escapeSupabase(
        date
      )}&limit=1000`
    );

  const result =
    Array.isArray(rows)
      ? rows
      : [];

  logStep(
    "SUPABASE EXISTING ROW CHECK COMPLETE",
    {
      rows:
        result.length,
    }
  );

  return result;
}

/* =========================================================
   AI
========================================================= */

async function processArticleWithAI(
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
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            items: [
              {
                title:
                  candidate.original_headline,

                original_headline:
                  candidate.original_headline,

                original_subheadline:
                  candidate.original_subheadline,

                date,

                source_name:
                  "The Hindu",

                source_url:
                  sourceUrl,

                content:
                  candidate.content,

                article_type:
                  candidate.article_type || "important_article",

                report_type:
                  candidate.article_type === "editorial"
                    ? "the_hindu_editorial"
                    : "the_hindu_important_article",
              },
            ],
          }),
      }
    );

  const text =
    await response.text();

  let data = null;

  try {
    data =
      text
        ? JSON.parse(
            text
          )
        : null;
  } catch {
    data = null;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      `AI route failed: ${response.status} ${text.slice(
        0,
        1500
      )}`
    );
  }

  return data;
}

/* =========================================================
   CONCURRENT AI PROCESSING
========================================================= */

async function processSelectedArticles(
  selected,
  date,
  fileUniqueId,
  existingRows
) {
  const results =
    new Array(
      selected.length
    );

  let nextIndex = 0;

  async function worker(
    workerId
  ) {
    while (true) {
      const index =
        nextIndex++;

      if (
        index >=
        selected.length
      ) {
        return;
      }

      const candidate =
        selected[index];

      try {
        logStep(
          `AI ARTICLE ${index + 1}/${selected.length} START`,
          {
            worker:
              workerId,

            title:
              candidate.original_headline,
          }
        );

        const slug =
          slugify(
            candidate.original_headline
          ) ||
          `article-${index + 1}`;

        const sourceUrl =
          `https://t.me/SAMBHAVUPSC1/the-hindu/${fileUniqueId}#${slug}`;

        /*
         * Exact source URL duplicate.
         */
        const urlDuplicate =
          existingRows.some(
            row =>
              String(
                row?.source_url ||
                  ""
              ) ===
              sourceUrl
          );

        if (
          urlDuplicate
        ) {
          results[index] = {
            title:
              candidate.original_headline,

            status:
              "skipped",

            reason:
              "source-url-duplicate",
          };

          continue;
        }

        /*
         * Same-event duplicate.
         */
        const duplicate =
          findDuplicateLocal(
            candidate.original_headline,
            existingRows
          );

        if (
          duplicate
        ) {
          results[index] = {
            title:
              candidate.original_headline,

            status:
              "skipped",

            reason:
              "same-event-already-exists",

            existingTitle:
              duplicate.title,

            existingSource:
              duplicate.source_name,

            similarity:
              duplicate.similarity,
          };

          continue;
        }

        const aiResult =
          await processArticleWithAI(
            candidate,
            date,
            sourceUrl
          );

        results[index] = {
          title:
            candidate.original_headline,

          status:
            "processed",

          ai:
            aiResult,
        };

        logStep(
          `AI ARTICLE ${index + 1}/${selected.length} COMPLETE`
        );
      } catch (error) {
        console.error(
          "[THE HINDU] ARTICLE FAILED:",
          candidate.original_headline,
          error
        );

        results[index] = {
          title:
            candidate.original_headline,

          status:
            "failed",

          error:
            error?.message ||
            "Unknown article error",
        };
      }
    }
  }

  const workers =
    Math.min(
      AI_CONCURRENCY,
      selected.length
    );

  await Promise.all(
    Array.from(
      {
        length:
          workers,
      },
      (_, i) =>
        worker(i + 1)
    )
  );

  return results;
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request
) {
  let telegramChatId =
    null;

  let fileUniqueId =
    null;

  let lockAcquired =
    false;

  try {
    logStep(
      "POST ROUTE INVOKED"
    );

    /* -----------------------------------------
       AUTH
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
      console.error(
        "[THE HINDU] UNAUTHORIZED REQUEST"
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

    const body =
      await request.json();

    telegramChatId =
      body?.telegram_chat_id ||
      null;

    const fileId =
      body?.file_id;

    fileUniqueId =
      body?.file_unique_id ||
      fileId;

    logStep(
      "REQUEST RECEIVED",
      {
        fileId:
          fileId
            ? "present"
            : "missing",

        fileUniqueId,

        fileName:
          body?.file_name ||
          "",
      }
    );

    if (!fileId) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "file_id is required",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       LOCK
    ----------------------------------------- */

    if (
      THE_HINDU_LOCK.has(
        fileUniqueId
      )
    ) {
      logStep(
        "DUPLICATE REQUEST WHILE PROCESSING"
      );

      return NextResponse.json({
        ok: true,

        duplicatePdf:
          true,

        reason:
          "pdf-already-processing",
      });
    }

    THE_HINDU_LOCK.add(
      fileUniqueId
    );

    lockAcquired =
      true;

    /* -----------------------------------------
       DOWNLOAD
    ----------------------------------------- */

    const downloaded =
      await downloadTelegramPdf(
        fileId
      );

    /* -----------------------------------------
       TEXT
    ----------------------------------------- */

    const pdfText =
      await extractPdfText(
        downloaded.buffer
      );

    /* -----------------------------------------
       DATE
    ----------------------------------------- */

    logStep(
      "DATE VERIFICATION START"
    );

    const dateCheck =
      verifyPdfDate(
        pdfText,
        body?.file_name ||
          ""
      );

    logStep(
      "DATE VERIFICATION COMPLETE",
      dateCheck
    );

    if (
      !dateCheck.valid
    ) {
      return NextResponse.json(
        {
          ok: false,

          processed:
            false,

          reason:
            dateCheck.reason,

          detectedDate:
            dateCheck.detectedDate,

          currentDate:
            dateCheck.currentDate,
        }
      );
    }

    const verifiedDate =
      dateCheck.detectedDate;

    /* -----------------------------------------
       EXISTING DB ROWS
    ----------------------------------------- */

    const existingRows =
      await getExistingRows(
        verifiedDate
      );

    /*
     * If this PDF was already processed,
     * detect it through its Telegram marker.
     */
    const marker =
      `/the-hindu/${fileUniqueId}#`;

    const existingPdfRows =
      existingRows.filter(
        row =>
          String(
            row?.source_url ||
              ""
          ).includes(
            marker
          )
      );

    if (
      existingPdfRows.length >
      0
    ) {
      logStep(
        "PDF ALREADY PROCESSED",
        {
          date:
            verifiedDate,

          existing:
            existingPdfRows.length,
        }
      );

      return NextResponse.json({
        ok: true,

        processed:
          true,

        duplicatePdf:
          true,

        reason:
          "pdf-already-processed",

        date:
          verifiedDate,

        existingArticles:
          existingPdfRows.length,
      });
    }

    /* -----------------------------------------
       ARTICLE EXTRACTION
    ----------------------------------------- */

    const candidates =
      createArticleCandidates(
        pdfText
      );

    if (
      !candidates.length
    ) {
      logStep(
        "NO UPSC ARTICLES FOUND"
      );

      return NextResponse.json({
        ok: true,

        processed:
          true,

        source:
          "The Hindu",

        date:
          verifiedDate,

        candidates:
          0,

        selected:
          0,

        processed:
          0,

        skipped:
          0,

        failed:
          0,

        message:
          "No UPSC-relevant articles found",
      });
    }

    /* -----------------------------------------
       SAME PDF DUPLICATES
    ----------------------------------------- */

    const uniqueCandidates =
      [];

    for (
      const candidate of
      candidates
    ) {
      const duplicate =
        uniqueCandidates.some(
          existing =>
            titleSimilarity(
              candidate.original_headline,
              existing.original_headline
            ) >=
            0.78
        );

      if (!duplicate) {
        uniqueCandidates.push(
          candidate
        );
      }
    }

    /* -----------------------------------------
       SELECT TOP ARTICLES
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
          MAX_ARTICLES
        );

    logStep(
      "ARTICLES SELECTED",
      {
        candidates:
          candidates.length,

        unique:
          uniqueCandidates.length,

        selected:
          selected.length,
      }
    );

    console.log(
      "[THE HINDU] SELECTED HEADLINES:",
      selected.map(
        article =>
          article.original_headline
      )
    );

    /* -----------------------------------------
       AI
    ----------------------------------------- */

    logStep(
      "AI PROCESSING START",
      {
        articles:
          selected.length,

        concurrency:
          AI_CONCURRENCY,
      }
    );

    const results =
      await processSelectedArticles(
        selected,
        verifiedDate,
        fileUniqueId,
        existingRows
      );

    /* -----------------------------------------
       COUNTS
    ----------------------------------------- */

    const processed =
      results.filter(
        x =>
          x?.status ===
          "processed"
      ).length;

    const skipped =
      results.filter(
        x =>
          x?.status ===
          "skipped"
      ).length;

    const failed =
      results.filter(
        x =>
          x?.status ===
          "failed"
      ).length;

    logStep(
      "PROCESSING COMPLETE",
      {
        date:
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

    return NextResponse.json({
      ok: true,

      processed:
        true,

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
      "================================================"
    );

    console.error(
      "[THE HINDU] FATAL ERROR:",
      error
    );

    console.error(
      "================================================"
    );

    await sendTelegramMessage(
      telegramChatId,
      [
        "❌ The Hindu processing failed",

        `Error: ${
          error?.message ||
          "Unknown error"
        }`,
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
  } finally {
    if (
      lockAcquired &&
      fileUniqueId
    ) {
      THE_HINDU_LOCK.delete(
        fileUniqueId
      );

      logStep(
        "PROCESSING LOCK RELEASED"
      );
    }
  }
}

/* =========================================================
   GET HEALTH CHECK
========================================================= */

export async function GET() {
  console.log(
    "[THE HINDU] GET HEALTH CHECK"
  );

  return NextResponse.json({
    ok: true,

    service:
      "SAMBHAV UPSC The Hindu PDF Pipeline",

    date:
      todayIST(),

    maxArticles:
      MAX_ARTICLES,

    aiConcurrency:
      AI_CONCURRENCY,

    imageProcessing:
      false,

    status:
      "ready",
  });
}
