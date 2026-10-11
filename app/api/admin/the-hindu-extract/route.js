import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = "nodejs";

const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || ""
).replace(/\/+$/, "");

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;
const BUCKET =
  process.env.ADMIN_CONTENT_BUCKET || "study-materials";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://sambhav-upsc.vercel.app"
).replace(/\/+$/, "");

const MAX_BYTES = 50 * 1024 * 1024;
const CONCURRENCY = 3;

// Candidate count is no longer capped at 40.
// Actual candidates are deduplicated before AI processing.

function verify(token) {
  try {
    if (!token || !SESSION_SECRET) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;

    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    return data?.userId &&
      data?.exp &&
      Date.now() <= data.exp
      ? data
      : null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SESSION_SECRET) {
    return {
      error: "Server environment is not configured.",
      status: 500,
    };
  }

  const store = await cookies();
  const session = verify(
    store.get("sambhav_session")?.value
  );

  if (!session) {
    return {
      error: "Admin access denied.",
      status: 403,
    };
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(
      session.userId
    )}&is_active=eq.true&select=id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return {
      error: "Could not verify admin access.",
      status: 500,
    };
  }

  const rows = await response.json();

  return rows.length
    ? { userId: session.userId }
    : {
        error: "Admin access denied.",
        status: 403,
      };
}

