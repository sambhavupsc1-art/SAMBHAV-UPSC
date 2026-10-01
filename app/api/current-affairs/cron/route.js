import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const PIB_URL =
  "https://www.pib.gov.in/AllReleasem.aspx?lang=1&reg=3";

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

function normalizeUrl(value = "") {
  let url = decodeHtml(value)
    .replace(/&amp;/gi, "&")
    .trim();

  if (!url) return "";

  url = url.replace(/^['"]|['"]$/g, "");

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return `https://www.pib.gov.in${url}`;
  }

  return `https://www.pib.gov.in/${url}`;
}

function relevanceScore(title = "", content = "") {
  const text = `${title} ${content}`.toLowerCase();

  const keywords = {
    parliament: 5,
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
    ai: 2,
    defence: 4,
    defense: 4,
    security: 4,
    terrorism: 5,
    border: 4,
    international: 3,
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
    treaty: 4,
    agreement: 4,
    summit: 4,
    "foreign policy": 5,
    education: 3,
    health: 3,
    "social justice": 5,
    tribal: 4,
    women: 3,
    "human rights": 4,
    report: 3,
    index: 4,
    survey: 4,
    census: 5,
    data: 2,
    heritage: 4,
    culture: 3,
    history: 3,
    archaeology: 4,
    "national park": 4,
    critical: 3,
    minerals: 4,
    "green energy": 4,
    renewable: 4,
    electric: 2,
    digital: 3,
    cybersecurity: 5,
    cyber: 4,
    startup: 2,
    innovation: 3,
  };

  let score = 0;

  for (const [keyword, points] of Object.entries(keywords)) {
    if (text.includes(keyword)) {
      score += points;
    }
  }

  return score;
}

/*
  PIB HTML parser

  PIB currently uses ASP.NET-generated links and its HTML structure
  can vary between pages. We therefore do NOT depend on one exact
  anchor format.

  We search the complete HTML for any URL containing:
  PressReleasePage
  pressrelease
  PRID
*/

function extractReleaseLinks(html) {
  const results = [];
  const seen = new Set();

  function add(url, title = "") {
    const cleanUrl = normalizeUrl(url);
    const cleanTitle = stripHtml(title);

    if (!cleanUrl) return;

    const lower = cleanUrl.toLowerCase();

    const valid =
      lower.includes("pressreleasepage") ||
      lower.includes("pressrelease") ||
      lower.includes("prid=");

    if (!valid) return;

    if (seen.has(cleanUrl)) return;

    seen.add(cleanUrl);

    results.push({
      url: cleanUrl,
      title:
        cleanTitle.length >= 10
          ? cleanTitle
          : "",
    });
  }

  /*
    Format 1:
    <a href="PressReleasePage.aspx?PRID=123">TITLE</a>
  */

  const anchorRegex =
    /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    add(match[1], match[2]);
  }

  /*
    Format 2:
    href may contain HTML entities / extra attributes.
  */

  const hrefRegex =
    /href\s*=\s*["']([^"']*(?:PressReleasePage|pressrelease|PRID=)[^"']*)["']/gi;

  while ((match = hrefRegex.exec(html)) !== null) {
    const url = normalizeUrl(match[1]);

    if (!seen.has(url)) {
      add(url, "");
    }
  }

  /*
    Format 3:
    URL can occur inside JavaScript / onclick.
  */

  const jsRegex =
    /(?:PressReleasePage\.aspx|pressreleasepage\.aspx)[^"' )<]*/gi;

  while ((match = jsRegex.exec(html)) !== null) {
    add(match[0], "");
  }

  return results;
}

/*
  Extract release titles from the visible HTML.

  This is a fallback for pages where PIB sends the title in one
  HTML block and the actual URL separately.
*/

function extractVisibleTitles(html) {
  const titles = [];

  const patterns = [
    /<a\b[^>]*>([\s\S]*?)<\/a>/gi,
    /<td\b[^>]*>([\s\S]*?)<\/td>/gi,
    /<div\b[^>]*>([\s\S]*?)<\/div>/gi,
  ];

  for (const regex of patterns) {
    let match;

    while ((match = regex.exec(html)) !== null) {
      const text = stripHtml(match[1]);

      if (
        text.length >= 25 &&
        text.length <= 500 &&
        !text.toLowerCase().includes("select") &&
        !text.toLowerCase().includes("login") &&
        !text.toLowerCase().includes("copyright")
      ) {
        titles.push(text);
      }
    }
  }

  return [...new Set(titles)];
}

async function fetchPIBPage() {
  const response = await fetch(PIB_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SAMBHAV-UPSC/1.0)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `PIB page request failed: HTTP ${response.status}`
    );
  }

  const html = await response.text();

  console.log("PIB PAGE STATUS:", response.status);
  console.log("PIB PAGE LENGTH:", html.length);

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
        "Accept-Language": "en-IN,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.log(
        "RELEASE HTTP:",
        response.status,
        url
      );

      return "";
    }

    const html = await response.text();

    return stripHtml(html).slice(0, 30000);
  } catch (error) {
    console.error(
      "Release fetch failed:",
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

  const releaseLinks = extractReleaseLinks(html);

  console.log(
    "PIB RELEASE LINKS FOUND:",
    releaseLinks.length
  );

  /*
    Debug information if PIB changes its HTML again.
  */

  if (!releaseLinks.length) {
    console.log(
      "PIB RELEASE LINK PARSER FAILED."
    );

    console.log(
      "HAS PRESSRELEASEPAGE:",
      /pressreleasepage/i.test(html)
    );

    console.log(
      "HAS PRID:",
      /prid=/i.test(html)
    );

    const titles =
      extractVisibleTitles(html);

    console.log(
      "VISIBLE TITLES FOUND:",
      titles.length
    );

    console.log(
      "HTML RELEASE SAMPLE:",
      html.match(
        /.{0,150}(PressRelease|PRID).{0,250}/i
      )?.[0] || "NONE"
    );

    return [];
  }

  const candidates =
    releaseLinks.slice(0, 40);

  const collected = [];

  for (const release of candidates) {
    try {
      let content = "";

      if (release.url) {
        content =
          await fetchReleaseContent(
            release.url
          );
      }

      const title =
        release.title ||
        content.slice(0, 300);

      if (!title) continue;

      const score = relevanceScore(
        title,
        content
      );

      console.log(
        "PIB RELEASE:",
        title.slice(0, 120),
        "| SCORE:",
        score
      );

      /*
        Keep moderately relevant releases.
        Gemini performs the final UPSC relevance
        + classification.
      */

      if (score >= 2) {
        collected.push({
          title,
          description:
            content || title,
          url: release.url,
          source_url: release.url,
          source_name:
            "Press Information Bureau (PIB)",
          score,
        });
      }
    } catch (error) {
      console.error(
        "Release processing failed:",
        error.message
      );
    }
  }

  return collected;
}

async function createOrResetRun(runDate) {
  const existingResponse =
    await supabaseRequest(
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

  const existing =
    await existingResponse.json();

  if (existing.length > 0) {
    const response =
      await supabaseRequest(
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
            started_at:
              new Date().toISOString(),
          }),
        }
      );

    if (!response.ok) {
      throw new Error(
        `Run reset failed: ${await response.text()}`
      );
    }

    return;
  }

  const response =
    await supabaseRequest(
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
    const response =
      await supabaseRequest(
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
      "Run update error:",
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

  const text =
    await response.text();

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
      request.headers.get(
        "authorization"
      );

    if (
      auth !==
      `Bearer ${CRON_SECRET}`
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    await createOrResetRun(
      runDate
    );

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
      removeDuplicates(
        collected
      );

    console.log(
      "UNIQUE ARTICLES:",
      unique.length
    );

    const selected =
      unique
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .slice(0, 10);

    console.log(
      "UPSC RELEVANT ARTICLES:",
      selected.length
    );

    await updateRun(
      runDate,
      {
        articles_found:
          selected.length,
      }
    );

    let created = 0;

    for (const item of selected) {
      console.log(
        "PROCESSING:",
        item.title
      );

      try {
        const result =
          await generateArticle(
            item
          );

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

    await updateRun(
      runDate,
      {
        status: "success",
        articles_created:
          created,
        error_message: null,
        completed_at:
          new Date().toISOString(),
      }
    );

    console.log(
      "CURRENT AFFAIRS CRON COMPLETE:",
      {
        date: runDate,
        articles_found:
          selected.length,
        articles_created:
          created,
      }
    );

    return NextResponse.json({
      success: true,
      date: runDate,
      source:
        "PIB All Releases",
      articles_found:
        selected.length,
      articles_created:
        created,
    });
  } catch (error) {
    console.error(
      "Current Affairs cron failed:",
      error
    );

    await updateRun(
      runDate,
      {
        status: "failed",
        error_message:
          error.message ||
          "Unknown error",
        completed_at:
          new Date().toISOString(),
      }
    );

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
