import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const PIB_ALL_RELEASES =
  "https://www.pib.gov.in/AllReleasem.aspx?lang=1&reg=1";

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables missing.");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function decodeHtml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCharCode(Number(n));
      } catch {
        return "";
      }
    });
}

function stripHtml(value = "") {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(href = "") {
  const clean = decodeHtml(href).trim();

  if (!clean) return "";

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  if (clean.startsWith("//")) {
    return `https:${clean}`;
  }

  if (clean.startsWith("/")) {
    return `https://www.pib.gov.in${clean}`;
  }

  return `https://www.pib.gov.in/${clean}`;
}

function relevanceScore(title = "", content = "") {
  const text = `${title} ${content}`.toLowerCase();

  const keywords = {
    india: 3,
    government: 3,
    parliament: 4,
    constitution: 5,
    "supreme court": 5,
    judiciary: 4,
    governance: 4,
    policy: 3,
    scheme: 4,
    "rbi": 5,
    "sebi": 5,
    economy: 4,
    gdp: 5,
    inflation: 5,
    fiscal: 4,
    monetary: 4,
    budget: 4,
    agriculture: 4,
    farmer: 4,
    crops: 3,
    msp: 5,
    environment: 5,
    climate: 5,
    biodiversity: 5,
    wildlife: 4,
    forest: 4,
    pollution: 4,
    "air quality": 5,
    water: 3,
    river: 3,
    disaster: 4,
    earthquake: 4,
    cyclone: 4,
    isro: 5,
    space: 5,
    satellite: 4,
    science: 4,
    technology: 4,
    "artificial intelligence": 5,
    ai: 3,
    defence: 4,
    defense: 4,
    security: 4,
    terrorism: 5,
    border: 4,
    "international relations": 5,
    "united nations": 4,
    "world bank": 4,
    imf: 4,
    wto: 4,
    who: 4,
    unesco: 4,
    brics: 4,
    sco: 4,
    g20: 4,
    quad: 4,
    asean: 4,
    nepal: 3,
    bangladesh: 3,
    bhutan: 3,
    pakistan: 3,
    china: 3,
    usa: 3,
    russia: 3,
    treaty: 4,
    agreement: 4,
    summit: 4,
    "foreign policy": 5,
    education: 3,
    health: 3,
    "public health": 4,
    "social justice": 5,
    tribal: 4,
    women: 3,
    "child rights": 4,
    "human rights": 4,
    ethics: 4,
    integrity: 4,
    report: 3,
    index: 4,
    survey: 4,
    census: 5,
    data: 3,
    "national park": 4,
    unesco: 4,
    heritage: 4,
    culture: 3,
    archaeology: 4,
    history: 3,
    tourism: 2,
  };

  let score = 0;

  for (const [keyword, points] of Object.entries(keywords)) {
    if (text.includes(keyword)) {
      score += points;
    }
  }

  return score;
}

function extractPIBReleases(html) {
  const releases = [];

  /*
    PIB All Releases page contains links to individual
    PressRelease pages. We collect those links and titles.
  */

  const anchorRegex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = normalizeUrl(match[1]);
    const title = stripHtml(match[2]);

    if (!href || !title) continue;

    const lowerHref = href.toLowerCase();

    const isRelease =
      lowerHref.includes("pressrelease") ||
      lowerHref.includes("press-release") ||
      lowerHref.includes("press_release");

    if (!isRelease) continue;

    if (title.length < 15) continue;

    if (
      title.toLowerCase().includes("click here") ||
      title.toLowerCase().includes("read more") ||
      title.toLowerCase() === "english" ||
      title.toLowerCase() === "hindi"
    ) {
      continue;
    }

    releases.push({
      title,
      url: href,
    });
  }

  return releases;
}

async function fetchPIBPage() {
  const response = await fetch(PIB_ALL_RELEASES, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SAMBHAV-UPSC/1.0)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `PIB page request failed: HTTP ${response.status}`
    );
  }

  const html = await response.text();

  console.log(
    "PIB PAGE STATUS:",
    response.status
  );

  console.log(
    "PIB PAGE LENGTH:",
    html.length
  );

  return html;
}

async function fetchReleaseContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SAMBHAV-UPSC/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return "";
    }

    const html = await response.text();

    /*
      Remove scripts/styles and convert page to readable text.
    */

    const text = stripHtml(html);

    return text.slice(0, 30000);
  } catch (error) {
    console.error(
      "PIB release fetch failed:",
      url,
      error.message
    );

    return "";
  }
}

