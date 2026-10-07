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

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SAMBHAV_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://sambhav-upsc.vercel.app";

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
  // Telegram status/error messages are intentionally disabled.
  // The Telegram PDF itself is still downloaded normally.
  return;
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
   PDF CANVAS FACTORY
========================================================= */

function createPdfCanvasFactory(
  createCanvas
) {
  return {
    create(width, height) {
      const canvas =
        createCanvas(
          Math.ceil(width),
          Math.ceil(height)
        );

      const context =
        canvas.getContext("2d");

      return {
        canvas,
        context,
      };
    },

    reset(
      canvasAndContext,
      width,
      height
    ) {
      canvasAndContext.canvas.width =
        Math.ceil(width);

      canvasAndContext.canvas.height =
        Math.ceil(height);
    },

    destroy(
      canvasAndContext
    ) {
      if (!canvasAndContext?.canvas) {
        return;
      }

      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    },
  };
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
  const items = (textContent?.items || [])
    .filter(item => item && typeof item.str === "string" && item.str.trim())
    .map(item => {
      const transform = Array.isArray(item.transform) ? item.transform : [1,0,0,1,0,0];
      const pdfX = Number(transform[4]) || 0;
      const pdfY = Number(transform[5]) || 0;
      const pdfWidth = Math.max(1, Math.abs(Number(item.width) || 0));
      const pdfHeight = Math.max(
        1,
        Number(item.height) ||
          Math.hypot(Number(transform[2]) || 0, Number(transform[3]) || 0) ||
          Math.hypot(Number(transform[0]) || 0, Number(transform[1]) || 0)
      );

      const rect = viewport.convertToViewportRectangle([
        pdfX,
        pdfY - pdfHeight,
        pdfX + pdfWidth,
        pdfY,
      ]);

      const x1 = Math.min(rect[0], rect[2]);
      const x2 = Math.max(rect[0], rect[2]);
      const y1 = Math.min(rect[1], rect[3]);
      const y2 = Math.max(rect[1], rect[3]);
      const fontSize = Math.max(
        1,
        Math.hypot(Number(transform[0]) || 0, Number(transform[1]) || 0) * (viewport.scale || 1)
      );
      const fontName = String(item.fontName || "");
      const style = textContent?.styles?.[item.fontName] || {};
      const fontFamily = String(style.fontFamily || "");

      return {
        text: String(item.str || "").trim(),
        x1,
        x2,
        y1,
        y2,
        x: x1,
        y: (y1 + y2) / 2,
        width: Math.max(1, x2 - x1),
        height: Math.max(1, y2 - y1),
        fontSize,
        bold: /bold|black|heavy|semibold|demi/i.test(fontName + " " + fontFamily),
      };
    });

  /*
   * IMPORTANT:
   * PDF text extraction can place text from two newspaper columns
   * on exactly the same Y coordinate. The old implementation merged
   * those columns into one line, which produced false headlines such
   * as "... while every merchant who ...".
   *
   * First group by vertical position, then split each row into
   * horizontal clusters when there is a real column-sized gap.
   */
  const rows = [];

  for (const item of items) {
    let row = null;

    for (const candidate of rows) {
      const tolerance = Math.max(
        3,
        Math.min(
          14,
          Math.max(candidate.height || 0, item.height || 0) * 0.65
        )
      );

      if (Math.abs(candidate.y - item.y) <= tolerance) {
        row = candidate;
        break;
      }
    }

    if (row) {
      row.items.push(item);
      row.x1 = Math.min(row.x1, item.x1);
      row.x2 = Math.max(row.x2, item.x2);
      row.y1 = Math.min(row.y1, item.y1);
      row.y2 = Math.max(row.y2, item.y2);
      row.height = Math.max(row.height, item.height);
      row.fontSize = Math.max(row.fontSize || 0, item.fontSize || 0);
      row.bold = row.bold || item.bold;
      row.y = (row.y + item.y) / 2;
    } else {
      rows.push({
        y: item.y,
        items: [item],
        x1: item.x1,
        x2: item.x2,
        y1: item.y1,
        y2: item.y2,
        height: item.height,
        fontSize: item.fontSize,
        bold: item.bold,
      });
    }
  }

  const lines = [];

  for (const row of rows) {
    const sorted = [...row.items].sort((a, b) => a.x1 - b.x1);
    let cluster = [];
    let previous = null;

    const flush = () => {
      if (!cluster.length) return;

      const x1 = Math.min(...cluster.map(item => item.x1));
      const x2 = Math.max(...cluster.map(item => item.x2));
      const y1 = Math.min(...cluster.map(item => item.y1));
      const y2 = Math.max(...cluster.map(item => item.y2));
      const fontSize = Math.max(...cluster.map(item => item.fontSize || 0));
      const bold = cluster.some(item => item.bold);
      const text = cluster.map(item => item.text).join(" ").replace(/\s+/g, " ").trim();

      if (text) {
        lines.push({
          y: (y1 + y2) / 2,
          items: cluster,
          x1,
          x2,
          y1,
          y2,
          height: Math.max(1, y2 - y1),
          fontSize,
          bold,
          text,
          tokenCount: uniqueTokens(text).length,
        });
      }

      cluster = [];
    };

    for (const item of sorted) {
      if (previous) {
        const gap = item.x1 - previous.x2;
        const referenceFont = Math.max(previous.fontSize || 1, item.fontSize || 1);
        const columnGap = Math.max(42, Math.min(140, referenceFont * 3.2));

        if (gap > columnGap) {
          flush();
        }
      }

      cluster.push(item);
      previous = item;
    }

    flush();
  }

  lines.sort((a, b) => {
    if (Math.abs(a.y - b.y) < 2) return a.x1 - b.x1;
    return a.y - b.y;
  });

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
  wanted,
  pageMedianFontSize = 0,
  strictHeadline = false
) {
  if (!Array.isArray(lines) || !lines.length || !wanted) return null;

  let best = null;
  const wantedCount = uniqueTokens(wanted).length;
  const maxLines = Math.min(strictHeadline ? 4 : 6, lines.length);
  const median = Math.max(1, Number(pageMedianFontSize) || 1);

  for (let start = 0; start < lines.length; start++) {
    let combined = "";
    let windowFontSize = 0;
    let windowBold = false;
    let totalFont = 0;
    let fontSamples = 0;

    for (let count = 1; count <= maxLines && start + count <= lines.length; count++) {
      const current = lines[start + count - 1];
      if (!current?.text) continue;

      if (count > 1) {
        const previous = lines[start + count - 2];
        const gap = Math.abs(current.y - previous.y);
        const maxGap = Math.max(90, Math.max(current.height || 0, previous.height || 0) * 5);
        if (gap > maxGap) break;
      }

      combined = (combined + " " + current.text).replace(/\s+/g, " ").trim();
      windowFontSize = Math.max(windowFontSize, current.fontSize || 0);
      totalFont += Number(current.fontSize) || 0;
      fontSamples++;
      windowBold = windowBold || !!current.bold;

      const metrics = scoreHeadlineWindow(wanted, combined);
      const averageFontSize = totalFont / Math.max(1, fontSamples);
      const fontRatio = windowFontSize / median;

      /*
       * Newspaper headlines are normally materially larger than the
       * surrounding article body. In strict mode we refuse tiny body
       * text even when all title tokens happen to match it exactly.
       */
      if (strictHeadline) {
        if (fontRatio < 1.18 || averageFontSize / median < 1.10) {
          continue;
        }
        if (combined.length > 220) continue;
      }

      const exactEnough = metrics.exact || metrics.coverage >= 0.88;
      const fontBonus = Math.min(0.22, Math.max(0, fontRatio - 1) * 0.18) + (windowBold ? 0.055 : 0);
      const adjustedScore = metrics.score + fontBonus - Math.max(0, count - 1) * 0.025;
      const candidate = {
        ...metrics,
        start,
        count,
        lines: lines.slice(start, start + count),
        text: combined,
        fontSize: windowFontSize,
        averageFontSize,
        fontRatio,
        bold: windowBold,
        adjustedScore,
      };

      if (!best || adjustedScore > best.adjustedScore) best = candidate;

      if (exactEnough && wantedCount <= uniqueTokens(combined).length + 2) break;
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
            PDF_LAYOUT_SCALE,
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

      const fontSizes = lines
        .map(line => Number(line?.fontSize) || 0)
        .filter(Boolean)
        .sort((a, b) => a - b);

      const middle = Math.floor(fontSizes.length / 2);
      const medianFontSize = fontSizes.length
        ? (fontSizes.length % 2
          ? fontSizes[middle]
          : (fontSizes[middle - 1] + fontSizes[middle]) / 2)
        : 0;

      pageCache.push({
        pageNumber,

        viewport,

        lines,

        medianFontSize,
      });
    } finally {
      page.cleanup();
    }
  }

  return pageCache;
}

