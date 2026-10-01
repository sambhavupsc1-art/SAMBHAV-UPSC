import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

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

function stripHtml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return "";
      }
    })
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tags = []) {
  for (const tag of tags) {
    const match = block.match(
      new RegExp(
        `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
        "i"
      )
    );

    if (match?.[1]) {
      return stripHtml(match[1]);
    }
  }

  return "";
}

function getLink(block) {
  const linkTag = block.match(
    /<link[^>]*>([\s\S]*?)<\/link>/i
  );

  if (linkTag?.[1]) {
    return stripHtml(linkTag[1]);
  }

  const href = block.match(
    /<link[^>]+href=["']([^"']+)["'][^>]*>/i
  );

  return stripHtml(href?.[1] || "");
}

function extractItems(xml) {
  const items = [];

  const rssItems =
    xml.match(
      /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi
    ) || [];

  for (const block of rssItems) {
    const title = getTag(block, ["title"]);

    const description = getTag(block, [
      "description",
      "content:encoded",
      "summary",
    ]);

    const url = getLink(block);

    const published = getTag(block, [
      "pubDate",
      "dc:date",
      "published",
      "updated",
    ]);

    if (title) {
      items.push({
        title,
        description,
        url,
        published,
      });
    }
  }

  const atomItems =
    xml.match(
      /<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi
    ) || [];

  for (const block of atomItems) {
    const title = getTag(block, ["title"]);

    const description = getTag(block, [
      "summary",
      "content",
      "description",
    ]);

    const url = getLink(block);

    const published = getTag(block, [
      "published",
      "updated",
      "dc:date",
    ]);

    if (title) {
      items.push({
        title,
        description,
        url,
        published,
      });
    }
  }

  return items;
}

function sourceNameFromUrl(url) {
  try {
    const hostname = new URL(url)
      .hostname
      .toLowerCase();

    if (hostname.includes("pib.gov.in")) {
      return "Press Information Bureau (PIB)";
    }

    if (hostname.includes("rbi.org.in")) {
      return "Reserve Bank of India (RBI)";
    }

    if (hostname.includes("gov.in")) {
      return "Government of India";
    }

    return hostname;
  } catch {
    return "Official Source";
  }
}

function relevanceScore(title, description = "") {
  const text =
    `${title} ${description}`.toLowerCase();

  const keywords = [
    "india",
    "government",
    "parliament",
    "supreme court",
    "high court",
    "constitution",
    "constitutional",
    "governance",
    "policy",
    "scheme",
    "ministry",
    "cabinet",
    "rbi",
    "sebi",
    "niti aayog",
    "gdp",
    "inflation",
    "fiscal",
    "monetary",
    "economy",
    "economic",
    "banking",
    "finance",
    "tax",
    "budget",
    "agriculture",
    "farmer",
    "msp",
    "crop",
    "food security",
    "environment",
    "climate",
    "biodiversity",
    "wildlife",
    "forest",
    "pollution",
    "renewable",
    "energy",
    "water",
    "disaster",
    "cyclone",
    "flood",
    "drought",
    "isro",
    "space",
    "science",
    "technology",
    "artificial intelligence",
    "ai",
    "digital",
    "semiconductor",
    "defence",
    "defense",
    "security",
    "cyber",
    "terrorism",
    "international",
    "foreign policy",
    "united nations",
    "world bank",
    "imf",
    "wto",
    "who",
    "unesco",
    "brics",
    "sco",
    "g20",
    "quad",
    "asean",
    "nepal",
    "bangladesh",
    "bhutan",
    "pakistan",
    "china",
    "russia",
    "usa",
    "election",
    "judiciary",
    "rights",
    "social justice",
    "education",
    "health",
    "report",
    "index",
    "survey",
    "data",
    "statistics",
  ];

  let score = 0;

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      score++;
    }
  }

  return score;
}

function selectRelevant(items) {
  return items
    .map((item) => ({
      ...item,
      score: relevanceScore(
        item.title,
        item.description
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
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
  const raw =
    process.env.CURRENT_AFFAIRS_RSS_URLS || "";

  const urls = raw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (!urls.length) {
    throw new Error(
      "CURRENT_AFFAIRS_RSS_URLS environment variable missing."
    );
  }

  const allItems = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "SAMBHAV-UPSC-Current-Affairs/1.0",
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(
          "Source HTTP error:",
          response.status,
          url
        );
        continue;
      }

      const xml = await response.text();

      console.log(
        "SOURCE RESPONSE LENGTH:",
        xml.length
      );

      const items = extractItems(xml);

      console.log(
        "SOURCE ITEMS FOUND:",
        items.length
      );

      const sourceName =
        sourceNameFromUrl(url);

      for (const item of items) {
        if (!item.title) continue;

        allItems.push({
          ...item,
          source_url:
            item.url || url,
          source_name:
            sourceName,
        });
      }
    } catch (error) {
      console.error(
        "Source fetch failed:",
        url,
        error.message
      );
    }
  }

  return allItems;
}

async function createOrResetRun(runDate) {
  const existingResponse =
    await supabaseRequest(
      `current_affairs_runs?run_date=eq.${runDate}&select=id&limit=1`
    );

  if (existingResponse.ok) {
    const existing =
      await existingResponse.json();

    if (existing.length > 0) {
      await supabaseRequest(
        `current_affairs_runs?run_date=eq.${runDate}`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=representation",
          },
          body: JSON.stringify({
            status: "started",
            articles_found: 0,
            articles_created: 0,
            error_message: null,
            started_at:
              new Date().toISOString(),
            completed_at: null,
          }),
        }
      );

      return;
    }
  }

  const response =
    await supabaseRequest(
      "current_affairs_runs",
      {
        method: "POST",
        headers: {
          Prefer:
            "return=representation",
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
    const text =
      await response.text();

    throw new Error(
      `Run creation failed: ${text}`
    );
  }
}

async function updateRun(
  runDate,
  values
) {
  const response =
    await supabaseRequest(
      `current_affairs_runs?run_date=eq.${runDate}`,
      {
        method: "PATCH",
        headers: {
          Prefer:
            "return=representation",
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
}

async function generateArticle(item) {
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
          title: item.title,
          content:
            item.description ||
            item.title,
          source_name:
            item.source_name,
          source_url:
            item.source_url,
          date: todayIST(),
        }),
        cache: "no-store",
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "AI article generation failed."
    );
  }

  return data;
}

export async function GET(request) {
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

    const runDate =
      todayIST();

    await createOrResetRun(
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
      selectRelevant(unique);

    console.log(
      "UPSС RELEVANT ARTICLES:",
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

    for (
      const item of selected
    ) {
      try {
        console.log(
          "PROCESSING:",
          item.title
        );

        const result =
          await generateArticle(
            item
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
        completed_at:
          new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      date: runDate,
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

    try {
      await updateRun(
        todayIST(),
        {
          status: "failed",
          error_message:
            error.message ||
            "Unknown error",
          completed_at:
            new Date().toISOString(),
        }
      );
    } catch {}

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