function removeDuplicates(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.title
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function collectSources() {
  const html = await fetchPIBPage();

  const releases = extractPIBReleases(html);

  console.log(
    "PIB RELEASE LINKS FOUND:",
    releases.length
  );

  if (!releases.length) {
    /*
      Fallback: collect visible release-like text
      so logs clearly show that PIB changed its HTML.
    */

    console.log(
      "PIB PARSER WARNING: No release links detected."
    );

    console.log(
      "PIB HTML START:",
      html.slice(0, 1000)
    );

    return [];
  }

  const collected = [];

  /*
    Fetch only a manageable number of latest releases.
    The page itself is already ordered by latest releases.
  */

  const candidates = releases.slice(0, 35);

  for (const release of candidates) {
    try {
      const content =
        await fetchReleaseContent(release.url);

      const score = relevanceScore(
        release.title,
        content
      );

      console.log(
        "PIB RELEASE:",
        release.title.slice(0, 100),
        "| SCORE:",
        score
      );

      /*
        Score >= 3 means potentially UPSC relevant.
        Final UPSC structuring/relevance is handled by Gemini.
      */

      if (score >= 3) {
        collected.push({
          title: release.title,
          description:
            content || release.title,
          url: release.url,
          source_url: release.url,
          source_name: "Press Information Bureau (PIB)",
          score,
        });
      }
    } catch (error) {
      console.error(
        "Release processing failed:",
        release.title,
        error.message
      );
    }
  }

  return collected;
}

async function createOrResetRun(runDate) {
  const existingResponse = await supabaseRequest(
    `current_affairs_runs?run_date=eq.${runDate}&select=id`,
    {
      method: "GET",
    }
  );

  if (!existingResponse.ok) {
    throw new Error(
      `Run lookup failed: ${await existingResponse.text()}`
    );
  }

  const existing = await existingResponse.json();

  if (existing.length) {
    const updateResponse = await supabaseRequest(
      `current_affairs_runs?run_date=eq.${runDate}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status: "started",
          articles_found: 0,
          articles_created: 0,
          error_message: null,
          completed_at: null,
          started_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(
        `Run reset failed: ${await updateResponse.text()}`
      );
    }

    return;
  }

  const response = await supabaseRequest(
    "current_affairs_runs",
    {
      method: "POST",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        run_date: runDate,
        status: "started",
        articles_found: 0,
        articles_created: 0,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Run creation failed: ${await response.text()}`
    );
  }
}

async function updateRun(runDate, values) {
  try {
    const response = await supabaseRequest(
      `current_affairs_runs?run_date=eq.${runDate}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal",
        },
        body: JSON.stringify(values),
      }
    );

    if (!response.ok) {
      console.error(
        "Run update failed:",
        await response.text()
      );
    }
  } catch (error) {
    console.error(
      "Run update exception:",
      error.message
    );
  }
}

async function generateArticle(item) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sambhav-upsc.vercel.app";

  const response = await fetch(
    `${baseUrl}/api/current-affairs/ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: item.title,
        content: item.description,
        source_name: item.source_name,
        source_url: item.source_url,
        date: todayIST(),
      }),
      cache: "no-store",
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `AI endpoint returned invalid JSON: ${text.slice(
        0,
        500
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "AI article generation failed."
    );
  }

  return data;
}

export async function GET(request) {
  const runDate = todayIST();

  try {
    if (!CRON_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CRON_SECRET environment variable missing.",
        },
        { status: 500 }
      );
    }

    const auth =
      request.headers.get("authorization");

    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    await createOrResetRun(runDate);

    console.log(
      "CURRENT AFFAIRS CRON START:",
      runDate
    );

    const collected =
      await collectSources();

    console.log(
      "TOTAL COLLECTED:",
      collected.length
    );

    const unique =
      removeDuplicates(collected);

    console.log(
      "UNIQUE ARTICLES:",
      unique.length
    );

    const selected = unique
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log(
      "UPSC RELEVANT ARTICLES:",
      selected.length
    );

    await updateRun(runDate, {
      articles_found: selected.length,
    });

    let created = 0;

    for (const item of selected) {
      console.log(
        "PROCESSING:",
        item.title
      );

      try {
        const result =
          await generateArticle(item);

        console.log(
          "AI RESULT:",
          item.title,
          result?.success,
          result?.duplicate
        );

        if (
          result?.success &&
          !result?.duplicate
        ) {
          created++;
        }
      } catch (error) {
        console.error(
          "Article processing failed:",
          item.title,
          error.message
        );
      }
    }

    await updateRun(runDate, {
      status: "success",
      articles_created: created,
      completed_at:
        new Date().toISOString(),
      error_message: null,
    });

    console.log(
      "CURRENT AFFAIRS CRON COMPLETE:",
      {
        date: runDate,
        articles_found: selected.length,
        articles_created: created,
      }
    );

    return NextResponse.json({
      success: true,
      date: runDate,
      source: "PIB All Releases",
      articles_found: selected.length,
      articles_created: created,
    });
  } catch (error) {
    console.error(
      "Current Affairs cron failed:",
      error
    );

    await updateRun(runDate, {
      status: "failed",
      error_message:
        error.message ||
        "Unknown error",
      completed_at:
        new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Current Affairs cron failed.",
      },
      { status: 500 }
    );
  }
    }
