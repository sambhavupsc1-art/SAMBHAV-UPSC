1.import { NextResponse } from "next/server";

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

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SAMBHAV_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://sambhav-upsc.vercel.app";

const THE_HINDU_HEADLINE_BUCKET =
  "the-hindu-headlines";

const HEADLINE_RENDER_SCALE = 2.2;

/*
 * Headline matching settings.
 *
 * The old version was too strict.
 * This version searches larger windows and
 * uses multiple matching signals.
 */
const MAX_HEADLINE_LINES = 10;
const MIN_HEADLINE_COVERAGE = 0.40;
const MIN_HEADLINE_TOKENS = 2;

/* =========================================================
   PROCESSING LOCK
========================================================= */

const THE_HINDU_PROCESSING_LOCK =
  globalThis.__SAMBHAV_THE_HINDU_PROCESSING_LOCK ||
  new Set();

globalThis.__SAMBHAV_THE_HINDU_PROCESSING_LOCK =
  THE_HINDU_PROCESSING_LOCK;

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
   SUPABASE SERVICE ROLE PATCH
========================================================= */

async function updateCurrentAffairsRow(
  id,
  payload
) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing"
    );
  }

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/current_affairs?id=eq.${encodeURIComponent(
        String(id)
      )}`,
      {
        method: "PATCH",

        headers: {
          apikey:
            SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

          "Content-Type":
            "application/json",

          Prefer:
            "return=minimal",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase row update failed: ${response.status} ${text}`
    );
  }

  return true;
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

async function sendTelegramMessage(
  chatId,
  text
) {
  if (!chatId) return;

  try {
    await telegramApi(
      "sendMessage",
      {
        chat_id:
          chatId,

        text,

        parse_mode:
          "HTML",

        disable_web_page_preview:
          true,
      }
    );
  } catch (error) {
    console.error(
      "TELEGRAM MESSAGE ERROR:",
      error
    );
  }
}

/* =========================================================
   TELEGRAM PDF DOWNLOAD
========================================================= */

async function downloadTelegramPdf(
  fileId
) {
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

  return {
    buffer:
      Buffer.from(
        arrayBuffer
      ),

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
      } catch {}
    }
  }
}

/* =========================================================
   HEADLINE NORMALIZATION
========================================================= */

