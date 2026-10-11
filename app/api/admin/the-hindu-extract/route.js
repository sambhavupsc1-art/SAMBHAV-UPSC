import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = "nodejs";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;
const BUCKET = process.env.ADMIN_CONTENT_BUCKET || "study-materials";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://sambhav-upsc.vercel.app").replace(/\/+$/, "");
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_CANDIDATES = 40;
const CONCURRENCY = 3;

function verify(token) {
  try {
    if (!token || !SESSION_SECRET) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    const a = Buffer.from(signature), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data?.userId && data?.exp && Date.now() <= data.exp ? data : null;
  } catch { return null; }
}

async function requireAdmin() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SESSION_SECRET) {
    return { error: "Server environment is not configured.", status: 500 };
  }
  const store = await cookies();
  const session = verify(store.get("sambhav_session")?.value);
  if (!session) return { error: "Admin access denied.", status: 403 };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(session.userId)}&is_active=eq.true&select=id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return { error: "Could not verify admin access.", status: 500 };
  const rows = await response.json();
  return rows.length ? { userId: session.userId } : { error: "Admin access denied.", status: 403 };
}

function encodedPath(path) {
  return String(path || "").split("/").map(encodeURIComponent).join("/");
}

async function storage(path, options = {}) {
  return fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r/g, "")
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

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const MONTHS = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
};

function dateFromText(text) {
  let m = String(text || "").match(
    /\b(0?[1-9]|[12][0-9]|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i
  );
  if (m) return `${m[3]}-${MONTHS[m[2].toLowerCase()]}-${String(m[1]).padStart(2, "0")}`;

  m = String(text || "").match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12][0-9]|3[01]),?\s+(20\d{2})\b/i
  );
  if (m) return `${m[3]}-${MONTHS[m[1].toLowerCase()]}-${String(m[2]).padStart(2, "0")}`;

  m = String(text || "").match(/\b(0?[1-9]|[12][0-9]|3[01])[\/-](0?[1-9]|1[0-2])[\/-](20\d{2})\b/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;

  return null;
}

const RELEVANT = [
  "government", "supreme court", "high court", "parliament", "constitution",
  "ministry", "policy", "bill", "act", "ordinance", "international",
  "united nations", "india", "diplomacy", "bilateral", "multilateral",
  "economy", "inflation", "gdp", "fiscal", "monetary", "rbi", "banking",
  "agriculture", "farmer", "environment", "climate", "biodiversity",
  "forest", "wildlife", "pollution", "technology", "science", "space",
  "isro", "defence", "security", "cyber", "health", "education",
  "social justice", "tribal", "women", "child", "report", "index",
  "scheme", "mission", "committee", "commission", "judiciary", "federal",
  "governance", "disaster", "monsoon", "river", "water", "energy",
  "renewable", "nuclear", "semiconductor", "artificial intelligence",
  "digital", "telecom", "missile", "border", "china", "pakistan",
  "russia", "usa", "editorial", "opinion", "explained", "analysis",
  "climate change", "judgment",
];

const LOW_VALUE = [
  "cricket", "football", "celebrity", "movie review", "film review",
  "horoscope", "entertainment", "fashion", "recipe", "lifestyle",
  "stock market tips",
];

function score(text) {
  const s = String(text || "").toLowerCase();
  let n = 0;
  for (const k of RELEVANT) if (s.includes(k)) n++;
  for (const k of LOW_VALUE) if (s.includes(k)) n -= 3;
  return n;
}

function looksHeadline(value) {
  const s = cleanText(value);
  if (s.length < 25 || s.length > 220) return false;
  const l = s.toLowerCase();
  return ![
    "the hindu", "advertisement", "advertising", "page ",
    "contents", "index", "october 2026", "september 2026",
  ].some((x) => l.includes(x));
}

function candidatesFromText(text) {
  const lines = normalizeWhitespace(text).split("\n").map(cleanText).filter(Boolean);
  const blocks = [];
  let current = [];

  for (const line of lines) {
    current.push(line);
    if (current.join(" ").length >= 1800) {
      blocks.push(current.join("\n"));
      current = [];
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  const found = [];
  for (const block of blocks) {
    if (block.length < 500) continue;
    const relevance = score(block);
    if (relevance < 2) continue;

    const blockLines = block.split("\n").map(cleanText).filter(Boolean);
    const headline = blockLines.slice(0, 12).find(looksHeadline);
    if (!headline) continue;

    if ([
      "home", "about", "contact", "current affairs", "latest news",
      "news", "opinion", "editorial", "sports",
    ].includes(headline.toLowerCase())) continue;

    found.push({
      title: headline,
      original_headline: headline,
      original_subheadline: blockLines[blockLines.indexOf(headline) + 1] || "",
      content: block.slice(0, 14000),
      relevanceScore: relevance,
    });
  }

  const unique = [];
  for (const item of found) {
    const tokens = (s) => new Set(
      String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/).filter((x) => x.length > 2)
    );
    const a = tokens(item.title);
    const duplicate = unique.some((other) => {
      const b = tokens(other.title);
      let same = 0;
      for (const t of a) if (b.has(t)) same++;
      return a.size && b.size && same / new Set([...a, ...b]).size >= 0.72;
    });
    if (!duplicate) unique.push(item);
  }

  return unique.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, MAX_CANDIDATES);
}