/* =========================================================
   BUILD PDF HEADLINE LAYOUT INDEX
========================================================= */

async function buildPdfHeadlineLayoutIndex(
  pdfBuffer
) {
  if (!pdfBuffer) return [];

  let pdf = null;

  try {
    const pdfjsLib = await import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    );

    const { createCanvas } = await import(
      "@napi-rs/canvas"
    );

    const canvasFactory = createPdfCanvasFactory(
      createCanvas
    );

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      disableWorker: true,
      useSystemFonts: true,
      isEvalSupported: false,
      canvasFactory,
    });

    pdf = await loadingTask.promise;

    return await extractPdfPageLines(
      pdfjsLib,
      pdf
    );
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
      } catch {}
    }
  }
}

/* =========================================================
   FIND BEST HEADLINE IN COMPLETE PDF
========================================================= */

function findBestHeadlineInPageCache(
  pageCache,
  headline,
  strictHeadline = false
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
        headline,
        pageData.medianFontSize,
        strictHeadline
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

/* =========================================================
   RENDER + CROP MATCHED HEADLINE
========================================================= */

/* =========================================================
   CREATE ACTUAL THE HINDU HEADLINE IMAGE
========================================================= */

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

function extractNewspaperDateFromFileName(
  fileName
) {
  const source =
    String(fileName || "");

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
    extractNewspaperDate(pdfText);

  const currentDate =
    todayIST();

  /*
   * Historical-date restriction intentionally
   * removed. Any valid The Hindu newspaper
   * date is allowed so PDFs can be uploaded
   * one-by-one from 1 October onward.
   */
  if (!detectedDate) {
    return {
      valid: false,
      reason:
        "newspaper-date-not-found",
      detectedDate: null,
      currentDate,
      dateSource: "none",
    };
  }

  return {
    valid: true,
    detectedDate,
    currentDate,
    dateSource: filenameDate
      ? "filename"
      : "pdf-text",
    historical:
      detectedDate !== currentDate,
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

async function createArticleCandidates(
  pdfText,
  headlineLayoutIndex = []
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
      headline: rawHeadline,
      subheadline,
    } =
      extractHeadlineAndDeck(
        lines
      );

    if (
      rawHeadline.length <
        20 ||
      rawHeadline.length >
        250
    ) {
      continue;
    }

    let headline = rawHeadline;

    /*
     * IMPORTANT: never trust a raw PDF text line as a newspaper
     * headline unless the same text can be located in a headline-sized
     * PDF text region. This removes body-column lines that happened to
     * be returned first by pdf-parse.
     */
    if (headlineLayoutIndex.length) {
      const layoutMatch =
        findBestHeadlineInPageCache(
          headlineLayoutIndex,
          rawHeadline,
          true
        );

      if (
        !layoutMatch ||
        layoutMatch.coverage < 0.45
      ) {
        continue;
      }

      headline = cleanText(
        layoutMatch.text
      );

      if (
        headline.length < 20 ||
        headline.length > 250
      ) {
        continue;
      }

      console.log(
        "THE HINDU HEADLINE VERIFIED BY PDF LAYOUT:",
        {
          rawHeadline,
          headline,
          coverage: layoutMatch.coverage,
          score: layoutMatch.score,
          fontRatio: layoutMatch.fontRatio,
        }
      );
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
   REMOVE LEGACY THE HINDU HEADLINE IMAGES
========================================================= */

async function removeLegacyTheHinduHeadlineImages() {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "THE HINDU IMAGE CLEANUP SKIPPED: service role key missing"
      );
      return { rows: 0, storage: 0 };
    }

    const rowsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/current_affairs?select=id,headline_image_url&source_name=ilike.*The%20Hindu*&headline_image_url=not.is.null&limit=1000`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!rowsResponse.ok) {
      console.error(
        "THE HINDU IMAGE CLEANUP QUERY FAILED:",
        await rowsResponse.text()
      );
      return { rows: 0, storage: 0 };
    }

    const rows = await rowsResponse.json();
    let storageDeleted = 0;

    for (const row of Array.isArray(rows) ? rows : []) {
      const url = String(row?.headline_image_url || "").trim();

      if (url) {
        const marker = `/storage/v1/object/public/${THE_HINDU_HEADLINE_BUCKET}/`;
        const markerIndex = url.indexOf(marker);

        if (markerIndex !== -1) {
          const objectPath = decodeURIComponent(
            url.slice(markerIndex + marker.length)
          );

          if (objectPath) {
            try {
              const deleteResponse = await fetch(
                `${SUPABASE_URL}/storage/v1/object/${THE_HINDU_HEADLINE_BUCKET}/${objectPath.split("/").map(encodeURIComponent).join("/")}`,
                {
                  method: "DELETE",
                  headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  },
                }
              );

              if (deleteResponse.ok) {
                storageDeleted++;
              }
            } catch (error) {
              console.warn(
                "THE HINDU IMAGE STORAGE DELETE FAILED:",
                error?.message || error
              );
            }
          }
        }
      }

      try {
        await updateCurrentAffairsRow(row.id, {
          headline_image_url: null,
        });
      } catch (error) {
        console.warn(
          "THE HINDU IMAGE DB CLEAR FAILED:",
          row.id,
          error?.message || error
        );
      }
    }

    console.log(
      "THE HINDU LEGACY IMAGES REMOVED:",
      { rows: Array.isArray(rows) ? rows.length : 0, storageDeleted }
    );

    return {
      rows: Array.isArray(rows) ? rows.length : 0,
      storage: storageDeleted,
    };
  } catch (error) {
    console.error(
      "THE HINDU IMAGE CLEANUP FAILED:",
      error?.message || error
    );

    return { rows: 0, storage: 0 };
  }
}

/* =========================================================
   PDF DUPLICATE
========================================================= */

async function findExistingPdfArticles(
  fileUniqueId,
  date
) {
  /*
   * First try the original PDF marker.
   */
  if (fileUniqueId) {
    const marker =
      `/the-hindu/${fileUniqueId}#`;

    const markerRows =
      await supabaseRequest(
        `/rest/v1/current_affairs?select=id,title,source_name,source_url,date&date=eq.${escapeSupabase(
          date
        )}&source_url=ilike.*${encodeURIComponent(
          marker
        )}*&limit=200`
      );

    if (
      Array.isArray(markerRows) &&
      markerRows.length > 0
    ) {
      const matched =
        markerRows.filter(
          (row) =>
            String(
              row?.source_url ||
                ""
            ).includes(marker)
        );

      if (matched.length > 0) {
        console.log(
          "THE HINDU EXISTING ARTICLES FOUND BY PDF MARKER:",
          {
            date,
            count: matched.length,
          }
        );

        return matched;
      }
    }
  }

  /*
   * FALLBACK FOR EXISTING ARTICLES:
   *
   * Older The Hindu records can have a
   * different Telegram fileUniqueId.
   * For headline-image backfill we can
   * safely identify them by newspaper date
   * + The Hindu source.
   */
  const allRows =
    await supabaseRequest(
      `/rest/v1/current_affairs?select=id,title,source_name,source_url,date&date=eq.${escapeSupabase(
        date
      )}&limit=200`
    );

  if (!Array.isArray(allRows)) {
    return [];
  }

  const theHinduRows =
    allRows.filter((row) => {
      const source =
        String(
          row?.source_name ||
            ""
        ).toLowerCase();

      return source.includes(
        "the hindu"
      );
    });

  console.log(
    "THE HINDU EXISTING ARTICLES FOUND BY DATE/SOURCE FALLBACK:",
    {
      date,
      count: theHinduRows.length,
    }
  );

  return theHinduRows;
}

/* =========================================================
   RECOVER ORIGINAL HEADLINE FROM SOURCE URL
========================================================= */

function extractHeadlineFromSourceUrl(sourceUrl) {
  const value = String(sourceUrl || '').trim();
  const hash = value.indexOf('#');
  if (hash === -1) return '';

  const fragment = value.slice(hash + 1).trim();
  if (!fragment) return '';

  try {
    return decodeURIComponent(fragment)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return fragment
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/* =========================================================
   BACKFILL EXISTING ARTICLES
========================================================= */

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

    // Remove all legacy The Hindu headline images and clear their DB URLs.
    // This is intentionally idempotent so old images disappear from the app.
    await removeLegacyTheHinduHeadlineImages();

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
        pdfText,
        body?.file_name || ""
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
     * Same PDF already exists.
     * Do not create duplicate articles.
     */

    if (
      existingPdfArticles.length >
      0
    ) {
      console.log(
        "THE HINDU PDF DUPLICATE DETECTED:",
        {
          date: verifiedDate,
          existing: existingPdfArticles.length,
        }
      );

      return NextResponse.json({
        ok: true,
        processed: true,
        duplicatePdf: true,
        reason: "pdf-already-processed",
        date: verifiedDate,
        existingArticles: existingPdfArticles.length,
      });
    }

    /* -----------------------------------------
       CANDIDATES
    ----------------------------------------- */

    const headlineLayoutIndex =
      await buildPdfHeadlineLayoutIndex(
        downloaded.buffer
      );

    const candidates =
      await createArticleCandidates(
        pdfText,
        headlineLayoutIndex
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