function normalizeHeadlineForMatch(
  value = ""
) {
  return String(value)
    .toLowerCase()
    .replace(
      /[“”‘’"'`]/g,
      ""
    )
    .replace(
      /[–—−-]/g,
      " "
    )
    .replace(
      /[^a-z0-9\u0900-\u097f\s]/gi,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function headlineTokens(
  value = ""
) {
  return normalizeHeadlineForMatch(
    value
  )
    .split(" ")
    .filter(
      (token) =>
        token.length >= 2
    );
}

function uniqueTokens(
  value = ""
) {
  return [
    ...new Set(
      headlineTokens(
        value
      )
    ),
  ];
}

function tokenOverlap(
  a = "",
  b = ""
) {
  const A =
    new Set(
      headlineTokens(a)
    );

  const B =
    new Set(
      headlineTokens(b)
    );

  if (
    !A.size ||
    !B.size
  ) {
    return 0;
  }

  let common = 0;

  for (
    const token of A
  ) {
    if (
      B.has(token)
    ) {
      common++;
    }
  }

  return (
    common /
    Math.max(
      1,
      Math.min(
        A.size,
        B.size
      )
    )
  );
}

/* =========================================================
   SEQUENCE SCORE
========================================================= */

function sequenceScore(
  wanted,
  candidate
) {
  const wantedTokens =
    headlineTokens(
      wanted
    );

  const candidateTokens =
    headlineTokens(
      candidate
    );

  if (
    !wantedTokens.length ||
    !candidateTokens.length
  ) {
    return 0;
  }

  let best = 0;

  for (
    let start = 0;
    start <
      candidateTokens.length;
    start++
  ) {
    let matched = 0;

    for (
      let i = 0;
      i <
        wantedTokens.length &&
        start + i <
          candidateTokens.length;
      i++
    ) {
      if (
        wantedTokens[i] ===
        candidateTokens[
          start + i
        ]
      ) {
        matched++;
      } else {
        break;
      }
    }

    best =
      Math.max(
        best,
        matched
      );
  }

  return (
    best /
    Math.max(
      1,
      wantedTokens.length
    )
  );
}

/* =========================================================
   PDF TEXT COORDINATES
========================================================= */

function buildPdfTextLines(
  pdfjsLib,
  textContent,
  viewport
) {
  const items =
    (
      textContent?.items ||
      []
    )
      .filter(
        (item) =>
          item &&
          typeof item.str ===
            "string" &&
          item.str.trim()
      )
      .map((item) => {
        const transformed =
          pdfjsLib.Util.transform(
            viewport.transform,
            item.transform
          );

        const x =
          Number(
            transformed[4]
          ) || 0;

        const y =
          Number(
            transformed[5]
          ) || 0;

        /*
         * IMPORTANT:
         *
         * transformed coordinates are
         * already viewport-scaled.
         *
         * Do NOT multiply width by
         * scale again.
         */

        const rawWidth =
          Math.abs(
            Number(
              item.width
            ) || 0
          );

        const width =
          Math.max(
            1,
            rawWidth *
              (
                viewport.scale ||
                1
              )
          );

        const height =
          Math.max(
            5,
            Math.sqrt(
              (
                transformed[2] ||
                0
              ) *
                (
                  transformed[2] ||
                  0
                ) +
                (
                  transformed[3] ||
                  0
                ) *
                  (
                    transformed[3] ||
                    0
                  )
            )
          );

        return {
          text:
            String(
              item.str ||
                ""
            ).trim(),

          x,

          y,

          width,

          height,
        };
      });

  const lines = [];

  for (
    const item of items
  ) {
    let existing =
      null;

    for (
      const line of lines
    ) {
      const tolerance =
        Math.max(
          3,
          Math.min(
            14,
            Math.max(
              line.height ||
                0,

              item.height ||
                0
            ) *
              0.65
          )
        );

      if (
        Math.abs(
          line.y -
            item.y
        ) <=
        tolerance
      ) {
        existing =
          line;

        break;
      }
    }

    if (
      existing
    ) {
      existing.items.push(
        item
      );

      existing.x1 =
        Math.min(
          existing.x1,
          item.x
        );

      existing.x2 =
        Math.max(
          existing.x2,
          item.x +
            item.width
        );

      existing.y1 =
        Math.min(
          existing.y1,
          item.y -
            item.height
        );

      existing.y2 =
        Math.max(
          existing.y2,
          item.y
        );

      existing.height =
        Math.max(
          existing.height ||
            0,

          item.height ||
            0
        );

      existing.y =
        existing.items.reduce(
          (
            sum,
            current
          ) =>
            sum +
            current.y,

          0
        ) /
        existing.items.length;
    } else {
      lines.push({
        y:
          item.y,

        items: [
          item,
        ],

        x1:
          item.x,

        x2:
          item.x +
          item.width,

        y1:
          item.y -
          item.height,

        y2:
          item.y,

        height:
          item.height,
      });
    }
  }

  for (
    const line of lines
  ) {
    line.items.sort(
      (
        a,
        b
      ) =>
        a.x -
        b.x
    );

    line.text =
      line.items
        .map(
          (
            item
          ) =>
            item.text
        )
        .join(" ")
        .replace(
          /\s+/g,
          " "
        )
        .trim();
  }

  /*
   * PDF viewport coordinates
   * normally increase downward
   * after viewport transform.
   *
   * Sort top -> bottom.
   */

  lines.sort(
    (
      a,
      b
    ) => {
      if (
        Math.abs(
          a.y -
            b.y
        ) < 2
      ) {
        return (
          a.x1 -
          b.x1
        );
      }

      return (
        a.y -
        b.y
      );
    }
  );

  return lines;
}

/* =========================================================
   SCORE HEADLINE WINDOW
========================================================= */

function scoreHeadlineWindow(
  wanted,
  candidate
) {
  const wantedTokens =
    uniqueTokens(
      wanted
    );

  const candidateTokens =
    uniqueTokens(
      candidate
    );

  if (
    wantedTokens.length <
    MIN_HEADLINE_TOKENS ||
    candidateTokens.length ===
      0
  ) {
    return {
      score: 0,
      coverage: 0,
      overlap: 0,
      sequence: 0,
      exact: false,
    };
  }

  const candidateSet =
    new Set(
      candidateTokens
    );

  let matched =
    0;

  for (
    const token of
    wantedTokens
  ) {
    if (
      candidateSet.has(
        token
      )
    ) {
      matched++;
    }
  }

  const coverage =
    matched /
    Math.max(
      1,
      wantedTokens.length
    );

  const overlap =
    tokenOverlap(
      wanted,
      candidate
    );

  const sequence =
    sequenceScore(
      wanted,
      candidate
    );

  const wantedCompact =
    normalizeHeadlineForMatch(
      wanted
    ).replace(
      /\s+/g,
      ""
    );

  const candidateCompact =
    normalizeHeadlineForMatch(
      candidate
    ).replace(
      /\s+/g,
      ""
    );

  const exact =
    candidateCompact.includes(
      wantedCompact
    ) ||
    wantedCompact.includes(
      candidateCompact
    );

  let score =
    coverage * 0.55 +
    overlap * 0.20 +
    sequence * 0.25;

  if (
    exact
  ) {
    score +=
      0.30;
  }

  /*
   * Penalize windows that are
   * massively larger than the
   * requested headline.
   */

  const extra =
    Math.max(
      0,
      candidateTokens.length -
        wantedTokens.length
    );

  const extraRatio =
    extra /
    Math.max(
      1,
      wantedTokens.length
    );

  score -=
    Math.min(
      0.15,
      extraRatio *
        0.04
    );

  return {
    score,
    coverage,
    overlap,
    sequence,
    exact,
  };
}

/* =========================================================
   FIND BEST HEADLINE ON ONE PAGE
========================================================= */

function findBestHeadlineOnPage(
  lines,
  wanted
) {
  if (
    !lines?.length ||
    !wanted
  ) {
    return null;
  }

  let best =
    null;

  /*
   * Search 1 through 10 consecutive
   * visual lines.
   */

  for (
    let start = 0;
    start <
      lines.length;
    start++
  ) {
    let combined =
      "";

    for (
      let count = 1;
      count <=
        MAX_HEADLINE_LINES &&
      start + count <=
        lines.length;
      count++
    ) {
      const current =
        lines[
          start +
            count -
            1
        ];

      if (
        !current?.text
      ) {
        continue;
      }

      if (
        count > 1
      ) {
        const previous =
          lines[
            start +
              count -
              2
          ];

        const gap =
          Math.abs(
            current.y -
              previous.y
          );

        const maxGap =
          Math.max(
            75,
            Math.max(
              current.height ||
                0,

              previous.height ||
                0
            ) *
              4
          );

        if (
          gap >
          maxGap
        ) {
          break;
        }
      }

      combined =
        `${combined} ${current.text}`
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      const metrics =
        scoreHeadlineWindow(
          wanted,
          combined
        );

      if (
        !best ||
        metrics.score >
          best.score
      ) {
        best = {
          ...metrics,

          start,

          count,

          lines:
            lines.slice(
              start,
              start +
                count
            ),

          text:
            combined,
        };
      }

      /*
       * If exact match found,
       * don't unnecessarily extend
       * the window.
       */

      if (
        metrics.exact &&
        metrics.coverage >=
          0.85
      ) {
        break;
      }
    }
  }

  return best;
}

/* =========================================================
   CREATE PAGE LINE CACHE
========================================================= */

async function extractPdfPageLines(
  pdfjsLib,
  pdf
) {
  const pageCache =
    [];

  for (
    let pageNumber = 1;
    pageNumber <=
      pdf.numPages;
    pageNumber++
  ) {
    const page =
      await pdf.getPage(
        pageNumber
      );

    try {
      const viewport =
        page.getViewport({
          scale:
            HEADLINE_RENDER_SCALE,
        });

      const textContent =
        await page.getTextContent({
          normalizeWhitespace:
            false,

          disableCombineTextItems:
            true,
        });

      const lines =
        buildPdfTextLines(
          pdfjsLib,
          textContent,
          viewport
        );

      pageCache.push({
        pageNumber,

        viewport,

        lines,
      });
    } finally {
      page.cleanup();
    }
  }

  return pageCache;
}

/* =========================================================
   FIND BEST HEADLINE IN COMPLETE PDF
========================================================= */

function findBestHeadlineInPageCache(
  pageCache,
  headline
) {
  let best =
    null;

  for (
    const pageData of
    pageCache
  ) {
    const match =
      findBestHeadlineOnPage(
        pageData.lines,
        headline
      );

    if (
      !match
    ) {
      continue;
    }

    if (
      !best ||
      match.score >
        best.score
    ) {
      best = {
        ...match,

        pageNumber:
          pageData.pageNumber,

        viewport:
          pageData.viewport,
      };
    }
  }

  return best;
}

/* =========================================================
   EXTRACT PDF HEADLINE CANDIDATES
   FALLBACK FOR AI/DB TITLE MISMATCH
========================================================= */

function extractPdfHeadlineCandidates(
  pageCache
) {
  const candidates =
    [];

  for (
    const pageData of
    pageCache
  ) {
    const lines =
      pageData.lines ||
      [];

    /*
     * We generate candidate windows
     * from 1-5 lines first.
     *
     * This is enough for newspaper
     * headlines without producing
     * too many body-text candidates.
     */

    for (
      let start = 0;
      start <
        lines.length;
      start++
    ) {
      let combined =
        "";

      for (
        let count = 1;
        count <= 5 &&
        start + count <=
          lines.length;
        count++
      ) {
        const line =
          lines[
            start +
              count -
              1
          ];

        if (
          !line?.text
        ) {
          continue;
        }

        combined =
          `${combined} ${line.text}`
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        const tokens =
          uniqueTokens(
            combined
          );

        if (
          tokens.length <
          3
        ) {
          continue;
        }

        /*
         * Very long windows are
         * likely article body text.
         */

        if (
          combined.length >
          260
        ) {
          continue;
        }

        candidates.push({
          pageNumber:
            pageData.pageNumber,

          lines:
            lines.slice(
              start,
              start +
                count
            ),

          text:
            combined,

          tokenCount:
            tokens.length,
        });
      }
    }
  }

  return candidates;
}

/* =========================================================
   FIND HEADLINE USING CANDIDATE FALLBACK
========================================================= */

function findHeadlineViaCandidates(
  headline,
  candidates
) {
  let best =
    null;

  for (
    const candidate of
    candidates
  ) {
    const metrics =
      scoreHeadlineWindow(
        headline,
        candidate.text
      );

    if (
      !best ||
      metrics.score >
        best.score
    ) {
      best = {
        ...metrics,

        pageNumber:
          candidate.pageNumber,

        lines:
          candidate.lines,

        text:
          candidate.text,
      };
    }
  }

  return best;
}

/* =========================================================
   UPLOAD HEADLINE IMAGE
========================================================= */

async function uploadHeadlineImage(
  imageBuffer,
  fileUniqueId,
  headline
) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing"
    );
  }

  const safeId =
    String(
      fileUniqueId ||
        "pdf"
    ).replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );

  const headlineSlug =
    slugify(
      headline
    ) ||
    "headline";

  const filePath =
    `${safeId}/${headlineSlug}.png`;

  const uploadUrl =
    `${SUPABASE_URL}/storage/v1/object/` +
    `${THE_HINDU_HEADLINE_BUCKET}/${filePath}`;

  const response =
    await fetch(
      uploadUrl,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

          apikey:
            SUPABASE_SERVICE_ROLE_KEY,

          "Content-Type":
            "image/png",

          "x-upsert":
            "true",
        },

        body:
          imageBuffer,
      }
    );

  const responseText =
    await response.text();

  if (
    !response.ok
  ) {
    throw new Error(
      `Headline image upload failed: ${response.status} ${responseText}`
    );
  }

  return (
    `${SUPABASE_URL}/storage/v1/object/public/` +
    `${THE_HINDU_HEADLINE_BUCKET}/${filePath}`
  );
}