async function processCandidate(candidate, date, index) {
  const payload = {
    items: [{
      title: candidate.original_headline,
      original_headline: candidate.original_headline,
      original_subheadline: candidate.original_subheadline || "",
      date,
      source_name: "The Hindu",
      source_url: "",
      content: candidate.content,
      report_type: "the_hindu_pdf",
      source_type: "newspaper",
    }],
  };

  const response = await fetch(`${APP_URL}/api/current-affairs/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`AI route returned invalid JSON for item ${index + 1}.`);
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `AI route failed for item ${index + 1} (HTTP ${response.status}).`);
  }

  const created = Number(data?.articles_created || 0);
  const skipped = Number(data?.articles_skipped || 0);
  const failed = Number(data?.failed_batches || 0);

  if (created) return { title: candidate.title, status: "published", created, skipped };
  if (skipped && !failed) return { title: candidate.title, status: "skipped", skipped, reason: "duplicate" };

  throw new Error(data?.failed_articles?.[0]?.error || "AI route did not create an article.");
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }

    if (body.action === "process") {
      const path = String(body.path || "");
      const bucket = String(body.bucket || BUCKET);
      const date = String(body.date || "");
      const fileName = String(body.fileName || "The-Hindu.pdf");

      if (bucket !== BUCKET || !path.startsWith("admin-uploads/") || !/^20\d{2}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ success: false, error: "Invalid PDF path, bucket, or newspaper date." }, { status: 400 });
      }

      const info = await storage(
        `object/info/${encodeURIComponent(bucket)}/${encodedPath(path)}`,
        { method: "GET" }
      );
      if (!info.ok) {
        return NextResponse.json({ success: false, error: "The uploaded PDF could not be found in storage." }, { status: 400 });
      }

      const downloaded = await storage(
        `object/${encodeURIComponent(bucket)}/${encodedPath(path)}`,
        { method: "GET" }
      );
      if (!downloaded.ok) {
        return NextResponse.json({ success: false, error: `Could not download uploaded PDF (${downloaded.status}).` }, { status: 502 });
      }

      const buffer = Buffer.from(await downloaded.arrayBuffer());
      if (!buffer.length || buffer.length > MAX_BYTES) {
        return NextResponse.json({ success: false, error: "PDF is empty or exceeds the 50 MB limit." }, { status: 413 });
      }

      let parser;
      let pdfText = "";

      try {
        const canvas = await import("@napi-rs/canvas");
        if (canvas.DOMMatrix && !globalThis.DOMMatrix) globalThis.DOMMatrix = canvas.DOMMatrix;
        if (canvas.ImageData && !globalThis.ImageData) globalThis.ImageData = canvas.ImageData;
        if (canvas.Path2D && !globalThis.Path2D) globalThis.Path2D = canvas.Path2D;

        const { CanvasFactory } = await import("pdf-parse/worker");
        const { PDFParse } = await import("pdf-parse");
        parser = new PDFParse({ data: buffer, CanvasFactory });
        const result = await parser.getText();
        pdfText = normalizeWhitespace(result?.text || "");
      } finally {
        if (parser) {
          try { await parser.destroy(); } catch {}
        }
      }

      if (pdfText.length < 500) {
        return NextResponse.json({
          success: false,
          error: "PDF text extraction returned too little text. This may be a scanned/image-only PDF and needs OCR.",
        }, { status: 422 });
      }

      const detectedDate = dateFromText(pdfText);
      if (detectedDate && detectedDate !== date) {
        return NextResponse.json({
          success: false,
          error: `Newspaper date mismatch. PDF text indicates ${detectedDate}, but you selected ${date}. Check the PDF and date before processing.`,
          detectedDate,
        }, { status: 422 });
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
          warning: "No article candidates were detected by the current PDF text heuristic. Scanned PDFs may require OCR.",
        });
      }

      const results = new Array(candidates.length);
      let next = 0;

      async function worker() {
        while (true) {
          const i = next++;
          if (i >= candidates.length) return;

          try {
            results[i] = await processCandidate(candidates[i], date, i);
          } catch (e) {
            results[i] = {
              title: candidates[i].title,
              status: "failed",
              error: e?.message || "Unknown error",
            };
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, worker)
      );

      return NextResponse.json({
        success: true,
        date,
        fileName,
        scannedCharacters: pdfText.length,
        candidates: candidates.length,
        published: results.filter((x) => x.status === "published").length,
        skipped: results.filter((x) => x.status === "skipped").length,
        failed: results.filter((x) => x.status === "failed").length,
        results,
        warning: candidates.length === MAX_CANDIDATES
          ? `Processing was limited to ${MAX_CANDIDATES} candidates in this run. Review the full PDF for any missed items.`
          : "Candidate detection is heuristic-based; manually review the article list for missed newspaper items.",
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("Admin The Hindu extraction failed:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "The Hindu extraction failed.",
    }, { status: 500 });
  }
}