function encodedPath(path) {
  return String(path || "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

async function storage(path, options = {}) {
  return fetch(
    `${SUPABASE_URL}/storage/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        ...(options.headers || {}),
      },
      cache: "no-store",
    }
  );
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r/g, "")
    // Join words split by a PDF line-wrap hyphen (e.g. "govern-\nment").
    .replace(/-\n(?=[a-z])/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function normalizeForMatch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
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

function dateFromText(text) {
  let match = String(text || "").match(
    /\b(0?[1-9]|[12][0-9]|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i
  );

  if (match) {
    return `${match[3]}-${MONTHS[
      match[2].toLowerCase()
    ]}-${String(match[1]).padStart(2, "0")}`;
  }

  match = String(text || "").match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12][0-9]|3[01]),?\s+(20\d{2})\b/i
  );

  if (match) {
    return `${match[3]}-${MONTHS[
      match[1].toLowerCase()
    ]}-${String(match[2]).padStart(2, "0")}`;
  }

  match = String(text || "").match(
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

const RELEVANT = [
  "government", "supreme court", "high court",
  "parliament", "constitution", "ministry",
  "policy", "bill", "act", "ordinance",
  "international", "united nations", "india",
  "diplomacy", "bilateral", "multilateral",
  "economy", "inflation", "gdp", "fiscal",
  "monetary", "rbi", "banking", "agriculture",
  "farmer", "environment", "climate",
  "biodiversity", "forest", "wildlife",
  "pollution", "technology", "science", "space",
  "isro", "defence", "security", "cyber",
  "health", "education", "social justice",
  "tribal", "women", "child", "report", "index",
  "scheme", "mission", "committee", "commission",
  "judiciary", "federal", "governance",
  "disaster", "monsoon", "river", "water",
  "energy", "renewable", "nuclear",
  "semiconductor", "artificial intelligence",
  "digital", "telecom", "missile", "border",
  "china", "pakistan", "russia", "usa",
  "editorial", "opinion", "op-ed", "explained",
  "analysis", "climate change", "judgment",
  "supreme", "election", "parliamentary",
  "federalism", "rights", "court", "trade",
  "employment", "poverty", "inequality",
  "migration", "education", "nutrition",
  "public health", "fisheries", "livelihood",
  "international relations", "foreign policy",
  "ethics", "accountability", "transparency",
  "displacement", "urbanisation", "urbanization",
];

const LOW_VALUE = [
  "cricket", "football", "celebrity",
  "movie review", "film review", "horoscope",
  "entertainment", "fashion", "recipe",
  "stock market tips",
];

function score(text) {
  const normalized = normalizeForMatch(text);
  let total = 0;

  for (const keyword of RELEVANT) {
    if (normalized.includes(keyword)) total++;
  }

  for (const keyword of LOW_VALUE) {
    if (normalized.includes(keyword)) total -= 3;
  }

  return total;
}

function looksHeadline(value) {
  const text = cleanText(value);

  if (text.length < 24 || text.length > 180) return false;
  if (!/[a-z]{3}/i.test(text)) return false;
  if (text.split(/\s+/).length < 4) return false;

  const normalized = text.toLowerCase();
  if ([
    "the hindu",
    "advertisement",
    "advertising",
    "contents",
    "index",
    "subscribe",
    "subscription",
    "read more",
    "page ",
    "copyright",
    "all rights reserved",
  ].some((term) => normalized.includes(term))) return false;

  // Reject typical mid-sentence PDF fragments that previously became headlines.
  if (/[,:;\-]$/.test(text)) return false;
  if (/\b(and|or|but|of|to|for|with|from|in|on|at|by|the|a|an|as)\.?$/i.test(text)) return false;
  if (/^(and|or|but|of|to|for|with|from|in|on|at|by|the)\b/i.test(text)) return false;
  return true;
}

function isBoilerplate(value) {
  const text = normalizeForMatch(value);

  return [
    "home",
    "about us",
    "contact us",
    "privacy policy",
    "terms of use",
    "sign in",
    "subscribe now",
    "advertisement",
    "advertising",
    "all rights reserved",
  ].includes(text);
}
function splitTextIntoWindows(text) {
  const normalized = normalizeWhitespace(text);
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const windows = [];
  let current = [];
  let length = 0;

  for (const paragraph of paragraphs) {
    // Keep unusually long paragraphs intact in smaller pieces.
    if (paragraph.length > 6000) {
      if (current.length) {
        windows.push(current.join("\n\n"));
        current = [];
        length = 0;
      }

      for (let start = 0; start < paragraph.length; start += 4500) {
        const piece = paragraph.slice(start, start + 6000);
        if (piece.trim()) windows.push(piece);
      }

      continue;
    }

    if (length + paragraph.length > 4200 && current.length) {
      windows.push(current.join("\n\n"));
      current = [];
      length = 0;
    }

    current.push(paragraph);
    length += paragraph.length;
  }

  if (current.length) {
    windows.push(current.join("\n\n"));
  }

  // Fallback for PDFs whose text has few paragraph breaks.
  if (windows.length < 2 && normalized.length > 4200) {
    const fallback = [];
    const windowSize = 4800;
    const stride = 3600;

    for (
      let start = 0;
      start < normalized.length;
      start += stride
    ) {
      const piece = normalized.slice(
        start,
        start + windowSize
      );

      if (piece.trim()) fallback.push(piece);
    }

    return fallback;
  }

  return windows;
}

function findHeadline(lines) {
  const candidates = lines
    .slice(0, 20)
    .map(cleanText)
    .filter(looksHeadline);

  if (!candidates.length) return null;

  // Prefer complete, headline-like lines over long sentence fragments.
  function headlineScore(value) {
    const words = value.split(/\s+/);
    let points = Math.min(value.length, 100) / 5;
    if (/^[A-Z“'“]/.test(value)) points += 2;
    if (/[.!?]$/.test(value)) points -= 4;
    if (/[,:;\-]$/.test(value)) points -= 10;
    if (/\b(and|or|but|of|to|for|with|from|in|on|at|by|the|a|an|as)$/i.test(value)) points -= 12;
    if (words.length >= 5 && words.length <= 18) points += 3;
    if (words.length > 24) points -= 8;
    return points;
  }

  return candidates.sort(
    (a, b) => headlineScore(b) - headlineScore(a)
  )[0];
}

function candidatesFromText(text) {
  const windows = splitTextIntoWindows(text);
  const found = [];

  for (const windowText of windows) {
    if (windowText.length < 350) continue;

    const relevanceScore = score(windowText);

    // This is only a broad candidate pre-filter, not the final UPSC decision.
    // The AI route applies the strict syllabus-relevance gate before publishing.
    const hasEditorialSignal =
      /\b(editorial|opinion|op-ed|explained|analysis|interview|special report)\b/i
        .test(windowText);
    const hasPolicyOrInstitutionSignal =
      /\b(impact|scheme|policy|court|rights|government|report|data|law|act|commission|climate|economy|governance|security|health|education|agriculture|water|displacement|international|india|parliament|constitution)\b/i
        .test(windowText);

    if (relevanceScore < 1 && !hasEditorialSignal && !hasPolicyOrInstitutionSignal) {
      continue;
    }

    const lines = windowText
      .split("\n")
      .map(cleanText)
      .filter(Boolean);

    const headline = findHeadline(lines);
    if (!headline || isBoilerplate(headline)) continue;

    const normalizedHeadline = normalizeForMatch(headline);

    if (
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
      ].includes(normalizedHeadline)
    ) {
      continue;
    }

    const headlineIndex = lines.findIndex(
      (line) =>
        normalizeForMatch(line) === normalizedHeadline
    );

    if (headlineIndex < 0) continue;

    const articleLines = lines.slice(headlineIndex);
    const articleText = articleLines.join("\n").trim();
    const bodyText = articleLines.slice(1).join(" ").trim();

    // Do not send tiny headline-only windows or obviously fragmented snippets to AI.
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    const sentenceCount = (bodyText.match(/[.!?](?:[”’"')\]]?)(?:\s|$)/g) || []).length;
    const brokenLineCount = (bodyText.match(/(?:^|\s)[a-z]{1,3}[-,;:]?\s*$/gim) || []).length;
    if (bodyText.length < 280 || wordCount < 45) continue;
    if (brokenLineCount >= 5 && sentenceCount < 2) continue;

    const subheadline = articleLines[1] || "";

    found.push({
      title: headline,
      original_headline: headline,
      original_subheadline: subheadline,
      content: articleText.slice(0, 14000),
      relevanceScore,
    });
  }

  // Deduplicate overlapping text windows by title similarity.
  const unique = [];

  for (const item of found) {
    const itemTokens = new Set(
      normalizeForMatch(item.title)
        .split(" ")
        .filter((token) => token.length > 2)
    );

    const duplicate = unique.some((existing) => {
      const existingTokens = new Set(
        normalizeForMatch(existing.title)
          .split(" ")
          .filter((token) => token.length > 2)
      );

      if (!itemTokens.size || !existingTokens.size) {
        return false;
      }

      let intersection = 0;

      for (const token of itemTokens) {
        if (existingTokens.has(token)) intersection++;
      }

      const union = new Set([
        ...itemTokens,
        ...existingTokens,
      ]).size;

      const similarity = intersection / union;

      return (
        normalizeForMatch(item.title) ===
          normalizeForMatch(existing.title) ||
        similarity >= 0.65
      );
    });

    if (!duplicate) unique.push(item);
  }

  return unique.sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );
}

async function processCandidate(candidate, date, index) {
  const payload = {
    items: [
      {
        title: candidate.original_headline,
        original_headline: candidate.original_headline,
        original_subheadline:
          candidate.original_subheadline || "",
        date,
        source_name: "The Hindu",
        source_url: "",
        content: candidate.content,
        report_type: "the_hindu_pdf",
        source_type: "newspaper",
      },
    ],
  };

  const response = await fetch(
    `${APP_URL}/api/current-affairs/ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(
      `AI route returned invalid JSON for item ${index + 1}.`
    );
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.error ||
        `AI route failed for item ${index + 1} (HTTP ${response.status}).`
    );
  }

  const created = Number(data?.articles_created || 0);
  const skipped = Number(data?.articles_skipped || 0);
  const failed = Number(data?.failed_batches || 0);

  if (created > 0) {
    return {
      title: candidate.title,
      status: "published",
      created,
      skipped,
    };
  }

  if (skipped > 0 && failed === 0) {
    return {
      title: candidate.title,
      status: "skipped",
      skipped,
      reason: data?.skipped_articles?.[0]?.reason || "duplicate_or_not_upsc_relevant",
    };
  }

  throw new Error(
    data?.failed_articles?.[0]?.error ||
      "AI route did not create an article."
  );
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: auth.status }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (body.action !== "process") {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported action.",
        },
        { status: 400 }
      );
    }

    const path = String(body.path || "");
    const bucket = String(body.bucket || BUCKET);
    const date = String(body.date || "");
    const fileName = String(
      body.fileName || "The-Hindu.pdf"
    );

    if (
      bucket !== BUCKET ||
      !path.startsWith("admin-uploads/") ||
      !/^20\d{2}-\d{2}-\d{2}$/.test(date)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid PDF path, bucket, or newspaper date.",
        },
        { status: 400 }
      );
    }

    const info = await storage(
      `object/info/${encodeURIComponent(bucket)}/${encodedPath(path)}`,
      { method: "GET" }
    );

    if (!info.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "The uploaded PDF could not be found in storage.",
        },
        { status: 400 }
      );
    }

    const downloaded = await storage(
      `object/${encodeURIComponent(bucket)}/${encodedPath(path)}`,
      { method: "GET" }
    );

    if (!downloaded.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not download uploaded PDF (${downloaded.status}).`,
        },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(
      await downloaded.arrayBuffer()
    );

    if (!buffer.length || buffer.length > MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "PDF is empty or exceeds the 50 MB limit.",
        },
        { status: 413 }
      );
    }

    let parser;
    let pdfText = "";

    try {
      const canvas = await import("@napi-rs/canvas");

      if (canvas.DOMMatrix && !globalThis.DOMMatrix) {
        globalThis.DOMMatrix = canvas.DOMMatrix;
      }

      if (canvas.ImageData && !globalThis.ImageData) {
        globalThis.ImageData = canvas.ImageData;
      }

      if (canvas.Path2D && !globalThis.Path2D) {
        globalThis.Path2D = canvas.Path2D;
      }

      const { CanvasFactory } = await import("pdf-parse/worker");
      const { PDFParse } = await import("pdf-parse");

      parser = new PDFParse({
        data: buffer,
        CanvasFactory,
      });

      const result = await parser.getText();
      pdfText = normalizeWhitespace(result?.text || "");
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {}
      }
    }

    if (pdfText.length < 500) {
      return NextResponse.json(
        {
          success: false,
          error:
            "PDF text extraction returned too little text. This may be a scanned/image-only PDF and needs OCR.",
        },
        { status: 422 }
      );
    }

    const detectedDate = dateFromText(pdfText);

    if (detectedDate && detectedDate !== date) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Newspaper date mismatch. PDF text indicates ${detectedDate}, ` +
            `but you selected ${date}. Check the PDF and date before processing.`,
          detectedDate,
        },
        { status: 422 }
      );
    }

    const candidates = candidatesFromText(pdfText);

    if (!candidates.length) {
      return NextResponse.json({
        success: true,
        date,
        scannedCharacters: pdfText.length,
        candidates: 0,
        published: 0,
        skipped: 0,
        failed: 0,
        results: [],
        warning:
          "No article candidates were detected. Check the PDF text extraction; scanned PDFs may require OCR.",
      });
    }

    const results = new Array(candidates.length);
    let next = 0;

    async function worker() {
      while (true) {
        const index = next++;

        if (index >= candidates.length) return;

        try {
          results[index] = await processCandidate(
            candidates[index],
            date,
            index
          );
        } catch (error) {
          results[index] = {
            title: candidates[index].title,
            status: "failed",
            error: error?.message || "Unknown error",
          };
        }
      }
    }

    await Promise.all(
      Array.from(
        {
          length: Math.min(CONCURRENCY, candidates.length),
        },
        () => worker()
      )
    );

    const published = results.filter(
      (item) => item.status === "published"
    ).length;

    const skipped = results.filter(
      (item) => item.status === "skipped"
    ).length;

    const failed = results.filter(
      (item) => item.status === "failed"
    ).length;

    return NextResponse.json({
      success: true,
      date,
      fileName,
      scannedCharacters: pdfText.length,
      candidates: candidates.length,
      published,
      skipped,
      failed,
      results,
      warning:
        "Text extraction and candidate detection are heuristic-based. Review the results for missed articles; image-only PDFs may require OCR.",
    });
  } catch (error) {
    console.error(
      "Admin The Hindu extraction failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || "The Hindu extraction failed.",
      },
      { status: 500 }
    );
  }
}
