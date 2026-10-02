import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const PIB_URL =
  "https://www.pib.gov.in/AllReleasem.aspx?lang=1&reg=3";

/* ---------------------------------------
   SUPABASE
--------------------------------------- */

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

/* ---------------------------------------
   DATE - IST
--------------------------------------- */

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/* ---------------------------------------
   HTML HELPERS
--------------------------------------- */

function decodeHtml(value = "") {
  return value
    .replace(
      /<!\[CDATA\[([\s\S]*?)\]\]>/gi,
      "$1"
    )
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

/* ---------------------------------------
   URL NORMALIZATION
--------------------------------------- */

function normalizeUrl(value = "") {
  let url = decodeHtml(value)
    .replace(/&amp;/gi, "&")
    .replace(/^['"]|['"]$/g, "")
    .trim();

  if (!url) return "";

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

/* ---------------------------------------
   UPSC RELEVANCE
--------------------------------------- */

function relevanceScore(title = "", content = "") {
  const text =
    `${title} ${content}`.toLowerCase();

  const keywords = {
    parliament: 5,
    constitution: 5,
    "supreme court": 5,
    judiciary: 4,
    governance: 4,
    policy: 3,
    scheme: 4,
    legislation: 5,
    bill: 4,
    election: 4,
    federal: 4,
    "local government": 4,
    "public administration": 4,
    transparency: 4,
    accountability: 4,

    rbi: 5,
    sebi: 5,
    economy: 4,
    economic: 3,
    gdp: 5,
    inflation: 5,
    fiscal: 4,
    monetary: 4,
    budget: 4,
    taxation: 4,
    tax: 3,
    trade: 4,
    exports: 4,
    imports: 4,
    investment: 4,
    manufacturing: 4,
    industry: 4,
    employment: 4,
    unemployment: 4,
    banking: 4,
    finance: 4,
    financial: 4,
    "current account": 5,
    "balance of payments": 5,
    subsidy: 4,
    "public expenditure": 4,

    agriculture: 4,
    agricultural: 4,
    farmer: 4,
    farmers: 4,
    crops: 3,
    crop: 3,
    msp: 5,
    irrigation: 4,
    fertilizer: 4,
    fertiliser: 4,
    foodgrain: 4,
    foodgrains: 4,
    food: 3,
    "food security": 5,
    "agricultural research": 5,
    storage: 3,

    environment: 5,
    climate: 5,
    biodiversity: 5,
    wildlife: 4,
    forest: 4,
    pollution: 4,
    water: 3,
    river: 3,
    wetland: 4,
    ecosystem: 5,
    conservation: 4,
    "climate change": 5,
    emissions: 4,
    carbon: 4,
    renewable: 4,
    "green energy": 4,
    sustainability: 4,
    sustainable: 3,

    disaster: 4,
    earthquake: 4,
    cyclone: 4,
    flood: 4,
    drought: 4,
    landslide: 4,
    tsunami: 5,
    resilience: 4,

    isro: 5,
    space: 5,
    satellite: 4,
    science: 4,
    technology: 4,
    "artificial intelligence": 5,
    ai: 2,
    biotechnology: 5,
    semiconductor: 5,
    quantum: 5,
    genome: 5,
    genomics: 5,
    vaccine: 4,
    research: 4,
    innovation: 3,
    digital: 3,
    cybersecurity: 5,
    cyber: 4,
    "digital public infrastructure": 5,
    "digital india": 5,

    defence: 4,
    defense: 4,
    security: 4,
    terrorism: 5,
    terrorist: 5,
    border: 4,
    maritime: 4,
    navy: 4,
    naval: 4,
    military: 4,
    "internal security": 5,
    insurgency: 5,
    extremism: 4,

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
    g20: 5,
    quad: 5,
    asean: 4,
    treaty: 4,
    agreement: 4,
    summit: 4,
    "foreign policy": 5,
    diplomacy: 4,
    diplomatic: 4,
    bilateral: 4,
    multilateral: 4,
    "strategic partnership": 5,

    education: 3,
    health: 3,
    "public health": 4,
    healthcare: 4,
    tribal: 4,
    tribes: 4,
    women: 3,
    child: 3,
    children: 3,
    "human rights": 4,
    "social justice": 5,
    poverty: 4,
    nutrition: 4,
    sanitation: 3,
    welfare: 3,
    inclusion: 4,

    report: 3,
    index: 4,
    survey: 4,
    census: 5,
    data: 2,
    statistics: 4,
    indicator: 4,

    heritage: 4,
    culture: 3,
    history: 3,
    archaeology: 4,
    archaeological: 4,
    monument: 3,
    "national park": 4,
    biosphere: 5,
    geography: 3,
    tourism: 2,
    mineral: 3,
    minerals: 3,
    mining: 3,

    telecom: 4,
    telecommunications: 4,
    broadband: 4,
    bharatnet: 5,
    "digital bharat nidhi": 5,
    infrastructure: 4,
    connectivity: 4,
    "public service": 4,
    "civil services": 4,
  };

  let score = 0;

  for (const [keyword, points] of Object.entries(
    keywords
  )) {
    if (text.includes(keyword)) {
      score += points;
    }
  }

  return score;
}

/* ---------------------------------------
   LOW-VALUE PIB NOISE FILTER
--------------------------------------- */

function isLowValueNoise(title = "", content = "") {
  const text =
    `${title} ${content}`.toLowerCase();

  const noisePatterns = [
    "birthday greetings",
    "extends birthday greetings",
    "greetings on the eve",
    "congratulates indian",
    "congratulates ",
    "lauds captain",
    "immense courage and valour",
    "courage and valour in saving lives",
    "meets prime minister",
    "pays tributes",
    "tributes to former",
    "sanskrit subhashitam",
    "cleanliness drive",
    "blood donation camp",
    "shramdaan",
    "swachhata hi sewa",
    "swachhata hi seva",
  ];

  return noisePatterns.some(
    (pattern) => text.includes(pattern)
  );
}

/* ---------------------------------------
   PIB PARSER
--------------------------------------- */

function extractReleaseLinks(html) {
  const results = [];
  const seen = new Set();

  function add(url, title = "") {
    if (!url) return;

    let cleanUrl = decodeHtml(url)
      .replace(/&amp;/gi, "&")
      .replace(/^['"]|['"]$/g, "")
      .trim();

    if (!cleanUrl) return;

    if (cleanUrl.startsWith("/")) {
      cleanUrl =
        `https://www.pib.gov.in${cleanUrl}`;
    } else if (cleanUrl.startsWith("//")) {
      cleanUrl = `https:${cleanUrl}`;
    } else if (
      !/^https?:\/\//i.test(cleanUrl)
    ) {
      cleanUrl =
        `https://www.pib.gov.in/${cleanUrl}`;
    }

    const lower =
      cleanUrl.toLowerCase();

    if (
      !lower.includes("pressrelesedetail") &&
      !lower.includes("pressreleasedetail") &&
      !lower.includes("prid=")
    ) {
      return;
    }

    if (seen.has(cleanUrl)) {
      return;
    }

    seen.add(cleanUrl);

    results.push({
      url: cleanUrl,
      title: stripHtml(title),
    });
  }

  const anchorRegex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match = anchorRegex.exec(html)) !== null
  ) {
    add(match[1], match[2]);
  }

  const hrefRegex =
    /href\s*=\s*["']([^"']*(?:PressReleseDetailm|PressReleaseDetailm)[^"']*)["']/gi;

  while (
    (match = hrefRegex.exec(html)) !== null
  ) {
    add(match[1], "");
  }

  const directRegex =
    /(?:https?:\/\/)?(?:www\.)?pib\.gov\.in\/PressReleseDetailm\.aspx\?[^"'<> ]+/gi;

  while (
    (match = directRegex.exec(html)) !== null
  ) {
    add(match[0], "");
  }

  const relativeRegex =
    /PressReleseDetailm\.aspx\?[^"'<> )]+/gi;

  while (
    (match = relativeRegex.exec(html)) !== null
  ) {
    add(match[0], "");
  }

  const pridRegex =
    /(?:PressReleseDetailm|PressReleaseDetailm)\.aspx[^"'<>]*?PRID\s*=\s*(\d+)/gi;

  while (
    (match = pridRegex.exec(html)) !== null
  ) {
    add(
      `https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=${match[1]}`,
      ""
    );
  }

  return results;
}

/* ---------------------------------------
   PIB PAGE
--------------------------------------- */

async function fetchPIBPage() {
  const response = await fetch(
    PIB_URL,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SAMBHAV-UPSC/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language":
          "en-IN,en;q=0.9",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `PIB page request failed: HTTP ${response.status}`
    );
  }

  const html =
    await response.text();

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

/* ---------------------------------------
   INDIVIDUAL PIB RELEASE
--------------------------------------- */

async function fetchReleaseContent(url) {
  try {
    const response = await fetch(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SAMBHAV-UPSC/1.0)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language":
            "en-IN,en;q=0.9",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.log(
        "RELEASE HTTP:",
        response.status,
        url
      );

      return "";
    }

    const html =
      await response.text();

    return stripHtml(html).slice(
      0,
      30000
    );
  } catch (error) {
    console.error(
      "Release fetch failed:",
      error.message
    );

    return "";
  }
}

/* ---------------------------------------
   DUPLICATE REMOVAL
--------------------------------------- */

function removeDuplicates(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key =
      item.title
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

/* ---------------------------------------
   COLLECT PIB ARTICLES
--------------------------------------- */

async function collectSources() {
  const html =
    await fetchPIBPage();

  const releaseLinks =
    extractReleaseLinks(html);

  console.log(
    "PIB RELEASE LINKS FOUND:",
    releaseLinks.length
  );

  if (!releaseLinks.length) {
    console.log(
      "PIB RELEASE LINK PARSER FAILED."
    );

    console.log(
      "HAS PRESSRELESEDETAIL:",
      /pressrelesedetail/i.test(html)
    );

    console.log(
      "HAS PRESSRELEASEDETAIL:",
      /pressreleasedetail/i.test(html)
    );

    console.log(
      "HAS PRID:",
      /prid=/i.test(html)
    );

    const pridPosition =
      html
        .toLowerCase()
        .indexOf("prid");

    if (pridPosition >= 0) {
      console.log(
        "PRID HTML SAMPLE:",
        html.slice(
          Math.max(
            0,
            pridPosition - 500
          ),
          pridPosition + 1000
        )
      );
    }

    return [];
  }

  const candidates =
    releaseLinks.slice(0, 35);

  console.log(
    "PIB CANDIDATES:",
    candidates.length
  );

  const collected = [];

  for (const release of candidates) {
    try {
      const content =
        await fetchReleaseContent(
          release.url
        );

      const title =
        release.title ||
        content.slice(0, 300);

      if (!title) {
        continue;
      }

      const score =
        relevanceScore(
          title,
          content
        );

      const noise =
        isLowValueNoise(
          title,
          content
        );

      console.log(
        "PIB RELEASE:",
        title.slice(0, 120),
        "| SCORE:",
        score,
        "| NOISE:",
        noise
      );

      if (noise) {
        continue;
      }

      if (score >= 4) {
        collected.push({
          title,
          description:
            content || title,
          url: release.url,
          source_url:
            release.url,
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

/* ---------------------------------------
   RUN TRACKING
--------------------------------------- */

async function createOrResetRun(
  runDate
) {
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
            Prefer:
              "return=minimal",
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
          Prefer:
            "return=minimal",
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

async function updateRun(
  runDate,
  values
) {
  try {
    const response =
      await supabaseRequest(
        `current_affairs_runs?run_date=eq.${runDate}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal",
          },
          body: JSON.stringify(
            values
          ),
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

/* ---------------------------------------
   BATCH AI ARTICLE CREATION
--------------------------------------- */

async function generateArticleBatch(
  items
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sambhav-upsc.vercel.app";

  const response =
    await fetch(
      `${baseUrl}/api/current-affairs/ai`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          items,
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
        `AI batch generation failed with HTTP ${response.status}.`
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        "AI endpoint reported failure."
    );
  }

  return data;
}

/* ---------------------------------------
   CRON GET
--------------------------------------- */

export async function GET(
  request
) {
  const runDate =
    todayIST();

  try {
    /* -----------------------------------
       CRON AUTH
    ----------------------------------- */

    if (!CRON_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CRON_SECRET environment variable missing.",
        },
        {
          status: 500,
        }
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
        {
          status: 401,
        }
      );
    }

    console.log(
      "CURRENT AFFAIRS CRON START:",
      runDate
    );

    /* -----------------------------------
       START RUN
    ----------------------------------- */

    await createOrResetRun(
      runDate
    );

    /* -----------------------------------
       COLLECT PIB
    ----------------------------------- */

    const collected =
      await collectSources();

    console.log(
      "TOTAL COLLECTED:",
      collected.length
    );

    /* -----------------------------------
       DEDUPLICATION
    ----------------------------------- */

    const unique =
      removeDuplicates(
        collected
      );

    console.log(
      "UNIQUE ARTICLES:",
      unique.length
    );

    /* -----------------------------------
       SELECT TOP UPSC ARTICLES
    ----------------------------------- */

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

    selected.forEach(
      (item, index) => {
        console.log(
          `SELECTED ${index + 1}:`,
          item.title,
          "| SCORE:",
          item.score
        );
      }
    );

    await updateRun(
      runDate,
      {
        articles_found:
          selected.length,
      }
    );

    /* -----------------------------------
       NO ARTICLES
    ----------------------------------- */

    if (!selected.length) {
      await updateRun(
        runDate,
        {
          status: "success",
          articles_found: 0,
          articles_created: 0,
          error_message:
            "No UPSC-relevant PIB articles found.",
          completed_at:
            new Date().toISOString(),
        }
      );

      console.log(
        "CURRENT AFFAIRS CRON COMPLETE:",
        {
          date: runDate,
          articles_found: 0,
          articles_created: 0,
        }
      );

      return NextResponse.json({
        success: true,
        date: runDate,
        source:
          "PIB All Releases",
        articles_found: 0,
        articles_created: 0,
      });
    }

    /* -----------------------------------
       ONE BATCH GEMINI REQUEST
    ----------------------------------- */

    let created = 0;
    let aiError = null;

    console.log(
      "BATCH PROCESSING START:",
      selected.length,
      "articles"
    );

    try {
      const result =
        await generateArticleBatch(
          selected.map(
            (item) => ({
              title:
                item.title,
              content:
                item.description,
              source_name:
                item.source_name,
              source_url:
                item.source_url,
              date:
                runDate,
            })
          )
        );

      console.log(
        "AI BATCH RESULT:",
        result?.success,
        result?.articles_received,
        result?.articles_created
      );

      created =
        Number(
          result?.articles_created ||
            0
        );

      if (
        !result?.success ||
        created <= 0
      ) {
        aiError =
          result?.error ||
          "AI processing completed without creating articles.";
      }
    } catch (error) {
      aiError =
        error?.message ||
        "AI batch processing failed.";

      console.error(
        "BATCH ARTICLE PROCESSING FAILED:",
        aiError
      );
    }

    /* -----------------------------------
       STRICT SUCCESS CHECK
    ----------------------------------- */

    /*
     * IMPORTANT:
     *
     * AI fail OR zero articles created
     * must NEVER be marked as success.
     */

    if (
      aiError ||
      created <= 0
    ) {
      const finalError =
        aiError ||
        "AI processing failed or no articles were created.";

      await updateRun(
        runDate,
        {
          status: "failed",
          articles_found:
            selected.length,
          articles_created:
            created,
          error_message:
            finalError,
          completed_at:
            new Date().toISOString(),
        }
      );

      console.error(
        "CURRENT AFFAIRS CRON FAILED:",
        {
          date: runDate,
          articles_found:
            selected.length,
          articles_created:
            created,
          error:
            finalError,
        }
      );

      return NextResponse.json(
        {
          success: false,
          date: runDate,
          source:
            "PIB All Releases",
          articles_found:
            selected.length,
          articles_created:
            created,
          error:
            finalError,
        },
        {
          status: 503,
        }
      );
    }

    /* -----------------------------------
       SUCCESS
    ----------------------------------- */

    await updateRun(
      runDate,
      {
        status: "success",
        articles_found:
          selected.length,
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
          error?.message ||
          "Unknown error",
        completed_at:
          new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Current Affairs cron failed.",
      },
      {
        status: 500,
      }
    );
  }
}