/* =========================================================
   RENDER + CROP MATCHED HEADLINE
========================================================= */

async function renderAndUploadHeadline(
  pdf,
  createCanvas,
  match,
  fileUniqueId,
  headline
) {
  if (
    !match ||
    !match.pageNumber ||
    !Array.isArray(
      match.lines
    ) ||
    !match.lines.length
  ) {
    return "";
  }

  const page =
    await pdf.getPage(
      match.pageNumber
    );

  try {
    const viewport =
      page.getViewport({
        scale:
          HEADLINE_RENDER_SCALE,
      });

    const pageCanvas =
      createCanvas(
        Math.ceil(
          viewport.width
        ),

        Math.ceil(
          viewport.height
        )
      );

    const pageContext =
      pageCanvas.getContext(
        "2d"
      );

    /*
     * White background.
     */

    pageContext.fillStyle =
      "#ffffff";

    pageContext.fillRect(
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    await page.render({
      canvasContext:
        pageContext,

      viewport,
    }).promise;

    let x1 =
      Infinity;

    let y1 =
      Infinity;

    let x2 =
      -Infinity;

    let y2 =
      -Infinity;

    for (
      const line of
      match.lines
    ) {
      if (!line) {
        continue;
      }

      x1 =
        Math.min(
          x1,
          line.x1
        );

      y1 =
        Math.min(
          y1,
          line.y1
        );

      x2 =
        Math.max(
          x2,
          line.x2
        );

      y2 =
        Math.max(
          y2,
          line.y2
        );
    }

    if (
      !Number.isFinite(
        x1
      ) ||
      !Number.isFinite(
        y1
      ) ||
      !Number.isFinite(
        x2
      ) ||
      !Number.isFinite(
        y2
      ) ||
      x2 <= x1 ||
      y2 <= y1
    ) {
      return "";
    }

    /*
     * Headline crop padding.
     */

    const paddingX =
      28;

    const paddingY =
      22;

    x1 =
      Math.max(
        0,
        Math.floor(
          x1 -
            paddingX
        )
      );

    y1 =
      Math.max(
        0,
        Math.floor(
          y1 -
            paddingY
        )
      );

    x2 =
      Math.min(
        pageCanvas.width,

        Math.ceil(
          x2 +
            paddingX
        )
      );

    y2 =
      Math.min(
        pageCanvas.height,

        Math.ceil(
          y2 +
            paddingY
        )
      );

    const cropWidth =
      Math.max(
        1,
        x2 -
          x1
      );

    const cropHeight =
      Math.max(
        1,
        y2 -
          y1
      );

    /*
     * Safety:
     * never upload a gigantic body-text crop.
     */

    if (
      cropWidth >
        pageCanvas.width ||
      cropHeight >
        pageCanvas.height
    ) {
      return "";
    }

    const cropCanvas =
      createCanvas(
        cropWidth,
        cropHeight
      );

    const cropContext =
      cropCanvas.getContext(
        "2d"
      );

    cropContext.fillStyle =
      "#ffffff";

    cropContext.fillRect(
      0,
      0,
      cropWidth,
      cropHeight
    );

    cropContext.drawImage(
      pageCanvas,

      x1,
      y1,

      cropWidth,
      cropHeight,

      0,
      0,

      cropWidth,
      cropHeight
    );

    const imageBuffer =
      cropCanvas.toBuffer(
        "image/png"
      );

    const publicUrl =
      await uploadHeadlineImage(
        imageBuffer,

        fileUniqueId,

        headline
      );

    console.log(
      "THE HINDU HEADLINE IMAGE CREATED:",
      {
        headline,
        page:
          match.pageNumber,

        score:
          match.score,

        coverage:
          match.coverage,

        overlap:
          match.overlap,

        sequence:
          match.sequence,

        exact:
          match.exact,

        text:
          match.text,

        url:
          publicUrl,
      }
    );

    return publicUrl;
  } finally {
    page.cleanup();
  }
}

/* =========================================================
   CREATE ACTUAL THE HINDU HEADLINE IMAGE
========================================================= */

async function createTheHinduHeadlineImage(
  pdfBuffer,
  headline,
  fileUniqueId
) {
  if (
    !headline ||
    !pdfBuffer
  ) {
    return "";
  }

  let pdf =
    null;

  try {
    const pdfjsLib =
      await import(
        "pdfjs-dist/legacy/build/pdf.mjs"
      );

    const {
      createCanvas,
    } =
      await import(
        "@napi-rs/canvas"
      );

    const loadingTask =
      pdfjsLib.getDocument({
        data:
          new Uint8Array(
            pdfBuffer
          ),

        disableWorker:
          true,

        useSystemFonts:
          true,

        isEvalSupported:
          false,
      });

    pdf =
      await loadingTask.promise;

    /*
     * Build page text/layout
     * once instead of re-parsing
     * for every candidate.
     */

    const pageCache =
      await extractPdfPageLines(
        pdfjsLib,
        pdf
      );

    if (
      !pageCache.length
    ) {
      return "";
    }

    /*
     * PASS 1:
     * Direct title -> PDF line matching.
     */

    let bestMatch =
      findBestHeadlineInPageCache(
        pageCache,
        headline
      );

    console.log(
      "THE HINDU HEADLINE DIRECT MATCH:",
      {
        headline,

        found:
          !!bestMatch,

        score:
          bestMatch?.score ||
          0,

        coverage:
          bestMatch?.coverage ||
          0,

        text:
          bestMatch?.text ||
          "",
      }
    );

    /*
     * PASS 2:
     * Generate PDF headline-like candidates
     * and compare DB title against them.
     *
     * This handles cases where the stored
     * title differs slightly from the PDF
     * text extraction.
     */

    if (
      !bestMatch ||
      bestMatch.coverage <
        MIN_HEADLINE_COVERAGE
    ) {
      const candidates =
        extractPdfHeadlineCandidates(
          pageCache
        );

      const fallback =
        findHeadlineViaCandidates(
          headline,
          candidates
        );

      console.log(
        "THE HINDU HEADLINE FALLBACK MATCH:",
        {
          headline,

          found:
            !!fallback,

          score:
            fallback?.score ||
            0,

          coverage:
            fallback?.coverage ||
            0,

          text:
            fallback?.text ||
            "",
        }
      );

      if (
        fallback &&
        (
          !bestMatch ||
          fallback.score >
            bestMatch.score
        )
      ) {
        bestMatch =
          fallback;
      }
    }

    /*
     * PASS 3:
     * If token coverage is still low,
     * use a relaxed candidate match.
     *
     * We still require at least two
     * meaningful tokens to avoid random
     * body-text crops.
     */

    if (
      !bestMatch ||
      (
        bestMatch.coverage <
          0.30 &&
        !bestMatch.exact
      )
    ) {
      console.warn(
        "THE HINDU HEADLINE COULD NOT BE LOCATED:",
        {
          headline,

          bestText:
            bestMatch?.text ||
            "",

          bestScore:
            bestMatch?.score ||
            0,

          bestCoverage:
            bestMatch?.coverage ||
            0,
        }
      );

      return "";
    }

    /*
     * Final protection against
     * very weak matches.
     */

    const wantedTokenCount =
      uniqueTokens(
        headline
      ).length;

    if (
      wantedTokenCount >= 5 &&
      bestMatch.coverage <
        0.34
    ) {
      console.warn(
        "THE HINDU HEADLINE MATCH TOO WEAK:",
        headline,
        bestMatch
      );

      return "";
    }

    return await renderAndUploadHeadline(
      pdf,
      createCanvas,
      bestMatch,
      fileUniqueId,
      headline
    );
  } catch (error) {
    console.error(
      "THE HINDU HEADLINE CROP FAILED:",
      {
        headline,

        error:
          error?.message ||
          error,
      }
    );

    return "";
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
      } catch {}
    }
  }
}

/* =========================================================
   DATE
========================================================= */

const MONTHS = {
  january:
    "01",

  february:
    "02",

  march:
    "03",

  april:
    "04",

  may:
    "05",

  june:
    "06",

  july:
    "07",

  august:
    "08",

  september:
    "09",

  october:
    "10",

  november:
    "11",

  december:
    "12",
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

  if (
    !monthNumber
  ) {
    return null;
  }

  return `${year}-${monthNumber}-${String(
    day
  ).padStart(
    2,
    "0"
  )}`;
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

  if (
    match
  ) {
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

  if (
    match
  ) {
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

  if (
    match
  ) {
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

function verifyPdfDate(
  pdfText
) {
  const detectedDate =
    extractNewspaperDate(
      pdfText
    );

  const currentDate =
    todayIST();

  if (
    !detectedDate
  ) {
    return {
      valid:
        false,

      reason:
        "newspaper-date-not-found",

      detectedDate:
        null,

      currentDate,
    };
  }

  if (
    detectedDate !==
    currentDate
  ) {
    return {
      valid:
        false,

      reason:
        "pdf-date-does-not-match-today",

      detectedDate,

      currentDate,
    };
  }

  return {
    valid:
      true,

    detectedDate,

    currentDate,
  };
}

/* =========================================================
   UPSC FILTER
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
];

function relevanceScore(
  text
) {
  const lower =
    String(
      text || ""
    ).toLowerCase();

  let score =
    0;

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
   ARTICLE EXTRACTION
========================================================= */

function splitIntoCandidateBlocks(
  text
) {
  const cleaned =
    normalizeWhitespace(
      text
    );

  const lines =
    cleaned
      .split("\n")
      .map(
        cleanText
      )
      .filter(
        Boolean
      );

  const blocks =
    [];

  let current =
    [];

  for (
    const line of
    lines
  ) {
    current.push(
      line
    );

    if (
      current.join(
        " "
      ).length >=
      900
    ) {
      blocks.push(
        current.join(
          "\n"
        )
      );

      current =
        [];
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

function looksLikeHeadline(
  line
) {
  const value =
    cleanText(
      line
    );

  if (
    value.length <
      20 ||
    value.length >
      250
  ) {
    return false;
  }

  const lower =
    value.toLowerCase();

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
    "opinion",
    "editorial",
  ];

  if (
    noise.some(
      (
        word
      ) =>
        lower.includes(
          word
        )
    )
  ) {
    return false;
  }

  return true;
}

function extractHeadlineAndDeck(
  lines
) {
  if (
    !lines.length
  ) {
    return {
      headline:
        "",

      subheadline:
        "",
    };
  }

  let headlineIndex =
    -1;

  for (
    let i = 0;
    i <
      Math.min(
        lines.length,
        8
      );
    i++
  ) {
    if (
      looksLikeHeadline(
        lines[i]
      )
    ) {
      headlineIndex =
        i;

      break;
    }
  }

  if (
    headlineIndex ===
    -1
  ) {
    return {
      headline:
        cleanText(
          lines[0]
        ),

      subheadline:
        "",
    };
  }

  const headline =
    cleanText(
      lines[
        headlineIndex
      ]
    );

  let subheadline =
    "";

  const next =
    cleanText(
      lines[
        headlineIndex +
          1
      ] ||
        ""
    );

  if (
    next &&
    next.length >=
      30 &&
    next.length <=
      900 &&
    next !==
      headline
  ) {
    const questionCount =
      (
        next.match(
          /\?/g
        ) ||
        []
      ).length;

    const looksLikeDeck =
      questionCount >=
        1 ||
      next.length >=
        100;

    if (
      looksLikeDeck
    ) {
      subheadline =
        next;
    }
  }

  return {
    headline,

    subheadline,
  };
}

function createArticleCandidates(
  pdfText
) {
  const blocks =
    splitIntoCandidateBlocks(
      pdfText
    );

  const candidates =
    [];

  for (
    const block of
    blocks
  ) {
    const text =
      normalizeWhitespace(
        block
      );

    if (
      text.length <
      350
    ) {
      continue;
    }

    const score =
      relevanceScore(
        text
      );

    if (
      score <
      2
    ) {
      continue;
    }

    const lines =
      text
        .split("\n")
        .map(
          cleanText
        )
        .filter(
          Boolean
        );

    if (
      !lines.length
    ) {
      continue;
    }

    const {
      headline,
      subheadline,
    } =
      extractHeadlineAndDeck(
        lines
      );

    if (
      headline.length <
        20 ||
      headline.length >
        250
    ) {
      continue;
    }

    candidates.push({
      title:
        headline,

      original_headline:
        headline,

      original_subheadline:
        subheadline,

      content:
        text.slice(
          0,
          14000
        ),

      relevanceScore:
        score,

      headline_image_url:
        "",
    });
  }

  return candidates;
}

/* =========================================================
   DUPLICATES
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
        (
          token
        ) =>
          token.length >
            2 &&
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
    duplicateTokens(
      a
    );

  const right =
    duplicateTokens(
      b
    );

  if (
    !left.size ||
    !right.size
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const token of
    left
  ) {
    if (
      right.has(
        token
      )
    ) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...left,
      ...right,
    ]).size;

  return union
    ? intersection /
        union
    : 0;
}

async function findExistingDuplicate(
  title,
  date
) {
  const rows =
    await supabaseRequest(
      `/rest/v1/current_affairs?select=id,title,source_name,source_url,date&date=eq.${escapeSupabase(
        date
      )}&limit=200`
    );

  if (
    !Array.isArray(
      rows
    )
  ) {
    return null;
  }

  for (
    const row of
    rows
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

async function sourceUrlExists(
  sourceUrl,
  date
) {
  const rows =
    await supabaseRequest(
      `/rest/v1/current_affairs?select=id,title,source_name,source_url,date&source_url=eq.${escapeSupabase(
        sourceUrl
      )}&date=eq.${escapeSupabase(
        date
      )}&limit=5`
    );

  return (
    Array.isArray(
      rows
    ) &&
    rows.length >
      0
  );
}

/* =========================================================
   PDF DUPLICATE
========================================================= */

async function findExistingPdfArticles(
  fileUniqueId,
  date
) {
  if (
    !fileUniqueId
  ) {
    return [];
  }

  const marker =
    `/the-hindu/${fileUniqueId}#`;

  const rows =
    await supabaseRequest(
      `/rest/v1/current_affairs?select=id,title,source_name,source_url,date,headline_image_url&date=eq.${escapeSupabase(
        date
      )}&source_url=ilike.*${encodeURIComponent(
        marker
      )}*&limit=200`
    );

  if (
    !Array.isArray(
      rows
    )
  ) {
    return [];
  }

  return rows.filter(
    (
      row
    ) =>
      String(
        row?.source_url ||
          ""
      ).includes(
        marker
      )
  );
}

/* =========================================================
   BACKFILL EXISTING ARTICLES
========================================================= */

async function backfillExistingPdfHeadlineImages(
  pdfBuffer,
  fileUniqueId,
  existingArticles
) {
  if (
    !pdfBuffer ||
    !fileUniqueId ||
    !Array.isArray(
      existingArticles
    ) ||
    existingArticles.length ===
      0
  ) {
    return {
      processed:
        0,

      updated:
        0,

      skipped:
        0,

      failed:
        0,
    };
  }

  let processed =
    0;

  let updated =
    0;

  let skipped =
    0;

  let failed =
    0;

  for (
    const row of
    existingArticles
  ) {
    processed++;

    const articleId =
      row?.id;

    const headline =
      String(
        row?.title ||
          ""
      ).trim();

    if (
      !articleId ||
      !headline
    ) {
      skipped++;

      continue;
    }

    /*
     * If already available,
     * don't regenerate.
     */

    if (
      String(
        row?.headline_image_url ||
          ""
      ).trim()
    ) {
      skipped++;

      continue;
    }

    try {
      console.log(
        "THE HINDU BACKFILL START:",
        {
          articleId,

          headline,
        }
      );

      const headlineImageUrl =
        await createTheHinduHeadlineImage(
          pdfBuffer,

          headline,

          fileUniqueId
        );

      if (
        !headlineImageUrl
      ) {
        console.warn(
          "THE HINDU BACKFILL CROP NOT FOUND:",
          {
            articleId,

            headline,
          }
        );

        failed++;

        continue;
      }

      await updateCurrentAffairsRow(
        articleId,

        {
          headline_image_url:
            headlineImageUrl,
        }
      );

      updated++;

      console.log(
        "THE HINDU BACKFILL SUCCESS:",
        {
          articleId,

          headline,

          headlineImageUrl,
        }
      );
    } catch (
      error
    ) {
      failed++;

      console.error(
        "THE HINDU BACKFILL FAILED:",
        {
          articleId,

          headline,

          error:
            error?.message ||
            error,
        }
      );
    }
  }

  return {
    processed,

    updated,

    skipped,

    failed,
  };
}

/* =========================================================
   AI
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

                headline_image_url:
                  candidate.headline_image_url ||
                  "",

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

  let data =
    null;

  try {
    data =
      text
        ? JSON.parse(
            text
          )
        : null;
  } catch {
    data =
      null;
  }

  if (
    !response.ok
  ) {
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
  let telegramChatId =
    null;

  let fileUniqueId =
    null;

  let lockAcquired =
    false;

  try {
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
          status:
            401,
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

    if (
      !fileId
    ) {
      return NextResponse.json(
        {
          error:
            "file_id is required",
        },
        {
          status:
            400,
        }
      );
    }

    /* -----------------------------------------
       LOCK
    ----------------------------------------- */

    if (
      THE_HINDU_PROCESSING_LOCK.has(
        fileUniqueId
      )
    ) {
      await sendTelegramMessage(
        telegramChatId,

        [
          "♻️ <b>The Hindu PDF Already Processing</b>",
          "",
          "Same PDF ka duplicate request receive hua.",
          "",
          "Current processing ko duplicate nahi kiya gaya.",
        ].join(
          "\n"
        )
      );

      return NextResponse.json({
        ok:
          true,

        duplicatePdf:
          true,

        reason:
          "pdf-already-processing",
      });
    }

    THE_HINDU_PROCESSING_LOCK.add(
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
       EXTRACT TEXT
    ----------------------------------------- */

    const pdfText =
      await extractPdfText(
        downloaded.buffer
      );

    /* -----------------------------------------
       DATE
    ----------------------------------------- */

    const dateCheck =
      verifyPdfDate(
        pdfText
      );

    if (
      !dateCheck.valid
    ) {
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
            dateCheck.currentDate
          }</b>`,

          "",

          "Old/invalid newspaper PDF ko save nahi kiya gaya.",
        ].join(
          "\n"
        )
      );

      return NextResponse.json(
        {
          ok:
            false,

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
       PDF DUPLICATE
    ----------------------------------------- */

    const existingPdfArticles =
      await findExistingPdfArticles(
        fileUniqueId,

        verifiedDate
      );

    /*
     * IMPORTANT:
     *
     * Same PDF already exists.
     *
     * Do NOT create new articles.
     *
     * Instead:
     * generate missing headline images
     * for the existing articles.
     */

    if (
      existingPdfArticles.length >
      0
    ) {
      console.log(
        "THE HINDU PDF DUPLICATE DETECTED:",
        {
          date:
            verifiedDate,

          existing:
            existingPdfArticles.length,
        }
      );

      const backfill =
        await backfillExistingPdfHeadlineImages(
          downloaded.buffer,

          fileUniqueId,

          existingPdfArticles
        );

      await sendTelegramMessage(
        telegramChatId,

        [
          "♻️ <b>The Hindu PDF Already Processed</b>",
          "",

          `📅 Date: <b>${verifiedDate}</b>`,

          `📰 Existing articles: <b>${existingPdfArticles.length}</b>`,

          "",

          "🖼 <b>Headline image backfill:</b>",

          `🔎 Processed: <b>${backfill.processed}</b>`,

          `✅ Images added: <b>${backfill.updated}</b>`,

          `⏭ Skipped: <b>${backfill.skipped}</b>`,

          `❌ Failed: <b>${backfill.failed}</b>`,

          "",

          "✅ Existing articles update kiye gaye.",

          "🚫 New duplicate articles create nahi hue.",
        ].join(
          "\n"
        )
      );

      return NextResponse.json({
        ok:
          true,

        processed:
          true,

        duplicatePdf:
          true,

        reason:
          "pdf-headline-image-backfill",

        date:
          verifiedDate,

        existingArticles:
          existingPdfArticles.length,

        backfill,
      });
    }

    /* -----------------------------------------
       CANDIDATES
    ----------------------------------------- */

    const candidates =
      createArticleCandidates(
        pdfText
      );

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
          (
            existing
          ) =>
            titleSimilarity(
              candidate.original_headline,

              existing.original_headline
            ) >=
            0.78
        );

      if (
        !duplicate
      ) {
        uniqueCandidates.push(
          candidate
        );
      }
    }

    /* -----------------------------------------
       TOP 20
    ----------------------------------------- */

    const selected =
      uniqueCandidates
        .sort(
          (
            a,
            b
          ) =>
            b.relevanceScore -
            a.relevanceScore
        )
        .slice(
          0,
          20
        );

    const results =
      [];

    /* -----------------------------------------
       PROCESS ARTICLES
    ----------------------------------------- */

    for (
      let index = 0;
      index <
        selected.length;
      index++
    ) {
      const candidate =
        selected[
          index
        ];

      try {
        const articleSlug =
          slugify(
            candidate.original_headline
          ) ||
          `article-${
            index +
            1
          }`;

        const sourceUrl =
          `https://t.me/SAMBHAVUPSC1/the-hindu/${fileUniqueId}#${articleSlug}`;

        /* SOURCE URL DUPLICATE */

        if (
          await sourceUrlExists(
            sourceUrl,

            verifiedDate
          )
        ) {
          results.push({
            title:
              candidate.original_headline,

            status:
              "skipped",

            reason:
              "source-url-duplicate",
          });

          continue;
        }

        /* SAME EVENT */

        const existing =
          await findExistingDuplicate(
            candidate.original_headline,

            verifiedDate
          );

        if (
          existing
        ) {
          results.push({
            title:
              candidate.original_headline,

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

        /* -------------------------------------
           ACTUAL THE HINDU HEADLINE CROP
        ------------------------------------- */

        candidate.headline_image_url =
          await createTheHinduHeadlineImage(
            downloaded.buffer,

            candidate.original_headline,

            fileUniqueId
          );

        if (
          !candidate.headline_image_url
        ) {
          console.warn(
            "Headline image unavailable:",
            candidate.original_headline
          );
        }

        /* -------------------------------------
           AI
        ------------------------------------- */

        const aiResult =
          await processThroughExistingAI(
            candidate,

            verifiedDate,

            sourceUrl
          );

        results.push({
          title:
            candidate.original_headline,

          status:
            "processed",

          headline_image_url:
            candidate.headline_image_url ||
            "",

          ai:
            aiResult,
        });
      } catch (
        error
      ) {
        console.error(
          "THE HINDU ARTICLE ERROR:",

          candidate.original_headline,

          error
        );

        results.push({
          title:
            candidate.original_headline,

          status:
            "failed",

          error:
            error?.message ||
            "Unknown article error",
        });
      }
    }

    const processed =
      results.filter(
        (
          x
        ) =>
          x.status ===
          "processed"
      ).length;

    const skipped =
      results.filter(
        (
          x
        ) =>
          x.status ===
          "skipped"
      ).length;

    const failed =
      results.filter(
        (
          x
        ) =>
          x.status ===
          "failed"
      ).length;

    /* -----------------------------------------
       TELEGRAM COMPLETE
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

        "📰 Actual newspaper headline cutting bhi generate/upload ki gayi.",

        "",

        "📚 Supabase/App update complete.",
      ].join(
        "\n"
      )
    );

    return NextResponse.json({
      ok:
        true,

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
  } catch (
    error
  ) {
    console.error(
      "THE HINDU PIPELINE FATAL ERROR:",
      error
    );

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
      ].join(
        "\n"
      )
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          error?.message ||
          "The Hindu pipeline failed",
      },

      {
        status:
          500,
      }
    );
  } finally {
    if (
      lockAcquired &&
      fileUniqueId
    ) {
      THE_HINDU_PROCESSING_LOCK.delete(
        fileUniqueId
      );
    }
  }
}

/* =========================================================
   HEALTH
========================================================= */

export async function GET() {
  return NextResponse.json({
    ok:
      true,

    service:
      "SAMBHAV UPSC The Hindu PDF Pipeline",

    date:
      todayIST(),
  });
}
